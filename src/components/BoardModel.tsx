/* ============================================================
   components/BoardModel.tsx — the real ESP32 board, in 3D.
   Source: Altium PCB exported to STEP, tessellated with
   occt-import-js and packed to glb by scripts/build-esp32-glb.mjs.
   Parts keep their designators (R1, IC1, J4 ...) as node names.

   Two layers of colour work happen here:

   1. Copper, silkscreen and vias are not in the STEP. They are baked
      from the PCB document itself by scripts/build-esp32-art.py into
      board-top.png, and laid onto the board's top faces as a second
      material (planar UVs in the document's own millimetre frame).

   2. Altium's STEP colours are close but flat: a whole part gets one
      colour, so pins, terminations and bodies come out identical. The
      STEP does keep them as separate surfaces, so the parts below are
      split by geometry (height, footprint, long axis) and re-coloured:
      metal terminations, black plastic bodies, the ESP32 shield can,
      its antenna end, the gold castellated edge and the button caps.

   Interaction: slow turntable, drag to rotate. No zoom, no pan.
   ============================================================ */

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_SRC = '/models/esp32/board.glb'
const ART_SRC = '/models/esp32/board-top.png'

/* the board's extents in the document's millimetre frame; board-top.png was
   baked over exactly this box, so the UVs below line up with it */
const BOARD_MM = { x0: 81, y0: 58, w: 69, h: 35 }

/* solder mask: the purple board, and the sides must match the baked top */
const MASK_COLOR = '#3a2260'

/* glTF nodes are named after designators (Board, IC1, R8 ...). A node with one
   primitive becomes a Mesh carrying that name; a node with several becomes a
   Group, so walk up until a designator shows up. */
const DESIGNATOR = /^(Board|IC\d+|J\d+|R\d+|C\d+|D\d+|Q\d+|S\d+)$/

function designatorOf(obj: THREE.Object3D | null): string {
  let o: THREE.Object3D | null = obj
  while (o) {
    const n = (o.name || '').trim()
    if (DESIGNATOR.test(n)) return n
    o = o.parent
  }
  return ''
}

/* ---- materials ------------------------------------------------------- */
const mat = (
  color: string,
  roughness: number,
  metalness: number,
  extra?: THREE.MeshStandardMaterialParameters,
) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra })

const MATS = {
  /* tin-plated terminations, leads, pins */
  metal: mat('#b7bbc1', 0.34, 0.78),
  /* ENIG: the ESP32 module's castellated edge */
  gold: mat('#c2a03a', 0.32, 0.82),
  /* resistor / diode / transistor moulding */
  plastic: mat('#191a1d', 0.56, 0.04),
  /* MLCC body: beige ceramic */
  ceramic: mat('#c6b189', 0.72, 0.02),
  /* ESP32 shield can: nickel silver */
  can: mat('#c6cad0', 0.33, 0.62),
  /* the module's own PCB, seen at the antenna end */
  modulePcb: mat('#1c2a22', 0.76, 0.04),
  /* tactile switch body and cap */
  switchBody: mat('#151619', 0.6, 0.03),
  switchCap: mat('#cfc5ae', 0.52, 0.02),
} as const

const SUBSTRATE = mat(MASK_COLOR, 0.62, 0.05)

/* ---- geometry helpers ------------------------------------------------ */

/** Triangle vertex indices of a geometry, indexed or not. */
function triangles(geo: THREE.BufferGeometry): [number, number, number][] {
  const index = geo.getIndex()
  const count = index ? index.count : geo.getAttribute('position').count
  const out: [number, number, number][] = []
  for (let t = 0; t + 2 < count; t += 3) {
    out.push(
      index
        ? [index.getX(t), index.getX(t + 1), index.getX(t + 2)]
        : [t, t + 1, t + 2],
    )
  }
  return out
}

/** Build a non-indexed geometry from a subset of triangles. */
function subGeometry(geo: THREE.BufferGeometry, tris: [number, number, number][]) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const nrm = geo.getAttribute('normal') as THREE.BufferAttribute | null
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute | null
  const p: number[] = []
  const n: number[] = []
  const u: number[] = []
  for (const tri of tris) {
    for (const i of tri) {
      p.push(pos.getX(i), pos.getY(i), pos.getZ(i))
      if (nrm) n.push(nrm.getX(i), nrm.getY(i), nrm.getZ(i))
      if (uv) u.push(uv.getX(i), uv.getY(i))
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
  if (nrm) g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3))
  else g.computeVertexNormals()
  if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2))
  return g
}

interface TriInfo {
  cx: number
  cy: number
  cz: number
  /** face normal, local to the part */
  nx: number
  ny: number
  nz: number
}

/** Split a mesh into one geometry per label returned by `classify`. */
function splitBy(
  geo: THREE.BufferGeometry,
  classify: (t: TriInfo) => string | null,
): Map<string, THREE.BufferGeometry> {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const buckets = new Map<string, [number, number, number][]>()
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  const n = new THREE.Vector3()

  for (const tri of triangles(geo)) {
    a.fromBufferAttribute(pos, tri[0])
    b.fromBufferAttribute(pos, tri[1])
    c.fromBufferAttribute(pos, tri[2])
    ab.subVectors(b, a)
    ac.subVectors(c, a)
    n.crossVectors(ab, ac).normalize()
    const label = classify({
      cx: (a.x + b.x + c.x) / 3,
      cy: (a.y + b.y + c.y) / 3,
      cz: (a.z + b.z + c.z) / 3,
      nx: n.x,
      ny: n.y,
      nz: n.z,
    })
    if (!label) continue
    const list = buckets.get(label)
    if (list) list.push(tri)
    else buckets.set(label, [tri])
  }

  const out = new Map<string, THREE.BufferGeometry>()
  for (const [label, tris] of buckets) out.set(label, subGeometry(geo, tris))
  return out
}

function bboxOf(mesh: THREE.Mesh) {
  const geo = mesh.geometry as THREE.BufferGeometry
  geo.computeBoundingBox()
  const box = geo.boundingBox!.clone()
  return box
}

/**
 * Split a part into moulding and metal leads/pins.
 *
 * The leads are the slab at the bottom of the part, and the moulding is
 * everything above it, so the body footprint is measured from that upper
 * region instead of guessed from the overall bounding box.
 */
function splitLeads(
  geo: THREE.BufferGeometry,
  box: THREE.Box3,
  lowFraction: number,
  body: THREE.Material,
  metal: THREE.Material,
) {
  const low = box.min.z + (box.max.z - box.min.z) * lowFraction
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const bodyBox = new THREE.Box3()
  const v = new THREE.Vector3()
  for (const tri of triangles(geo)) {
    const z = (pos.getZ(tri[0]) + pos.getZ(tri[1]) + pos.getZ(tri[2])) / 3
    if (z <= low) continue
    for (const i of tri) {
      v.fromBufferAttribute(pos, i)
      bodyBox.expandByPoint(v)
    }
  }
  const slack = 0.02
  const cut = splitBy(geo, (t) => {
    if (t.cz > low) return 'body'
    const outside =
      t.cx < bodyBox.min.x - slack ||
      t.cx > bodyBox.max.x + slack ||
      t.cy < bodyBox.min.y - slack ||
      t.cy > bodyBox.max.y + slack
    return outside ? 'metal' : 'body'
  })
  return { cut, materials: { body, metal } }
}

function meshesOf(root: THREE.Object3D) {
  const out: THREE.Mesh[] = []
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) out.push(o as THREE.Mesh)
  })
  return out
}

/** Replace a mesh with one mesh per labelled sub-geometry. */
function replaceWith(
  mesh: THREE.Mesh,
  parts: Map<string, THREE.BufferGeometry>,
  materials: Record<string, THREE.Material>,
  parent: THREE.Object3D,
) {
  for (const [label, geo] of parts) {
    const m = new THREE.Mesh(geo, materials[label] ?? (mesh.material as THREE.Material))
    m.name = `${mesh.name || 'part'}:${label}`
    // a single-primitive glTF node carries the node transform on the mesh
    // itself, so every piece of it has to inherit that transform
    m.position.copy(mesh.position)
    m.quaternion.copy(mesh.quaternion)
    m.scale.copy(mesh.scale)
    parent.add(m)
  }
  parent.remove(mesh)
}

/* ---- the antenna end of the ESP32 module ----------------------------- */

/* An ESP32-WROOM antenna is a copper meander on the module's own PCB. It is
   not in the STEP either, so draw one and map it over the exposed end: a
   square-wave run of fingers near the far edge, fed by a trace back to the
   shield can. The canvas is 256 x 512 over a 6.9 x 18 mm patch, so one pixel
   is about 0.027 x 0.035 mm. */
const ANT_W = 256
const ANT_H = 512

function antennaTexture() {
  const c = document.createElement('canvas')
  c.width = ANT_W
  c.height = ANT_H
  const g = c.getContext('2d')!
  g.fillStyle = '#1c2a22'
  g.fillRect(0, 0, ANT_W, ANT_H)

  const gold = '#c2a03a'
  g.strokeStyle = gold
  g.lineWidth = 11
  g.lineJoin = 'miter'
  g.lineCap = 'butt'

  // the meander: seven fingers, alternately joined at the top and the bottom
  const top = 40
  const bottom = 150
  const left = 26
  const right = ANT_W - 26
  const fingers = 7
  const step = (right - left) / (fingers - 1)
  g.beginPath()
  g.moveTo(left, bottom)
  for (let i = 0; i < fingers; i++) {
    const x = left + i * step
    g.lineTo(x, i % 2 === 0 ? top : bottom)
  }
  g.stroke()

  // feed trace from the last finger back towards the can, down the middle
  g.lineWidth = 9
  g.beginPath()
  g.moveTo(right, bottom)
  g.lineTo(right, bottom + 26)
  g.lineTo(ANT_W / 2, bottom + 26)
  g.lineTo(ANT_W / 2, ANT_H)
  g.stroke()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/* ---- per-part colouring ---------------------------------------------- */

function paintPart(root: THREE.Object3D, designator: string, antenna: THREE.Texture) {
  const meshes = meshesOf(root)
  if (!meshes.length) return

  /* a part exported as several surfaces (resistors, the QFN, the USB
     connector): sorted by footprint, the body is the first non-shell surface
     and everything after it is a termination or a pin */
  if (/^R\d+$/.test(designator) || designator === 'IC4' || designator === 'J6') {
    /* the micro-USB shell is the two biggest surfaces; they are metal, and the
       black plastic tongue sits behind them */
    const shell = designator === 'J6' ? 2 : 0
    const boxes = meshes.map((m) => ({ m, box: bboxOf(m) }))
    boxes.sort((p, q) => {
      const a = p.box.getSize(new THREE.Vector3())
      const b = q.box.getSize(new THREE.Vector3())
      return b.x * b.y - a.x * a.y
    })
    boxes.forEach(({ m }, i) => {
      if (i < shell) m.material = MATS.metal
      else if (i === shell) m.material = MATS.plastic
      else m.material = MATS.metal
    })
    return
  }

  /* everything below is a single surface that has to be cut up */
  const mesh = meshes[0]
  if (meshes.length > 1) return
  const geo = mesh.geometry as THREE.BufferGeometry
  const box = bboxOf(mesh)
  const size = box.getSize(new THREE.Vector3())
  const mid = box.getCenter(new THREE.Vector3())
  const parent = mesh.parent ?? root

  if (/^C\d+$/.test(designator) || /^D\d+$/.test(designator)) {
    // two metal ends along the long axis, moulding in between
    const alongX = size.x >= size.y
    const half = (alongX ? size.x : size.y) / 2
    const end = half * 0.6
    const cut = splitBy(geo, (t) =>
      (alongX ? Math.abs(t.cx - mid.x) : Math.abs(t.cy - mid.y)) > end ? 'metal' : 'body',
    )
    replaceWith(mesh, cut, { metal: MATS.metal, body: MATS.plastic }, parent)
    return
  }

  if (/^Q\d+$/.test(designator) || designator === 'IC3') {
    // SOT-23 / SOT-223: black moulding, tin leads underneath
    const { cut, materials } = splitLeads(geo, box, 0.3, MATS.plastic, MATS.metal)
    replaceWith(mesh, cut, materials, parent)
    return
  }

  if (designator === 'IC1') {
    // shield can on top, the module PCB below it, gold castellations on the
    // edge, and the meander antenna on the exposed end
    const canZ = box.min.z + size.z * 0.4
    const antennaX = box.min.x + size.x * 0.27
    const edgeX = size.x / 2 - 0.35
    const edgeY = size.y / 2 - 0.35
    const cut = splitBy(geo, (t) => {
      if (t.cz > canZ) return 'can'
      const side = Math.abs(t.nz) < 0.6
      const nearEdge =
        Math.abs(t.cx - mid.x) > edgeX || Math.abs(t.cy - mid.y) > edgeY
      if (side && nearEdge) return 'gold'
      if (t.nz > 0.5 && t.cx < antennaX) return 'antenna'
      return 'pcb'
    })
    const antennaGeo = cut.get('antenna')
    if (antennaGeo) {
      // planar UVs over just the antenna end
      const pos = antennaGeo.getAttribute('position') as THREE.BufferAttribute
      const uv: number[] = []
      const w = antennaX - box.min.x
      for (let i = 0; i < pos.count; i++) {
        uv.push((pos.getX(i) - box.min.x) / w, (pos.getY(i) - box.min.y) / size.y)
      }
      antennaGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    }
    replaceWith(
      mesh,
      cut,
      {
        can: MATS.can,
        pcb: MATS.modulePcb,
        gold: MATS.gold,
        antenna: new THREE.MeshStandardMaterial({ map: antenna, roughness: 0.68, metalness: 0.05 }),
      },
      parent,
    )
    return
  }

  if (/^S[12]$/.test(designator)) {
    // tactile switch: cap above the collar, pins past the housing, black body
    const capZ = box.min.z + size.z * 0.62
    const pinZ = box.min.z + size.z * 0.14
    const cut = splitBy(geo, (t) => {
      if (t.cz > capZ) return 'cap'
      if (t.cz < pinZ) {
        const inside =
          Math.abs(t.cx - mid.x) <= size.x * 0.33 && Math.abs(t.cy - mid.y) <= size.y * 0.44
        return inside ? 'body' : 'metal'
      }
      return 'body'
    })
    replaceWith(mesh, cut, { cap: MATS.switchCap, body: MATS.switchBody, metal: MATS.metal }, parent)
    return
  }

  if (/^J[1-4]$/.test(designator)) {
    mesh.material = MATS.plastic
  }
}

function useBoardModel(src: string) {
  const { scene } = useGLTF(src)
  const artTexture = useTexture(ART_SRC)

  return useMemo(() => {
    artTexture.colorSpace = THREE.SRGBColorSpace
    artTexture.anisotropy = 8

    const model = scene.clone(true)
    const antenna = antennaTexture()

    // collect the designator nodes first: painting replaces meshes, which must
    // not happen while traverse is still walking the tree
    const parts = new Map<string, THREE.Object3D>()
    model.traverse((obj) => {
      const n = (obj.name || '').trim()
      if (DESIGNATOR.test(n) && !parts.has(n)) parts.set(n, obj)
    })

    const board = parts.get('Board') as THREE.Mesh | undefined
    if (board && board.isMesh) {
      const { plain, art } = splitBoardTop(board)
      board.geometry = plain
      board.material = SUBSTRATE
      const top = new THREE.Mesh(art, new THREE.MeshStandardMaterial({ map: artTexture, roughness: 0.6, metalness: 0.05 }))
      top.name = 'BoardTopArt'
      top.renderOrder = 1
      board.add(top)
    }

    for (const [designator, root] of parts) {
      if (designator === 'Board') continue
      paintPart(root, designator, antenna)
    }
    return model
  }, [scene, artTexture])
}

/* Split the substrate into top faces and everything else. The top faces get the
   copper/silkscreen texture; the rest stays plain mask so the board edge does
   not smear the artwork down its sides. */
function splitBoardTop(board: THREE.Mesh) {
  const geo = board.geometry as THREE.BufferGeometry
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const index = geo.getIndex()
  const triCount = index ? index.count / 3 : pos.count / 3
  const at = (t: number, i: number) => (index ? index.getX(t * 3 + i) : t * 3 + i)

  const top: number[] = []
  const rest: number[] = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  const n = new THREE.Vector3()

  for (let t = 0; t < triCount; t++) {
    const ia = at(t, 0)
    const ib = at(t, 1)
    const ic = at(t, 2)
    a.fromBufferAttribute(pos, ia)
    b.fromBufferAttribute(pos, ib)
    c.fromBufferAttribute(pos, ic)
    ab.subVectors(b, a)
    ac.subVectors(c, a)
    n.crossVectors(ab, ac).normalize()
    // local +Z is world up once the export's root rotation is applied
    const target = n.z > 0.7 ? top : rest
    for (const i of [ia, ib, ic]) target.push(pos.getX(i), pos.getY(i), pos.getZ(i))
  }

  const plain = new THREE.BufferGeometry()
  plain.setAttribute('position', new THREE.Float32BufferAttribute(rest, 3))
  plain.computeVertexNormals()

  const art = new THREE.BufferGeometry()
  art.setAttribute('position', new THREE.Float32BufferAttribute(top, 3))
  const uv: number[] = []
  const scale = board.scale.x
  for (let i = 0; i < top.length; i += 3) {
    const xMm = top[i] * scale + board.position.x
    const yMm = top[i + 1] * scale + board.position.y
    uv.push((xMm - BOARD_MM.x0) / BOARD_MM.w, (yMm - BOARD_MM.y0) / BOARD_MM.h)
  }
  art.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  art.computeVertexNormals()

  return { plain, art }
}

/* Frame the board from the canvas aspect, not a fixed position: the same 69 mm
   board has to fit a 16:9 desktop stage, a 5:4 phone stage and a card frame.
   Half-extents are the board's worst-case projected size, so any spin fits. */
const HALF_W = 40
/* HALF_H is deliberately generous: when the board is dragged end-on, the near
   edge sits 34 mm closer to the camera and projects much larger */
const HALF_H = 25
const ELEVATION = (31.5 * Math.PI) / 180
const PADDING = 1.02

function CameraRig() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / Math.max(1, size.height)
    const vFov = (cam.fov * Math.PI) / 180
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const d =
      Math.max(HALF_H / Math.tan(vFov / 2), HALF_W / Math.tan(hFov / 2)) * PADDING
    cam.position.set(0, d * Math.sin(ELEVATION), d * Math.cos(ELEVATION))
    // look slightly under the board so it sits above the centre of the stage
    cam.lookAt(0, -0.02 * d, 0)
    cam.updateProjectionMatrix()
  }, [camera, size])

  return null
}

function SpinningBoard({ src, interactive }: { src: string; interactive: boolean }) {
  const model = useBoardModel(src)
  const group = useRef<THREE.Group>(null)
  const spin = useRef(0.42) // start at a 3/4 angle
  const velocity = useRef(0)
  const drag = useRef({ active: false, x: 0 })
  const gl = useThree((s) => s.gl)
  const reducedMotion = useRef(false)
  const clock = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.current = mq.matches
    const onChange = () => {
      reducedMotion.current = mq.matches
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!interactive) return
    const el = gl.domElement
    el.style.cursor = 'grab'

    const down = (e: PointerEvent) => {
      drag.current = { active: true, x: e.clientX }
      velocity.current = 0
      el.style.cursor = 'grabbing'
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* capture is a nicety, the window listeners still track the drag */
      }
    }
    const move = (e: PointerEvent) => {
      if (!drag.current.active) return
      const dx = e.clientX - drag.current.x
      drag.current.x = e.clientX
      spin.current += dx * 0.008
      velocity.current = dx * 0.008
    }
    const up = (e: PointerEvent) => {
      drag.current.active = false
      el.style.cursor = 'grab'
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* pointer already released */
      }
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointercancel', up)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointercancel', up)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [gl, interactive])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    if (!drag.current.active) {
      // a flung board coasts, then the turntable eases it back to the 3/4 angle
      spin.current += velocity.current
      velocity.current *= 0.93
      if (!reducedMotion.current) {
        clock.current += dt
        const target = 0.42 + Math.sin(clock.current * 0.42) * 0.24
        spin.current += (target - spin.current) * Math.min(1, dt * 1.6)
      }
    }
    g.rotation.y = spin.current
  })

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  )
}

interface Props {
  src: string
  caption?: string
  /** card-sized stage: no hint, no drag (the card itself is a link) */
  compact?: boolean
}

export default function BoardModel({ src, caption, compact = false }: Props) {
  const host = useRef<HTMLDivElement>(null)
  // the canvas must not keep rendering at 60fps while it is scrolled off screen
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = host.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => setVisible(entries[0]?.isIntersecting ?? true), {
      rootMargin: '120px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={host}
      className={compact ? 'card-model' : 'case-hero-model'}
      role="img"
      aria-label="Interactive 3D model of the ESP32 board, exported from Altium."
    >
      <Canvas
        dpr={compact ? [1, 1.2] : [1, 1.6]}
        frameloop={visible ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        camera={{ position: [0, 54, 88], fov: 30 }}
      >
        <CameraRig />
        <ambientLight intensity={0.55} />
        <directionalLight position={[26, 52, 34]} intensity={2.2} color="#ffe6c8" />
        <directionalLight position={[-34, 18, -30]} intensity={0.9} color="#7fa8d8" />
        {/* rim from behind, so the board edge separates from the dark stage */}
        <directionalLight position={[-18, 24, 62]} intensity={0.85} color="#c47a3d" />
        <pointLight position={[0, 14, 34]} intensity={26} distance={90} color="#ffd7ab" />
        <Suspense fallback={null}>
          <SpinningBoard src={src} interactive={!compact} />
          <ContactShadows position={[0, -3.9, 0]} opacity={0.5} scale={120} blur={2.4} far={22} color="#000000" />
        </Suspense>
      </Canvas>
      {!compact && (
        <span className="case-model-hint mono">{caption ?? 'REAL BOARD · DRAG TO ROTATE'}</span>
      )}
    </div>
  )
}

useGLTF.preload(MODEL_SRC)
useTexture.preload(ART_SRC)

/* ============================================================
   components/BoardModel.tsx — the real ESP32 board, in 3D.
   Source: Altium PCB exported to STEP, tessellated with
   occt-import-js and packed to glb by scripts/build-esp32-glb.mjs.
   Parts keep their designators (R1, IC1, J4 ...) as node names, and
   the STEP carries Altium's own per-part colours, so we keep those.

   Copper, silkscreen and vias are not in the STEP. They are baked
   from the PCB document itself by scripts/build-esp32-art.py into
   board-top.png, and laid onto the board's top faces as a second
   material (planar UVs in the document's own millimetre frame).

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

const materialCache = new Map<string, THREE.MeshStandardMaterial>()

/* Altium's STEP colours are the real part colours, so keep them. Only the two
   things the export gets wrong for this look are overridden: the substrate
   (green in the file, purple here) and the pin headers (generic blue in the
   file, black plastic in reality and in the reference). */
function partMaterial(src: THREE.MeshStandardMaterial, designator: string) {
  const isHeader = /^J[1-4]$/.test(designator)
  const key = isHeader ? 'header' : designator === 'IC1' ? 'IC1' : src.name || src.uuid
  const hit = materialCache.get(key)
  if (hit) return hit

  const mat = src.clone()
  if (isHeader) {
    mat.color.set('#15161a')
    mat.roughness = 0.62
    mat.metalness = 0.02
  } else if (designator === 'IC1') {
    // the ESP32-WROOM shield can: brushed metal, not plastic
    mat.metalness = 0.38
    mat.roughness = 0.4
  }
  if (mat.color.r > 0.3 && mat.color.g < 0.12 && mat.color.b < 0.12) {
    // the red power LED reads better with a little of its own light
    mat.emissive = mat.color.clone()
    mat.emissiveIntensity = 0.55
  }
  materialCache.set(key, mat)
  return mat
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

function useBoardModel(src: string) {
  const { scene } = useGLTF(src)
  const artTexture = useTexture(ART_SRC)

  return useMemo(() => {
    artTexture.colorSpace = THREE.SRGBColorSpace
    artTexture.anisotropy = 8

    const model = scene.clone(true)
    const meshes: THREE.Mesh[] = []
    const substrate = new THREE.MeshStandardMaterial({
      color: MASK_COLOR,
      roughness: 0.62,
      metalness: 0.05,
    })
    const artMaterial = new THREE.MeshStandardMaterial({
      map: artTexture,
      roughness: 0.6,
      metalness: 0.05,
    })

    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      meshes.push(mesh)
    })

    // the split below adds a child mesh; walking a snapshot keeps traverse from
    // visiting it, which would inherit the 'Board' name and split forever
    for (const mesh of meshes) {
      const designator = designatorOf(mesh)
      if (designator === 'Board') {
        const { plain, art } = splitBoardTop(mesh)
        mesh.geometry = plain
        mesh.material = substrate
        const top = new THREE.Mesh(art, artMaterial)
        top.name = 'BoardTopArt'
        top.renderOrder = 1
        mesh.add(top)
        continue
      }
      mesh.material = partMaterial(mesh.material as THREE.MeshStandardMaterial, designator)
    }
    return model
  }, [scene, artTexture])
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
        gl={{ antialias: true, alpha: true }}
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

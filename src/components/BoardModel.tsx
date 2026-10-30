/* ============================================================
   components/BoardModel.tsx — the real ESP32 board, in 3D.
   Source: Altium PCB exported to STEP, tessellated with
   occt-import-js and packed to glb by scripts/build-esp32-glb.mjs.
   Parts keep their designators (R1, IC1, J4 ...) as node names.
   Interaction: slow auto-spin, drag to rotate. No zoom, no pan.
   ============================================================ */

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/* ---- palette: dark lab, graphite parts, one copper accent ---- */
const PALETTE = {
  board: { color: '#16241e', roughness: 0.72, metalness: 0.06 },
  module: { color: '#a3abad', roughness: 0.34, metalness: 0.55 }, // ESP32-WROOM shield can
  ic: { color: '#14181a', roughness: 0.52, metalness: 0.1 },
  connector: { color: '#23282b', roughness: 0.46, metalness: 0.2 },
  button: { color: '#1b1f21', roughness: 0.58, metalness: 0.06 },
  passive: { color: '#4a5053', roughness: 0.48, metalness: 0.2 },
  led: { color: '#b5352c', roughness: 0.35, metalness: 0.05, emissive: '#b5352c' },
} as const

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

function paletteFor(designator: string) {
  if (designator === 'Board') return PALETTE.board
  if (designator === 'IC1') return PALETTE.module
  if (/^IC/.test(designator)) return PALETTE.ic
  if (/^J/.test(designator)) return PALETTE.connector
  if (/^S/.test(designator)) return PALETTE.button
  if (designator === 'D1') return PALETTE.led
  return PALETTE.passive
}

const materialCache = new Map<string, THREE.MeshStandardMaterial>()

function materialFor(designator: string): THREE.MeshStandardMaterial {
  const key = designator || 'part'
  const cached = materialCache.get(key)
  if (cached) return cached

  const p = paletteFor(designator)
  const mat = new THREE.MeshStandardMaterial({
    color: p.color,
    roughness: p.roughness,
    metalness: p.metalness,
    emissive: 'emissive' in p ? p.emissive : '#000000',
    emissiveIntensity: 'emissive' in p ? 0.5 : 0,
  })
  materialCache.set(key, mat)
  return mat
}

function useBoardModel(src: string) {
  const { scene } = useGLTF(src)
  return useMemo(() => {
    const model = scene.clone(true)
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.material = materialFor(designatorOf(mesh))
      mesh.castShadow = false
      mesh.receiveShadow = false
    })
    return model
  }, [scene])
}

/* Frame the board from the canvas aspect, not a fixed position: the same 69 mm
   board has to fit a 16:9 desktop stage and a 5:4 phone stage. Half-extents are
   the board's worst-case projected size (diagonal, so any spin angle fits). */
const HALF_W = 40
const HALF_H = 21
const ELEVATION = (31.5 * Math.PI) / 180
const PADDING = 1.22

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
    cam.lookAt(0, -0.05 * d, 0)
    cam.updateProjectionMatrix()
  }, [camera, size])

  return null
}

function SpinningBoard({ src }: { src: string }) {
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
  }, [gl])

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

export default function BoardModel({ src, caption }: { src: string; caption?: string }) {
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
      className="case-hero-model"
      role="img"
      aria-label="Interactive 3D model of the ESP32 board, exported from Altium. Drag to rotate."
    >
      <Canvas
        dpr={[1, 1.6]}
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
          <SpinningBoard src={src} />
          <ContactShadows position={[0, -3.9, 0]} opacity={0.5} scale={120} blur={2.4} far={22} color="#000000" />
        </Suspense>
      </Canvas>
      <span className="case-model-hint mono">{caption ?? 'REAL BOARD · DRAG TO ROTATE'}</span>
    </div>
  )
}

useGLTF.preload('/models/esp32/board.glb')

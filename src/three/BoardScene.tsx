/* ============================================================
   BoardScene.tsx — Canvas, lighting, camera rig, post-fx.
   Dark-lab look + M2 scroll cinematography: the camera dollies
   out and the board flattens as you scroll into the story.
   ============================================================ */

import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import Board from './Board'
import { mouse, initMouse, heroScrollEase } from '../lib/mouse'

initMouse()

const BASE_TILT = -1.02 // rad — Altium 3D-view style angle
const REDUCED =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- pointer-aware floating rig + scroll dolly ---------- */
function BoardRig({ children, interactive }: { children: React.ReactNode; interactive: boolean }) {
  const g = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const gr = g.current
    if (!gr) return
    const t = state.clock.elapsedTime
    const d = Math.min(delta, 0.05)
    const e = REDUCED ? 0 : heroScrollEase()

    // float
    gr.position.y = Math.sin(t * 0.6) * 1.15 * (1 - e)

    // orientation: mouse-lerp + scroll flatten
    const targetX =
      BASE_TILT + e * 0.52 + Math.sin(t * 0.4) * 0.02 + (interactive && !REDUCED ? mouse.y * 0.09 : 0)
    const targetZ =
      Math.sin(t * 0.21) * 0.035 + e * 0.16 - (interactive && !REDUCED ? mouse.x * 0.13 : 0)
    gr.rotation.x = THREE.MathUtils.damp(gr.rotation.x, targetX, 2.4, d)
    gr.rotation.z = THREE.MathUtils.damp(gr.rotation.z, targetZ, 2.4, d)

    // camera dolly — pull back and rise as the story starts
    const cam = state.camera
    const cx = 10 - e * 10
    const cy = 56 + e * 16
    const cz = 116 + e * 95
    cam.position.x = THREE.MathUtils.damp(cam.position.x, cx, 3, d)
    cam.position.y = THREE.MathUtils.damp(cam.position.y, cy, 3, d)
    cam.position.z = THREE.MathUtils.damp(cam.position.z, cz, 3, d)
  })

  return (
    <group ref={g} position={[12, 0, 0]} rotation={[BASE_TILT, 0, 0]}>
      {children}
    </group>
  )
}

/* ---------- ambient copper dust ---------- */
function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 190
      arr[i * 3 + 1] = (Math.random() - 0.5) * 120
      arr[i * 3 + 2] = (Math.random() - 0.5) * 90 - 20
    }
    return arr
  }, [count])

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.z += delta * 0.008
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.06
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.09} color="#c9975d" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

/* ============================================================ */

export default function BoardScene({ interactive = true }: { interactive?: boolean }) {
  const coarse =
    typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches)
  const lowPower = !interactive || coarse

  return (
    <Canvas
      dpr={lowPower ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [10, 56, 116], fov: 34, near: 0.5, far: 600 }}
    >
      <color attach="background" args={['#070a08']} />
      <fog attach="fog" args={['#070a08', 150, 320]} />

      <ambientLight intensity={0.25} />
      <directionalLight position={[40, 90, 70]} intensity={1.15} color="#ffe2b8" />
      <directionalLight position={[-80, 30, -50]} intensity={0.55} color="#7fa8d8" />
      <directionalLight position={[0, -50, 90]} intensity={0.28} color="#ffffff" />

      <Suspense fallback={null}>
        {/* procedural env for the metal — no CDN fetch, tamed to avoid flat-tilt blowout */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={2} position={[0, 60, 40]} scale={[70, 18, 1]} color="#fff1dd" />
          <Lightformer intensity={1.3} position={[-70, 20, 20]} rotation-y={Math.PI / 2} scale={[50, 12, 1]} color="#b9d4ff" />
          <Lightformer intensity={0.9} position={[60, -25, 30]} rotation-y={-Math.PI / 2} scale={[40, 10, 1]} color="#ffd9a8" />
        </Environment>
      </Suspense>

      <BoardRig interactive={interactive}>
        <Board quality={lowPower ? 'low' : 'high'} />
      </BoardRig>

      <Dust count={lowPower ? 70 : 150} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.35} luminanceSmoothing={0.25} />
        <Vignette offset={0.26} darkness={0.62} />
      </EffectComposer>
    </Canvas>
  )
}

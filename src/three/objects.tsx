/* ============================================================
   objects.tsx — per-project 3D exhibits.
   All procedural (primitives + brand materials), one small
   canvas per open row (ObjectStage). No post-processing —
   glow comes from emissive materials, keeping these cheap.

   Hardware objects: copper/gold on mask-green.
   AI/ML objects: cool steel-blue accents (matches track chips).
   ============================================================ */

import { useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import Board from './Board'
import { mouse } from '../lib/mouse'

const COPPER = '#a5602b'
const GOLD = '#d9b05c'
const MASK = '#0e1712'
const HOT = '#ffd9a0'
const ML = '#4d7dab'
const ML_HI = '#9ec8ff'
const RED = '#ff5a3c'
const GREEN = '#59d98c'

/* ---------- turntable: slow spin + pointer tilt ---------- */
function Turntable({ children, speed = 0.4, tilt = 0.1 }: { children: ReactNode; speed?: number; tilt?: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    const gr = g.current
    if (!gr) return
    const d = Math.min(delta, 0.05)
    gr.rotation.y += d * speed
    gr.rotation.x = THREE.MathUtils.damp(gr.rotation.x, 0.16 + mouse.y * tilt, 2.5, d)
  })
  return (
    <group ref={g} position={[0, -0.4, 0]}>
      {children}
    </group>
  )
}

/* ---------- 01 · grad-ml — DoS detection: attack packets get zapped ---------- */
function NetGraph() {
  const core = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const packets = useRef<(THREE.Mesh | null)[]>([])

  const nodes = useMemo(() => {
    const arr: THREE.Vector3[] = []
    const n = 9
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const r = 3.1 + (i % 3) * 0.55
      arr.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 2) * 0.7, Math.sin(a) * r))
    }
    return arr
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // attack packets crawl toward the core
    packets.current.forEach((p, i) => {
      if (!p) return
      const from = nodes[(i * 3) % nodes.length]
      const ph = (t * 0.28 + i / 3) % 1
      p.position.lerpVectors(from, new THREE.Vector3(0, 0, 0), ph)
      ;(p.material as THREE.MeshStandardMaterial).opacity = 0.25 + ph * 0.75
    })
    // defense pulse ring
    if (ring.current) {
      const ph = (t * 0.55) % 1
      ring.current.scale.setScalar(0.25 + ph * 3.6)
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * 0.5
    }
    if (core.current) {
      const m = core.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.8
    }
  })

  return (
    <group>
      {nodes.map((n, i) => (
        <group key={i}>
          <mesh position={n}>
            <sphereGeometry args={[0.4, 14, 14]} />
            <meshStandardMaterial color="#15241c" roughness={0.5} metalness={0.3} emissive={ML} emissiveIntensity={0.35} />
          </mesh>
          <Line points={[n, new THREE.Vector3(0, 0, 0)]} color={ML} lineWidth={1} transparent opacity={0.5} />
        </group>
      ))}
      {/* core */}
      <mesh ref={core}>
        <sphereGeometry args={[0.85, 20, 20]} />
        <meshStandardMaterial color={ML_HI} emissive={ML_HI} emissiveIntensity={1.2} />
      </mesh>
      {/* pulse ring */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.02, 8, 48]} />
        <meshBasicMaterial color={ML_HI} transparent opacity={0.4} />
      </mesh>
      {/* attack packets */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => { packets.current[i] = el }}>
          <sphereGeometry args={[0.18, 10, 10]} />
          <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={1.6} transparent />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- 02 · esp32-board — the hero board, shrunk ---------- */
function BoardMini() {
  return (
    <group scale={0.055} rotation={[-1.3, 0, 0]} position={[0, -0.55, 0]}>
      <Board />
    </group>
  )
}

/* ---------- 03 · race-engineer — voice waveform ---------- */
function Waveform() {
  const bars = useRef<(THREE.Mesh | null)[]>([])
  const N = 30

  useFrame((state) => {
    const t = state.clock.elapsedTime
    bars.current.forEach((b, i) => {
      if (!b) return
      const s = Math.abs(Math.sin(i * 0.7 + t * 4.2)) * (0.5 + 0.5 * Math.abs(Math.sin(t * 1.35)))
      b.scale.y = 0.15 + s * 1.5
    })
  })

  return (
    <group>
      {Array.from({ length: N }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { bars.current[i] = el }}
          position={[-1.7 + (i / (N - 1)) * 3.4, 0.3, 0]}
        >
          <boxGeometry args={[0.085, 1, 0.085]} />
          <meshStandardMaterial color={ML_HI} emissive={ML_HI} emissiveIntensity={1.1} />
        </mesh>
      ))}
      {/* mic puck */}
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.55, 0.62, 0.3, 24]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.34, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.06, 24]} />
        <meshStandardMaterial color="#101511" roughness={0.8} />
      </mesh>
    </group>
  )
}

/* ---------- 04 · vco — cross-coupled LC pair ---------- */
function Vco() {
  const core = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!core.current) return
    const m = core.current.material as THREE.MeshStandardMaterial
    m.emissiveIntensity = 1.4 + Math.sin(state.clock.elapsedTime * 6) * 1.2
  })
  return (
    <group>
      {/* coils */}
      {[-1.7, 1.7].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[1.35, 0.2, 12, 40]} />
          <meshStandardMaterial color={COPPER} metalness={0.9} roughness={0.35} />
        </mesh>
      ))}
      {/* cap plates */}
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[0.1, 1.5, 1.5]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.28} />
        </mesh>
      ))}
      {/* oscillating core */}
      <mesh ref={core}>
        <sphereGeometry args={[0.34, 16, 16]} />
        <meshStandardMaterial color={HOT} emissive={HOT} emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}

/* ---------- 05 · ffb-sim — wheel with force-feedback jiggle ---------- */
function FfbWheel() {
  const wheel = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!wheel.current) return
    const t = state.clock.elapsedTime
    // low-frequency torque + high-frequency rumble = "feedback"
    wheel.current.rotation.z = Math.sin(t * 2.1) * 0.12 + Math.sin(t * 12.5) * 0.035
  })
  return (
    <group>
      {/* motor pod */}
      <mesh position={[0, 0, -1.7]}>
        <boxGeometry args={[1.15, 1.15, 1.1]} />
        <meshStandardMaterial color="#161a16" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, -1.12]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.07, 10, 28]} />
        <meshStandardMaterial color={COPPER} metalness={0.9} roughness={0.35} />
      </mesh>
      {/* quick-release shaft */}
      <mesh position={[0, 0, -0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 1.1, 14]} />
        <meshStandardMaterial color="#8f989d" metalness={0.85} roughness={0.35} />
      </mesh>
      {/* wheel */}
      <group ref={wheel}>
        <mesh>
          <torusGeometry args={[2.1, 0.27, 12, 48]} />
          <meshStandardMaterial color="#181c18" roughness={0.75} />
        </mesh>
        {[Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3].map((a, i) => (
          <group key={i} rotation={[0, 0, a]}>
            <mesh position={[0, 1.05, 0]}>
              <boxGeometry args={[0.17, 2.1, 0.12]} />
              <meshStandardMaterial color={MASK} roughness={0.55} metalness={0.3} />
            </mesh>
          </group>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.36, 0.36, 0.34, 20]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

/* ---------- 06 · clamp-detect — jaws + detection box + scan ---------- */
function Clamp() {
  const jaw = useRef<THREE.Mesh>(null)
  const scan = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (jaw.current) jaw.current.position.x = 1.0 + Math.max(0, Math.sin(t * 0.9)) * 0.8
    if (scan.current) scan.current.position.y = -0.5 + Math.sin(t * 1.4) * 1.1
  })
  return (
    <group>
      <mesh position={[0, -1.7, 0]}>
        <boxGeometry args={[4.4, 0.4, 2.6]} />
        <meshStandardMaterial color="#161a16" roughness={0.5} metalness={0.35} />
      </mesh>
      {/* fixed jaw */}
      <mesh position={[-1.3, -0.7, 0]}>
        <boxGeometry args={[0.55, 1.9, 2.2]} />
        <meshStandardMaterial color={MASK} roughness={0.45} metalness={0.4} />
      </mesh>
      {/* moving jaw */}
      <mesh ref={jaw} position={[1.0, -0.7, 0]}>
        <boxGeometry args={[0.55, 1.9, 2.2]} />
        <meshStandardMaterial color={MASK} roughness={0.45} metalness={0.4} />
      </mesh>
      {/* screw */}
      <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 3.6, 10]} />
        <meshStandardMaterial color="#8f989d" metalness={0.85} roughness={0.35} />
      </mesh>
      {/* workpiece */}
      <mesh position={[-0.15, -1.1, 0]}>
        <boxGeometry args={[1.1, 0.8, 1.1]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
      </mesh>
      {/* detection wire box */}
      <lineSegments position={[-0.1, -0.4, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(4.8, 2.9, 3.0)]} />
        <lineBasicMaterial color={GREEN} transparent opacity={0.5} />
      </lineSegments>
      {/* scan plane */}
      <mesh ref={scan} position={[0, 0, 0]}>
        <boxGeometry args={[4.9, 0.02, 3.1]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ---------- 07 · ever-v — low-poly formula car ---------- */
function Car() {
  const wheels = useRef<(THREE.Group | null)[]>([])
  useFrame((_, delta) => {
    wheels.current.forEach((w) => {
      if (w) w.rotation.x -= Math.min(delta, 0.05) * 3.2
    })
  })
  const wheelPos: [number, number, number][] = [
    [1.15, 0.42, 0.95], [1.15, 0.42, -0.95], [-1.15, 0.42, 0.95], [-1.15, 0.42, -0.95],
  ]
  return (
    <group>
      {/* platform */}
      <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.1, 36]} />
        <meshStandardMaterial color="#101512" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* body */}
      <mesh position={[0.2, 0.45, 0]}>
        <boxGeometry args={[3.5, 0.42, 1.5]} />
        <meshStandardMaterial color="#12241b" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[-0.3, 0.78, 0]}>
        <boxGeometry args={[1.25, 0.38, 0.95]} />
        <meshStandardMaterial color="#0e1712" roughness={0.5} />
      </mesh>
      {/* rear wing */}
      <mesh position={[-1.75, 0.95, 0]}>
        <boxGeometry args={[0.45, 0.07, 1.7]} />
        <meshStandardMaterial color={COPPER} metalness={0.9} roughness={0.35} />
      </mesh>
      {/* wheels: cylinder + spoke cross so spin is visible */}
      {wheelPos.map((p, i) => (
        <group key={i} position={p} ref={(el) => { wheels.current[i] = el }}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.3, 18]} />
            <meshStandardMaterial color="#181c18" roughness={0.6} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.55, 0.08, 0.32]} />
            <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ---------- 08 · bandgap — die + bond wires + steady core glow ---------- */
function Bandgap() {
  const beam = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!beam.current) return
    const m = beam.current.material as THREE.MeshBasicMaterial
    m.opacity = 0.12 + Math.abs(Math.sin(state.clock.elapsedTime * 1.6)) * 0.12
  })
  const bonds = useMemo(() => {
    const arr: THREE.Vector3[][] = []
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      arr.push([
        new THREE.Vector3(Math.cos(a) * 0.6, 0.32, Math.sin(a) * 0.5),
        new THREE.Vector3(Math.cos(a) * 1.6, 0.14, Math.sin(a) * 1.35),
      ])
    }
    return arr
  }, [])
  return (
    <group>
      {/* package */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[4.6, 0.35, 3.4]} />
        <meshStandardMaterial color="#0d1f18" roughness={0.5} />
      </mesh>
      {/* die */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[1.5, 0.22, 1.2]} />
        <meshStandardMaterial color="#1a1f1b" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* bond wires */}
      {bonds.map((b, i) => (
        <Line key={i} points={b} color={GOLD} lineWidth={1} />
      ))}
      {/* core glow */}
      <mesh position={[0, 0.33, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.4]} />
        <meshStandardMaterial color={HOT} emissive={HOT} emissiveIntensity={2} />
      </mesh>
      {/* steady regulation beam */}
      <mesh ref={beam} position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.5, 0.7, 2.4, 20, 1, true]} />
        <meshBasicMaterial color={HOT} transparent opacity={0.15} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/* ---------- 09 · sc-dcdc — charge packet ping-pong ---------- */
function ScConverter() {
  const packet = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!packet.current) return
    const t = state.clock.elapsedTime
    const ph = (t * 0.55) % 1
    const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2 // 0..1..0
    packet.current.position.y = -1.05 + tri * 2.1
  })
  const plates = [-1.05, -0.35, 0.35, 1.05]
  return (
    <group>
      {plates.map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[2.3, 0.12, 2.3]} />
          <meshStandardMaterial color={i % 2 ? COPPER : GOLD} metalness={0.95} roughness={0.3} />
        </mesh>
      ))}
      {/* corner posts */}
      {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * 1.05, 0, sz * 1.05]}>
          <cylinderGeometry args={[0.06, 0.06, 2.3, 8]} />
          <meshStandardMaterial color="#8f989d" metalness={0.85} roughness={0.35} />
        </mesh>
      ))}
      <mesh ref={packet}>
        <sphereGeometry args={[0.26, 14, 14]} />
        <meshStandardMaterial color={HOT} emissive={HOT} emissiveIntensity={2.2} />
      </mesh>
    </group>
  )
}

/* ---------- 10 · sea-waste — sweeping detection cone ---------- */
function SeaSweep() {
  const cone = useRef<THREE.Group>(null)
  const debris = useRef<(THREE.Mesh | null)[]>([])
  const spots = useMemo(() => {
    const arr: { pos: [number, number, number]; ang: number }[] = []
    const n = 6
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.4
      const r = 2.2 + (i % 2) * 0.6
      arr.push({ pos: [Math.cos(a) * r, -0.82, Math.sin(a) * r], ang: a })
    }
    return arr
  }, [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const beamAng = t * 1.1
    if (cone.current) cone.current.rotation.y = -beamAng
    debris.current.forEach((d, i) => {
      if (!d) return
      const s = Math.max(0, Math.cos(spots[i].ang - beamAng))
      const m = d.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 0.2 + Math.pow(s, 6) * 2.4
    })
  })
  return (
    <group>
      {/* water */}
      <mesh position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.3, 40]} />
        <meshStandardMaterial color="#0d1b24" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* buoy platform + mast */}
      <mesh position={[0, -0.75, 0]}>
        <cylinderGeometry args={[0.95, 1.05, 0.35, 24]} />
        <meshStandardMaterial color="#12241b" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 1.8, 10]} />
        <meshStandardMaterial color="#8f989d" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.35, 0.22, 0.35]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
      </mesh>
      {/* sweeping cone (apex at mast) */}
      <group ref={cone}>
        <mesh position={[2.0, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[2.0, 3.6, 24, 1, true]} />
          <meshBasicMaterial color={ML} transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* debris */}
      {spots.map((s, i) => (
        <mesh key={i} position={s.pos} ref={(el) => { debris.current[i] = el }}>
          <boxGeometry args={[0.3, 0.18, 0.3]} />
          <meshStandardMaterial color="#243028" emissive={ML_HI} emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- registry + stage ---------- */

function ObjectById({ id }: { id: string }) {
  switch (id) {
    case 'grad-ml': return <NetGraph />
    case 'esp32-board': return <BoardMini />
    case 'race-engineer': return <Waveform />
    case 'vco': return <Vco />
    case 'ffb-sim': return <FfbWheel />
    case 'clamp-detect': return <Clamp />
    case 'ever-v': return <Car />
    case 'bandgap': return <Bandgap />
    case 'sc-dcdc': return <ScConverter />
    case 'sea-waste': return <SeaSweep />
    default: return <Bandgap />
  }
}

export function ProjectObject({ id }: { id: string }) {
  return (
    <Turntable>
      <ObjectById id={id} />
    </Turntable>
  )
}

export function ObjectStage({ id }: { id: string }) {
  return (
    <div className="obj-stage" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 2.1, 8.6], fov: 36 }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 8, 6]} intensity={1.35} color="#ffe2b8" />
        <directionalLight position={[-6, 3, -5]} intensity={0.5} color="#7fa8d8" />
        <ProjectObject id={id} />
      </Canvas>
    </div>
  )
}

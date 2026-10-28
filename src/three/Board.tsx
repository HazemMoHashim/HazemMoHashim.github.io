/* ============================================================
   Board.tsx — the hero PCB, procedurally modeled in mm.
   Modeled on a 2-layer ESP32-WROOM dev board (the real one
   lives in D:/Projects/Altium/ESP32). When its Gerbers get
   exported, <BoardGerber /> (gerber.ts loader) replaces this.
   ============================================================ */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Line } from '@react-three/drei'
import * as THREE from 'three'

const W = 96 // board width  (mm)
const H = 64 // board height (mm)
const T = 1.6 // substrate thickness
const TOP = T / 2 // top copper surface

/* ---------- deterministic rng (board must look designed, not random) ---------- */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface V2 {
  x: number
  y: number
}
const P = (x: number, y: number): V2 => ({ x, y })

/* chamfered polyline — turns square corners into 45° entry, CAD-style */
function chamfer(pts: V2[], c = 1.7): V2[] {
  if (pts.length < 3) return pts
  const out: V2[] = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const d0 = new THREE.Vector2(p1.x - p0.x, p1.y - p0.y).normalize()
    const d1 = new THREE.Vector2(p2.x - p1.x, p2.y - p1.y).normalize()
    out.push(P(p1.x - d0.x * c, p1.y - d0.y * c), P(p1.x + d1.x * c, p1.y + d1.y * c))
  }
  out.push(pts[pts.length - 1])
  return out
}

/* Z/L route with a single midrail + jitter */
function route(a: V2, b: V2, mode: 'hz' | 'vt', mid = 0.5, jit = 0): V2[] {
  if (mode === 'hz') {
    const mx = a.x + (b.x - a.x) * mid + jit
    return [a, P(mx, a.y), P(mx, b.y), b]
  }
  const my = a.y + (b.y - a.y) * mid + jit
  return [a, P(a.x, my), P(b.x, my), b]
}

/* ---------- component placement (mm, board coords centered) ---------- */

// ESP32-WROOM-32E module: 18 x 25.5, antenna strip on top edge
const MOD = { x: -28, y: 6, w: 18, h: 25.5 }
const MOD_L = MOD.x - MOD.w / 2 // -37
const MOD_R = MOD.x + MOD.w / 2 // -19
const MOD_T = MOD.y + MOD.h / 2 // 18.75
const MOD_B = MOD.y - MOD.h / 2 // -6.75
const ANT_STRIP = 5 // antenna keep-out height
const SHIELD_H = MOD.h - ANT_STRIP

// castellated module pads (both columns)
const PAD_N = 11
const PAD_Y0 = MOD_B + 1.2
const PAD_STEP = (MOD.h - 2.4) / (PAD_N - 1)
const padY = (i: number) => PAD_Y0 + i * PAD_STEP

const REG = { x: 14, y: 18, w: 6.5, h: 7 } // SOT-223 regulator
const UART = { x: 18, y: -4, w: 5, h: 5 } // USB-UART bridge
const USB = { x: 42, y: -8, w: 9, h: 7.5 } // USB-C shell
const SW1 = { x: 2.5, y: 20, w: 3.6, h: 3.2 } // EN
const SW2 = { x: 2.5, y: -14, w: 3.6, h: 3.2 } // BOOT
const D1 = { x: 34, y: 22 } // pwr LED
const D2 = { x: 10, y: -24 } // io LED

/* ---------- nets ---------- */
interface TraceDef {
  a: V2
  b: V2
  mode: 'hz' | 'vt'
  mid: number
  jit: number
  power?: boolean
  pulse?: boolean
}

const TRACES: TraceDef[] = [
  // power tree (wide)
  { a: P(USB.x - USB.w / 2, -8), b: P(REG.x, REG.y - REG.h / 2), mode: 'vt', mid: 0.28, jit: 2.5, power: true },
  { a: P(REG.x + REG.w / 2, REG.y + 1.5), b: P(D1.x - 3, D1.y), mode: 'vt', mid: 0.4, jit: -1.5, power: true },
  // module right column fan-out
  { a: P(MOD_R, padY(1)), b: P(UART.x - UART.w / 2, UART.y), mode: 'vt', mid: 0.3, jit: -2.5 },
  { a: P(MOD_R, padY(3)), b: P(UART.x - UART.w / 2, UART.y + 1), mode: 'hz', mid: 0.45, jit: 3 },
  { a: P(MOD_R, padY(5)), b: P(SW1.x, SW1.y - SW1.h / 2 - 0.2), mode: 'vt', mid: 0.35, jit: -3 },
  { a: P(MOD_R, padY(7)), b: P(REG.x - 1.5, REG.y - REG.h / 2), mode: 'vt', mid: 0.45, jit: 1.8 },
  { a: P(MOD_R, padY(8)), b: P(D1.x - 0.9, D1.y - 0.4), mode: 'vt', mid: 0.55, jit: -1.2, pulse: true },
  { a: P(MOD_R, padY(10)), b: P(USB.x - USB.w / 2, -5.5), mode: 'vt', mid: 0.4, jit: 4, pulse: true },
  // module left column
  { a: P(MOD_L, padY(0)), b: P(SW2.x + SW2.w / 2 + 0.2, SW2.y), mode: 'hz', mid: 0.35, jit: -3 },
  { a: P(MOD_L, padY(2)), b: P(SW1.x + SW1.w / 2 + 0.2, SW1.y), mode: 'vt', mid: 0.5, jit: 2 },
  { a: P(MOD_L, padY(4)), b: P(D2.x - 0.9, D2.y + 0.4), mode: 'vt', mid: 0.55, jit: -2.6, pulse: true },
  { a: P(MOD_L, padY(6)), b: P(-44, -22), mode: 'vt', mid: 0.62, jit: 2.4 },
  { a: P(MOD_L, padY(9)), b: P(-8, 27), mode: 'vt', mid: 0.45, jit: -2 },
  { a: P(MOD_L, padY(10)), b: P(-30, 29.5), mode: 'hz', mid: 0.4, jit: 1.6, pulse: true },
  // uart -> leds/usb
  { a: P(UART.x, UART.y - UART.h / 2), b: P(D2.x, D2.y - 0.5), mode: 'vt', mid: 0.4, jit: -1.8, pulse: true },
  { a: P(UART.x + UART.w / 2, UART.y), b: P(USB.x - USB.w / 2, -10.5), mode: 'vt', mid: 0.45, jit: 2.2 },
  // sw2 -> bottom passive cluster
  { a: P(SW2.x, SW2.y - SW2.h / 2 - 0.2), b: P(-6, -26), mode: 'hz', mid: 0.3, jit: 2.8 },
]

/* passive component positions (0603) — sprinkled along the routes */
const PASSIVES: V2[] = [
  P(-14, -9), P(-10, 4), P(-4, 10), P(6, 15), P(9, 21),
  P(22, 9), P(24, -6), P(28, -12), P(-22, -14), P(-16, 24),
  P(-40, -18), P(36, 4), P(30, 17), P(-34, 27),
]

/* ---------- geometry builders ---------- */

function buildMeander(): V2[] {
  // inverted-F style serpentine antenna on the module strip
  const pts: V2[] = []
  const xL = MOD.x - MOD.w / 2 + 1.4
  const xR = MOD.x + MOD.w / 2 - 1.4
  let y = MOD_T - 1.1
  let x = xL
  pts.push(P(x, y))
  for (let i = 0; i < 6; i++) {
    const xe = x === xL ? xR : xL
    y -= 0.66
    pts.push(P(xe, y))
    x = xe
  }
  // feed stub down from antenna strip
  pts.push(P(xL, MOD_B + 0.8))
  return pts
}

function silkRect(x0: number, y0: number, x1: number, y1: number): V2[] {
  return [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1), P(x0, y0)]
}

function toV3(pts: V2[], z: number): THREE.Vector3[] {
  return pts.map((p) => new THREE.Vector3(p.x, p.y, z))
}

/* ============================================================ */

export default function Board({ quality = 'high' }: { quality?: 'high' | 'low' }) {
  const cold = useMemo(() => new THREE.Color('#8a4d22'), [])
  const hot = useMemo(() => new THREE.Color('#ffd9a0'), [])
  const pulseRefs = useRef<(THREE.Object3D | null)[]>([])
  const pulseIdx = useMemo(() => TRACES.map((t, i) => (t.pulse ? i : -1)).filter((i) => i >= 0), [])

  const data = useMemo(() => {
    const rnd = mulberry32(1987)

    const routes = TRACES.map((t) => ({
      pts: chamfer(route(t.a, t.b, t.mode, t.mid, t.jit)),
      power: !!t.power,
      pulse: !!t.pulse,
    }))

    // vias — seeded, rejecting the module + components
    const vias: V2[] = []
    let guard = 0
    while (vias.length < 26 && guard++ < 800) {
      const v = P(rnd() * (W - 10) - (W - 10) / 2, rnd() * (H - 10) - (H - 10) / 2)
      const inMod = v.x > MOD_L - 2 && v.x < MOD_R + 2 && v.y > MOD_B - 2 && v.y < MOD_T + 2
      const inReg = Math.abs(v.x - REG.x) < REG.w / 2 + 2 && Math.abs(v.y - REG.y) < REG.h / 2 + 2
      const inUart = Math.abs(v.x - UART.x) < UART.w / 2 + 2 && Math.abs(v.y - UART.y) < UART.h / 2 + 2
      const inUsb = Math.abs(v.x - USB.x) < USB.w / 2 + 2 && Math.abs(v.y - USB.y) < USB.h / 2 + 2
      const inSw1 = Math.abs(v.x - SW1.x) < 4 && Math.abs(v.y - SW1.y) < 3.6
      const inSw2 = Math.abs(v.x - SW2.x) < 4 && Math.abs(v.y - SW2.y) < 3.6
      if (!inMod && !inReg && !inUart && !inUsb && !inSw1 && !inSw2) vias.push(v)
    }

    return { routes, vias, meander: buildMeander() }
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // signal pulses — copper heats to gold as a packet transits
    pulseIdx.forEach((ti, k) => {
      const line = pulseRefs.current[k]
      const mat = (line as unknown as { material?: { color: THREE.Color } })?.material
      if (!mat) return
      const phase = (t * 0.32 + k * 0.17) % 1
      const s = Math.max(0, Math.sin(phase * Math.PI)) // 0..1..0
      mat.color.lerpColors(cold, hot, s)
    })
  })

  const zTrace = TOP + 0.03
  const zSilk = TOP + 0.07
  const zPad = TOP + 0.04

  const pulseCounter = { i: 0 } // eslint-disable-line

  return (
    <group>
      {/* ---------- substrate ---------- */}
      <RoundedBox args={[W, H, T]} radius={2.4} smoothness={4} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          color="#0e1712"
          roughness={0.55}
          metalness={0.05}
          clearcoat={0.2}
          clearcoatRoughness={0.4}
        />
      </RoundedBox>

      {/* ---------- board silk outline (inset) ---------- */}
      <Line
        points={toV3(silkRect(-W / 2 + 2, -H / 2 + 2, W / 2 - 2, H / 2 - 2), zSilk)}
        color="#e9e6de"
        lineWidth={1}
        transparent
        opacity={0.5}
      />

      {/* ---------- module ---------- */}
      {/* module pcb */}
      <RoundedBox
        args={[MOD.w, MOD.h, 1.0]}
        radius={0.35}
        smoothness={3}
        position={[MOD.x, MOD.y, TOP + 0.5]}
      >
        <meshPhysicalMaterial color="#0d1f18" roughness={0.5} clearcoat={0.4} />
      </RoundedBox>
      {/* shield can (brushed steel) */}
      <RoundedBox
        args={[MOD.w - 1, SHIELD_H, 1.7]}
        radius={0.25}
        smoothness={3}
        position={[MOD.x, MOD.y + (ANT_STRIP / 2) - 0.15, TOP + 1.0 + 0.85]}
      >
        <meshStandardMaterial color="#aab2b8" metalness={0.85} roughness={0.48} />
      </RoundedBox>
      {/* antenna meander on exposed strip */}
      <Line
        points={toV3(data.meander, TOP + 1.03)}
        color="#c47a3d"
        lineWidth={1.1}
      />
      {/* module courtyard silk */}
      <Line
        points={toV3(silkRect(MOD_L - 1.6, MOD_B - 1.6, MOD_R + 1.6, MOD_T + 1.6), zSilk)}
        color="#e9e6de"
        lineWidth={1}
        transparent
        opacity={0.75}
      />

      {/* ---------- castellated pads ---------- */}
      {Array.from({ length: PAD_N }).flatMap((_, i) =>
        [MOD_L, MOD_R].map((px, side) => (
          <mesh key={`padm${side}-${i}`} position={[px, padY(i), zPad]}>
            <cylinderGeometry args={[0.85, 0.85, 0.06, 20]} />
            <meshStandardMaterial color="#d9b05c" metalness={1} roughness={0.28} />
          </mesh>
        )),
      )}

      {/* ---------- traces ---------- */}
      {data.routes.map((r, i) => {
        const isPulse = r.pulse
        const k = isPulse ? pulseCounter.i++ : 0
        return (
          <Line
            key={`tr-${i}`}
            points={toV3(r.pts, zTrace)}
            color={isPulse ? '#8a4d22' : r.power ? '#b0662f' : '#a5602b'}
            lineWidth={r.power ? 2.4 : 1.4}
            ref={
              isPulse
                ? (el) => {
                    pulseRefs.current[k] = el
                  }
                : undefined
            }
          />
        )
      })}

      {/* ---------- via rivets ---------- */}
      {data.vias.map((v, i) => (
        <group key={`via-${i}`} position={[v.x, v.y, zTrace]}>
          <mesh>
            <cylinderGeometry args={[0.5, 0.5, 0.08, 12]} />
            <meshStandardMaterial color="#a5602b" metalness={0.9} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <cylinderGeometry args={[0.2, 0.2, 0.05, 10]} />
            <meshStandardMaterial color="#060a08" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ---------- gold endpoint pads ---------- */}
      {TRACES.map((t, i) => (
        <group key={`tp-${i}`}>
          <mesh position={[t.a.x, t.a.y, zPad]}>
            <cylinderGeometry args={[0.7, 0.7, 0.06, 14]} />
            <meshStandardMaterial color="#d9b05c" metalness={1} roughness={0.3} />
          </mesh>
          <mesh position={[t.b.x, t.b.y, zPad]}>
            <cylinderGeometry args={[0.7, 0.7, 0.06, 14]} />
            <meshStandardMaterial color="#d9b05c" metalness={1} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ---------- components ---------- */}
      {/* USB-C shell */}
      <RoundedBox
        args={[USB.w, USB.h, 3.1]}
        radius={0.4}
        smoothness={3}
        position={[USB.x, USB.y, TOP + 1.55]}
      >
        <meshStandardMaterial color="#b9c0c4" metalness={0.9} roughness={0.3} />
      </RoundedBox>
      {/* regulator */}
      <RoundedBox args={[REG.w, REG.h, 1.3]} radius={0.2} smoothness={3} position={[REG.x, REG.y, TOP + 0.65]}>
        <meshStandardMaterial color="#141814" roughness={0.55} metalness={0.25} />
      </RoundedBox>
      {/* uart bridge */}
      <RoundedBox args={[UART.w, UART.h, 0.9]} radius={0.15} smoothness={3} position={[UART.x, UART.y, TOP + 0.45]}>
        <meshStandardMaterial color="#101310" roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {/* buttons */}
      {[SW1, SW2].map((s, i) => (
        <group key={`sw-${i}`}>
          <RoundedBox args={[s.w, s.h, 1.2]} radius={0.15} smoothness={3} position={[s.x, s.y, TOP + 0.6]}>
            <meshStandardMaterial color="#161a16" roughness={0.6} />
          </RoundedBox>
          <mesh position={[s.x, s.y, TOP + 1.25]}>
            <cylinderGeometry args={[0.9, 0.9, 0.25, 14]} />
            <meshStandardMaterial color="#8f989d" metalness={0.85} roughness={0.35} />
          </mesh>
        </group>
      ))}
      {/* LEDs (emit — the two living pixels on the board) */}
      <mesh position={[D1.x, D1.y, TOP + 0.35]}>
        <boxGeometry args={[1.7, 0.9, 0.6]} />
        <meshStandardMaterial color="#183420" emissive="#59d98c" emissiveIntensity={2.2} />
      </mesh>
      <mesh position={[D2.x, D2.y, TOP + 0.35]}>
        <boxGeometry args={[1.7, 0.9, 0.6]} />
        <meshStandardMaterial color="#241a0e" emissive="#ffb04d" emissiveIntensity={2.0} />
      </mesh>
      {/* passives */}
      {PASSIVES.map((p, i) => (
        <mesh key={`pas-${i}`} position={[p.x, p.y, TOP + 0.3]} rotation={[0, 0, ((i * 47) % 3) * (Math.PI / 3.2)]}>
          <boxGeometry args={[1.6, 0.8, 0.55]} />
          <meshStandardMaterial color="#181d18" roughness={0.5} metalness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

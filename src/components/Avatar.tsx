/* ============================================================
   Avatar.tsx — "pocket Hazem" (v4.1: alive).
   Cartoon figure: warm dark skin, short black hair (full cap),
   big smile that JABBERS while typing, white cursor-tracking
   eyes, cobalt shirt. Moods: idle bounce / wave-on-hi / giggle
   when clicked / ANGRY if poked too much. Animated mouth with
   teeth. No audio.
   ============================================================ */

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { avatarScript, giggleLines, angryLines, profile } from '../data/profile'
import { mouse } from '../lib/mouse'

const SKIN = '#8a5a3a'
const SKIN_DK = '#6b4429'
const HAIR = '#0d0c0b'
const SHIRT = '#3567d6'
const SHIRT_DK = '#2650ab'
const PANTS = '#252b30'
const SHOE = '#e8e2d6'
const EYE_W = '#f4efe6'
const PUPIL = '#1b120b'
const MOUTH = '#3a160f'
const COPPER = '#c47a3d'
const HOLO = '#7fa8d8'

const REDUCED =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const CHAR_MS = 17

type Mood = { mode: 'idle' | 'giggle' | 'angry'; until: number; now: number; waveUntil: number }

/* ---------- the figure ---------- */
function PocketHazem({ mood, talking }: {
  mood: React.RefObject<Mood>
  talking: boolean
}) {
  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const eyeL = useRef<THREE.Group>(null)
  const eyeR = useRef<THREE.Group>(null)
  const browL = useRef<THREE.Mesh>(null)
  const browR = useRef<THREE.Mesh>(null)
  const mouth = useRef<THREE.Mesh>(null)
  const jaw = useRef<THREE.Group>(null)
  const blinkT = useRef(2.2)
  const blinking = useRef(0)

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const m = mood.current
    m.now = t // shared clock for the click handlers
    const angry = m.mode === 'angry' && t < m.until
    const giggle = m.mode === 'giggle' && t < m.until
    const waving = t < m.waveUntil

    // idle: bouncy double-time; giggle: rapid ticklish bounce; angry: frozen + shake
    if (root.current && !REDUCED) {
      if (angry) {
        root.current.position.y = 0
        root.current.rotation.z = Math.sin(t * 22) * 0.04
        root.current.rotation.y = Math.sin(t * 1.2) * 0.03
      } else if (giggle) {
        root.current.position.y = Math.abs(Math.sin(t * 11)) * 0.15
        root.current.rotation.z = Math.sin(t * 9) * 0.06
        root.current.rotation.y = Math.sin(t * 0.7) * 0.12
      } else {
        root.current.position.y = Math.abs(Math.sin(t * 3.4)) * 0.12
        root.current.rotation.z = Math.sin(t * 1.7) * 0.035
        root.current.rotation.y = Math.sin(t * 0.7) * 0.12
      }
    }

    // head tracks cursor (less during anger — he looks away, offended)
    if (head.current) {
      const ty = angry ? 0.5 : THREE.MathUtils.clamp(mouse.x * 0.55, -0.6, 0.6)
      const tx = angry ? 0.22 : THREE.MathUtils.clamp(-mouse.y * 0.3, -0.32, 0.4)
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, ty, 4, d)
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, tx, 4, d)
      head.current.rotation.z = angry ? Math.sin(t * 18) * 0.03 : Math.sin(t * 3.4) * 0.05
    }

    // arms: woo bursts in idle, continuous high wave on "hi", crossed-ish + jab when angry
    if (armR.current) {
      let target = -2.5 - (Math.sin(t * 3.4) > 0.85 ? 0.9 : 0)
      if (waving && !angry) target = -2.9 + Math.sin(t * 9) * 0.45
      if (angry) target = -0.35 // arm dropped, hand on hip-ish
      armR.current.rotation.z = THREE.MathUtils.damp(armR.current.rotation.z, target, waving ? 9 : 7, d)
    }
    if (armL.current && !REDUCED) {
      const woo = !angry && Math.sin(t * 3.4) > 0.85 ? 0.9 : 0
      const target = angry ? 0.35 : woo
      armL.current.rotation.x = angry ? 0 : Math.sin(t * 3.4) * 0.3
      armL.current.rotation.z = THREE.MathUtils.damp(armL.current.rotation.z, target, 7, d)
    }

    // pupils ride the cursor
    const px = THREE.MathUtils.clamp(mouse.x * 0.035, -0.04, 0.04)
    const py = THREE.MathUtils.clamp(mouse.y * 0.025, -0.03, 0.03)
    for (const e of [eyeL.current, eyeR.current]) {
      if (!e) continue
      e.position.x = THREE.MathUtils.damp(e.position.x, e.userData.baseX + px, 8, d)
      e.position.y = THREE.MathUtils.damp(e.position.y, e.userData.baseY + py, 8, d)
    }

    // blink (fast flutter when giggling; narrowed glare when angry)
    blinkT.current -= d
    if (blinkT.current <= 0) {
      blinking.current = 0.13
      blinkT.current = giggle ? 0.5 : 2 + Math.random() * 2.5
    }
    if (blinking.current > 0) blinking.current -= d
    let lid = blinking.current > 0 ? 0.06 : 1
    if (angry) lid = 0.45
    if (giggle) lid = Math.min(lid, 0.55) // happy squint
    for (const e of [eyeL.current, eyeR.current]) {
      if (e) e.scale.y = THREE.MathUtils.damp(e.scale.y, lid, 24, d)
    }

    // brows: raised-happy by default, INNER-DOWN scowl when angry
    const browT = angry ? 0.32 : -0.14
    if (browL.current) browL.current.rotation.z = THREE.MathUtils.damp(browL.current.rotation.z, -browT, 8, d)
    if (browR.current) browR.current.rotation.z = THREE.MathUtils.damp(browR.current.rotation.z, browT, 8, d)

    // mouth: smile by default, frown when angry, JAW swings while typing,
    // laughs wide open (teeth on display) when tickled
    if (mouth.current) {
      const targetRot = angry ? 0 : Math.PI // 0 = frown arc, π = smile arc
      mouth.current.rotation.z = THREE.MathUtils.damp(mouth.current.rotation.z, targetRot, 10, d)
      mouth.current.scale.x = THREE.MathUtils.damp(mouth.current.scale.x, angry ? 0.85 : giggle ? 1.2 : 1, 12, d)
    }
    if (jaw.current) {
      let open = 0.55 // idle: relaxed grin, teeth peeking
      if (angry) open = 0.18 // gritted
      else if (giggle) open = 1.6 + Math.sin(t * 11) * 0.25 // big laugh, fluttering
      else if (talking) open = 0.6 + Math.abs(Math.sin(t * 13)) * 0.9 // jabber
      jaw.current.scale.y = THREE.MathUtils.damp(jaw.current.scale.y, open, 18, d)
      jaw.current.position.y = (giggle ? Math.sin(t * 11) * 0.012 : 0)
    }
  })

  const eye = (x: number, refCb: (el: THREE.Group | null) => void) => (
    <group ref={refCb} position={[x, 0.06, 0.4]} userData={{ baseX: x, baseY: 0.06 }}>
      <mesh>
        <sphereGeometry args={[0.085, 14, 14]} />
        <meshStandardMaterial color={EYE_W} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <sphereGeometry args={[0.042, 12, 12]} />
        <meshStandardMaterial color={PUPIL} roughness={0.3} />
      </mesh>
    </group>
  )

  return (
    <group ref={root} position={[0, -0.98, 0]} scale={0.8}>
      {/* holographic pad */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[1.05, 1.15, 0.08, 32]} />
        <meshStandardMaterial color="#0c120e" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.02, 0.025, 8, 48]} />
        <meshStandardMaterial color={COPPER} emissive={COPPER} emissiveIntensity={1.4} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 1.0, 40]} />
        <meshBasicMaterial color={HOLO} transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* legs + sneakers */}
      {[-0.19, 0.19].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.38, 0]}>
            <capsuleGeometry args={[0.115, 0.46, 4, 10]} />
            <meshStandardMaterial color={PANTS} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.08, 0.06]}>
            <boxGeometry args={[0.24, 0.14, 0.36]} />
            <meshStandardMaterial color={SHOE} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.035, 0.1]}>
            <boxGeometry args={[0.25, 0.05, 0.38]} />
            <meshStandardMaterial color={SHIRT_DK} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* torso: cobalt tee, tapered */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.36, 0.28, 0.68, 16]} />
        <meshStandardMaterial color={SHIRT} roughness={0.65} />
      </mesh>
      {[-0.36, 0.36].map((x, i) => (
        <mesh key={i} position={[x, 1.26, 0]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color={SHIRT} roughness={0.65} />
        </mesh>
      ))}
      <mesh position={[0, 1.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.026, 8, 20]} />
        <meshStandardMaterial color={SHIRT_DK} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.67, 0]}>
        <cylinderGeometry args={[0.29, 0.29, 0.05, 16]} />
        <meshStandardMaterial color={SHIRT_DK} roughness={0.6} />
      </mesh>

      {/* left arm */}
      <group ref={armL} position={[-0.46, 1.2, 0]}>
        <mesh position={[0, -0.3, 0]} rotation={[0, 0, 0.1]}>
          <capsuleGeometry args={[0.09, 0.42, 4, 10]} />
          <meshStandardMaterial color={SHIRT} roughness={0.65} />
        </mesh>
        <mesh position={[0.02, -0.62, 0]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.55} />
        </mesh>
      </group>

      {/* right arm */}
      <group ref={armR} position={[0.46, 1.2, 0]}>
        <mesh position={[-0.05, -0.3, 0]} rotation={[0, 0, -0.2]}>
          <capsuleGeometry args={[0.09, 0.42, 4, 10]} />
          <meshStandardMaterial color={SHIRT} roughness={0.65} />
        </mesh>
        <mesh position={[-0.11, -0.62, 0]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.55} />
        </mesh>
      </group>

      {/* head */}
      <group ref={head} position={[0, 1.86, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.09, 0.11, 0.14, 10]} />
          <meshStandardMaterial color={SKIN_DK} roughness={0.55} />
        </mesh>
        <mesh scale={[0.92, 1.04, 0.94]}>
          <sphereGeometry args={[0.44, 24, 24]} />
          <meshStandardMaterial color={SKIN} roughness={0.55} />
        </mesh>
        {/* ears */}
        {[-0.42, 0.42].map((x, i) => (
          <mesh key={i} position={[x, -0.02, 0]} scale={[0.55, 1, 0.9]}>
            <sphereGeometry args={[0.09, 10, 10]} />
            <meshStandardMaterial color={SKIN} roughness={0.55} />
          </mesh>
        ))}
        {/* short black hair: full crown cap hugging the head (no bald top, no ring) */}
        <mesh position={[0, 0.22, -0.02]} scale={[0.96, 0.56, 1.0]}>
          <sphereGeometry args={[0.465, 22, 22, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={HAIR} roughness={0.85} />
        </mesh>

        {/* eyebrows — raised-happy default, scowl on anger */}
        <mesh ref={browL} position={[-0.17, 0.17, 0.4]} rotation={[0, 0, -0.14]}>
          <boxGeometry args={[0.14, 0.032, 0.05]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh ref={browR} position={[0.17, 0.17, 0.4]} rotation={[0, 0, 0.14]}>
          <boxGeometry args={[0.14, 0.032, 0.05]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>

        {eye(-0.17, (el) => { eyeL.current = el })}
        {eye(0.17, (el) => { eyeR.current = el })}

        {/* mouth assembly: lips arc + hanging jaw (teeth strip + dark cavity) */}
        <mesh ref={mouth} position={[0, -0.12, 0.435]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.13, 0.04, 10, 24, Math.PI * 0.85]} />
          <meshStandardMaterial color={MOUTH} roughness={0.5} />
        </mesh>
        <group ref={jaw} position={[0, -0.12, 0.428]} scale={[1, 0.55, 1]}>
          {/* upper teeth strip */}
          <mesh position={[0, 0.022, 0.004]}>
            <boxGeometry args={[0.15, 0.038, 0.02]} />
            <meshStandardMaterial color={EYE_W} roughness={0.25} />
          </mesh>
          {/* dark cavity hanging from the teeth line */}
          <mesh position={[0, -0.055, 0]}>
            <sphereGeometry args={[0.078, 14, 14]} />
            <meshStandardMaterial color="#1c0a07" roughness={0.7} />
          </mesh>
          {/* tongue hint */}
          <mesh position={[0, -0.075, 0.02]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#7d3a2d" roughness={0.6} />
          </mesh>
        </group>
        {[-0.26, 0.26].map((x, i) => (
          <mesh key={i} position={[x, -0.1, 0.38]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color={SKIN_DK} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ---------- speech: section observer + typewriter + hover chat ---------- */

const SECTION_IDS = ['profile', 'revisions', 'builds', 'stack', 'spine', 'contact']

function useSpeech(booted: boolean) {
  const [line, setLine] = useState('')
  const [shown, setShown] = useState('')
  const spoken = useRef<Set<string>>(new Set())
  const timer = useRef<number | undefined>(undefined)
  const lastText = useRef('')

  const say = (text: string, key?: string) => {
    if (key && spoken.current.has(key)) return
    if (key) spoken.current.add(key)
    if (text === lastText.current) return
    lastText.current = text
    setLine(text)
  }

  useEffect(() => {
    if (!line) return
    setShown('')
    let i = 0
    window.clearInterval(timer.current)
    timer.current = window.setInterval(() => {
      i += 1
      setShown(line.slice(0, i))
      if (i >= line.length) window.clearInterval(timer.current)
    }, CHAR_MS)
    return () => window.clearInterval(timer.current)
  }, [line])

  useEffect(() => {
    if (!booted) return
    const t = window.setTimeout(() => say(avatarScript.greet, 'greet'), 500)
    return () => window.clearTimeout(t)
  }, [booted])

  useEffect(() => {
    if (!booted) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.22) {
            const l = avatarScript[e.target.id]
            if (l) say(l, e.target.id)
          }
        }
      },
      { threshold: [0.22] },
    )
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [booted])

  useEffect(() => {
    if (!booted) return
    const onSay = (ev: Event) => {
      const text = (ev as CustomEvent<string>).detail
      if (typeof text === 'string') say(text)
    }
    window.addEventListener('avatar-say', onSay)
    return () => window.removeEventListener('avatar-say', onSay)
  }, [booted])

  return { line, shown, done: shown.length >= line.length && line.length > 0, say }
}

/* ============================================================ */

export default function Avatar({ booted }: { booted: boolean }) {
  const { line, shown, done, say } = useSpeech(booted)
  const [visible, setVisible] = useState(false)
  const mood = useRef<Mood>({ mode: 'idle', until: 0, now: 0, waveUntil: 0 })
  const clicks = useRef<number[]>([])
  const giggleIdx = useRef(0)
  const angryIdx = useRef(0)

  useEffect(() => {
    if (!booted) return
    const t = window.setTimeout(() => setVisible(true), 300)
    return () => window.clearTimeout(t)
  }, [booted])

  // wave on "hi" lines (greeting + poke)
  useEffect(() => {
    if (!line) return
    if (line === avatarScript.greet || line === avatarScript.poke) {
      mood.current.waveUntil = mood.current.now + line.length * CHAR_MS / 1000 + 1.2
    }
  }, [line])

  // talking flag derived from typing progress
  const talking = done ? false : shown.length > 0

  const onPoke = () => {
    const now = mood.current.now
    const nowMs = now * 1000
    clicks.current = clicks.current.filter((c) => nowMs - c < 6000)
    clicks.current.push(nowMs)
    mood.current.mode = 'idle'
    mood.current.until = 0

    if (clicks.current.length >= 4) {
      // overdone: angry for a bit, forgive after
      clicks.current = []
      mood.current.mode = 'angry'
      mood.current.until = now + 3.2
      say(angryLines[angryIdx.current % angryLines.length])
      angryIdx.current += 1
    } else {
      mood.current.mode = 'giggle'
      mood.current.until = now + 1.7
      say(giggleLines[giggleIdx.current % giggleLines.length])
      giggleIdx.current += 1
    }
  }

  if (!booted) return null

  return (
    <div className={`avatar-dock ${visible ? 'on' : ''}`} aria-live="polite">
      {shown && (
        <div className="avatar-bubble">
          <span>{shown}</span>
          {!done && <i className="caret" aria-hidden="true" />}
        </div>
      )}
      <div className="avatar-side">
        <div
          className="avatar-stage"
          title={profile.fullName}
          onClick={onPoke}
          role="button"
          aria-label="Say hi to Hazem's avatar — but don't overdo it"
        >
          <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} camera={{ position: [0, 1.35, 7.2], fov: 34 }}>
            <ambientLight intensity={0.55} />
            <directionalLight position={[3, 6, 4]} intensity={1.25} color="#ffe2b8" />
            <directionalLight position={[-4, 3, -3]} intensity={0.5} color="#7fa8d8" />
            <pointLight position={[-2.2, 3.4, -2.6]} intensity={24} distance={9} color="#c47a3d" />
            <pointLight position={[2.4, 3.2, -2.2]} intensity={16} distance={9} color="#7fd8c8" />
            <Suspense fallback={null}>
              <PocketHazem mood={mood} talking={talking} />
            </Suspense>
          </Canvas>
        </div>
        <span className="avatar-tag mono">H. HASHIM · AVATAR</span>
      </div>
    </div>
  )
}

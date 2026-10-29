/* ============================================================
   Avatar.tsx — "pocket Hazem" (v5: 3D replica of the 2D ref).
   Buzz cut with a sharp line-up, big ears, thick brows, large
   oval eyes, wide nose, teal plaid flannel over a white tee,
   katana held across the chest. Happy default: grin, raised
   brows, cursor-tracking eyes. Moods: idle bounce / wave-on-hi /
   giggle when clicked / ANGRY if poked too much. Animated mouth
   with teeth. No audio.
   ============================================================ */

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { avatarScript, giggleLines, angryLines, profile } from '../data/profile'
import { mouse } from '../lib/mouse'

const SKIN = '#a06a45'
const SKIN_DK = '#7d5132'
const HAIR = '#0d0c0b'
const SHIRT = '#3d7b87'
const SHIRT_DK = '#2a5a64'
const PLAID_LIGHT = '#e6ddca'
const TEE = '#f2ede3'
const BAND = '#16191c'
const PANTS = '#252b30'
const SHOE = '#e8e2d6'
const EYE_W = '#f7f3ea'
const PUPIL = '#120e0a'
const MOUTH = '#3a160f'
const COPPER = '#c47a3d'
const HOLO = '#7fa8d8'
const STEEL = '#e6edf0'
const GOLD = '#c9a24a'
const RED_WRAP = '#b5352c'
const MOUTH_Y = -0.15

const REDUCED =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const CHAR_MS = 17

type Mood = { mode: 'idle' | 'giggle' | 'angry'; until: number; now: number; waveUntil: number }

/* teal flannel plaid, painted once into a canvas texture */
function makePlaid() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = SHIRT
  g.fillRect(0, 0, 256, 256)
  // wide cream bands (both directions) — soft, so it reads as flannel
  g.fillStyle = 'rgba(230,221,202,0.26)'
  for (let i = 0; i < 256; i += 64) {
    g.fillRect(i, 0, 22, 256)
    g.fillRect(0, i, 256, 22)
  }
  // dark teal bands offset from the cream
  g.fillStyle = 'rgba(26,46,52,0.4)'
  for (let i = 40; i < 256; i += 64) {
    g.fillRect(i, 0, 10, 256)
    g.fillRect(0, i, 256, 10)
  }
  // thin near-black lines
  g.fillStyle = 'rgba(9,15,17,0.28)'
  for (let i = 10; i < 256; i += 32) {
    g.fillRect(i, 0, 2, 256)
    g.fillRect(0, i, 256, 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2.4, 2.4)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

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
  const plaid = useMemo(() => makePlaid(), [])

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
      // +z raises the right arm out to his side; negative would swing it across the face
      let target = 0.12 + (Math.sin(t * 3.4) > 0.85 ? 1.15 : 0)
      if (waving && !angry) target = 2.35 + Math.sin(t * 9) * 0.28
      if (angry) target = -0.3 // arm dropped, hand on hip-ish
      armR.current.rotation.z = THREE.MathUtils.damp(armR.current.rotation.z, target, waving ? 9 : 7, d)
    }
    if (armL.current && !REDUCED) {
      const woo = !angry && Math.sin(t * 3.4) > 0.85 ? 0.14 : 0
      const target = angry ? 0.35 : 0.5 + woo
      // held out in front so the blade crosses the chest; only a slight sway
      armL.current.rotation.x = angry ? -0.15 : -0.55 + Math.sin(t * 1.7) * 0.04
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

    // brows: flat and relaxed by default, INNER-DOWN scowl when angry
    const browT = angry ? 0.32 : 0
    if (browL.current) browL.current.rotation.z = THREE.MathUtils.damp(browL.current.rotation.z, -browT, 8, d)
    if (browR.current) browR.current.rotation.z = THREE.MathUtils.damp(browR.current.rotation.z, browT, 8, d)

    // mouth: smile by default, frown when angry, JAW swings while typing,
    // laughs wide open (teeth on display) when tickled
    if (mouth.current) {
      mouth.current.scale.x = THREE.MathUtils.damp(mouth.current.scale.x, angry ? 0.8 : giggle ? 1.15 : 1, 12, d)
      mouth.current.scale.y = THREE.MathUtils.damp(mouth.current.scale.y, angry ? 0.55 : 1, 12, d)
    }
    if (jaw.current) {
      let open = 0.9 // idle: open happy grin, teeth showing
      if (angry) open = 0.3 // gritted
      else if (giggle) open = 1.4 + Math.sin(t * 11) * 0.15 // big laugh, fluttering
      else if (talking) open = 0.9 + Math.abs(Math.sin(t * 13)) * 0.55 // jabber — readable swings
      jaw.current.scale.y = THREE.MathUtils.damp(jaw.current.scale.y, open, 18, d)
      jaw.current.position.y = MOUTH_Y + (giggle ? Math.sin(t * 11) * 0.014 : 0)
    }
  })

  const eye = (x: number, refCb: (el: THREE.Group | null) => void) => (
    <group ref={refCb} position={[x, 0.06, 0.4]} userData={{ baseX: x, baseY: 0.06 }}>
      {/* big oval sclera */}
      <mesh scale={[1, 0.82, 0.5]}>
        <sphereGeometry args={[0.105, 16, 16]} />
        <meshStandardMaterial color={EYE_W} roughness={0.22} />
      </mesh>
      {/* iris: nearly fills the eye, like the reference */}
      <mesh position={[0, 0, 0.045]} scale={[1, 1, 0.55]}>
        <sphereGeometry args={[0.062, 14, 14]} />
        <meshStandardMaterial color={PUPIL} roughness={0.25} />
      </mesh>
      {/* catch-light */}
      <mesh position={[0.022, 0.028, 0.085]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
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

      {/* torso: teal plaid flannel, open down the front over a white tee */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.36, 0.28, 0.68, 24, 1, true, Math.PI * 0.09, Math.PI * 1.82]} />
        <meshStandardMaterial map={plaid} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* white tee under the open flannel */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.335, 0.262, 0.68, 20, 1, true]} />
        <meshStandardMaterial color={TEE} roughness={0.75} side={THREE.DoubleSide} />
      </mesh>
      {/* black chest band on the tee */}
      <mesh position={[0, 1.02, 0.306]}>
        <boxGeometry args={[0.11, 0.05, 0.012]} />
        <meshStandardMaterial color={BAND} roughness={0.6} />
      </mesh>
      {/* tee collar around the neck */}
      <mesh position={[0, 1.37, 0.02]} rotation={[-0.2, 0, 0]}>
        <torusGeometry args={[0.135, 0.022, 8, 20]} />
        <meshStandardMaterial color={TEE} roughness={0.7} />
      </mesh>
      {/* flannel lapels folded open along the gap */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.115, 1.12, 0.328]} rotation={[-0.1, -s * 0.45, -s * 0.06]}>
          <boxGeometry args={[0.07, 0.4, 0.025]} />
          <meshStandardMaterial map={plaid} roughness={0.85} />
        </mesh>
      ))}
      {/* flannel collar flaps */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.16, 1.3, 0.3]} rotation={[-0.12, -s * 0.5, -s * 0.42]}>
          <boxGeometry args={[0.14, 0.2, 0.03]} />
          <meshStandardMaterial map={plaid} roughness={0.85} />
        </mesh>
      ))}
      {/* shoulders */}
      {[-0.36, 0.36].map((x, i) => (
        <mesh key={i} position={[x, 1.26, 0]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial map={plaid} roughness={0.85} />
        </mesh>
      ))}
      {/* neck */}
      <mesh position={[0, 1.36, 0]}>
        <cylinderGeometry args={[0.11, 0.12, 0.18, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.67, 0]}>
        <cylinderGeometry args={[0.29, 0.29, 0.05, 16]} />
        <meshStandardMaterial color={SHIRT_DK} roughness={0.6} />
      </mesh>

      {/* left arm: bent forward, fist at the chest holding the katana */}
      <group ref={armL} position={[-0.46, 1.2, 0]} rotation={[-0.55, 0, 0.5]}>
        <mesh>
          <sphereGeometry args={[0.115, 12, 12]} />
          <meshStandardMaterial map={plaid} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.3, 0]} rotation={[0, 0, 0.1]}>
          <capsuleGeometry args={[0.107, 0.4, 4, 10]} />
          <meshStandardMaterial map={plaid} roughness={0.85} />
        </mesh>
        {/* cuff */}
        <mesh position={[0.01, -0.56, 0]}>
          <cylinderGeometry args={[0.108, 0.108, 0.06, 12]} />
          <meshStandardMaterial map={plaid} roughness={0.85} />
        </mesh>
        {/* fist */}
        <mesh position={[0.02, -0.63, 0.02]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </mesh>

        {/* katana: red-wrapped handle in the fist, steel blade across the chest */}
        <group position={[0.02, -0.63, 0.08]} rotation={[0.9, 0, -1.25]}>
          {/* handle */}
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.048, 0.052, 0.36, 12]} />
            <meshStandardMaterial color={RED_WRAP} roughness={0.55} />
          </mesh>
          {/* diamond wrap */}
          {[-0.17, -0.05, 0.07].map((y) => (
            <mesh key={y} position={[0, y, 0.046]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.05, 0.05, 0.012]} />
              <meshStandardMaterial color={PLAID_LIGHT} roughness={0.5} />
            </mesh>
          ))}
          {/* pommel */}
          <mesh position={[0, -0.255, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
            <meshStandardMaterial color={GOLD} metalness={0.4} roughness={0.4} />
          </mesh>
          {/* tsuba */}
          <mesh position={[0, 0.145, 0]}>
            <cylinderGeometry args={[0.105, 0.105, 0.022, 20]} />
            <meshStandardMaterial color={GOLD} metalness={0.45} roughness={0.35} />
          </mesh>
          {/* blade */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.056, 0.72, 0.015]} />
            <meshStandardMaterial color={STEEL} metalness={0.35} roughness={0.28} />
          </mesh>
          {/* tip */}
          <mesh position={[0, 0.875, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.04, 0.04, 0.015]} />
            <meshStandardMaterial color={STEEL} metalness={0.35} roughness={0.28} />
          </mesh>
        </group>
      </group>

      {/* right arm: free to wave */}
      <group ref={armR} position={[0.46, 1.2, 0]}>
        {/* shoulder cap so the arm reads as attached, not a stick */}
        <mesh>
          <sphereGeometry args={[0.115, 12, 12]} />
          <meshStandardMaterial map={plaid} roughness={0.85} />
        </mesh>
        <mesh position={[-0.05, -0.3, 0]} rotation={[0, 0, -0.2]}>
          <capsuleGeometry args={[0.107, 0.4, 4, 10]} />
          <meshStandardMaterial map={plaid} roughness={0.85} />
        </mesh>
        <mesh position={[-0.06, -0.56, 0]}>
          <cylinderGeometry args={[0.108, 0.108, 0.06, 12]} />
          <meshStandardMaterial map={plaid} roughness={0.85} />
        </mesh>
        <mesh position={[-0.11, -0.63, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.85} />
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
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </mesh>
        {/* big ears, like the reference */}
        {[-0.425, 0.425].map((x, i) => (
          <group key={i}>
            <mesh position={[x, -0.03, 0]} scale={[0.62, 1.12, 0.82]}>
              <sphereGeometry args={[0.105, 12, 12]} />
              <meshStandardMaterial color={SKIN} roughness={0.85} />
            </mesh>
            <mesh position={[x + (i === 0 ? 0.028 : -0.028), -0.03, 0.03]} scale={[0.3, 0.62, 0.42]}>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshStandardMaterial color={SKIN_DK} roughness={0.6} />
            </mesh>
          </group>
        ))}
        {/* buzz cut: a thin shell hugging the skull, with a sharp line-up edge */}
        <mesh scale={[0.932, 1.055, 0.952]}>
          <sphereGeometry args={[0.44, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.33]} />
          <meshStandardMaterial color={HAIR} roughness={0.9} />
        </mesh>

        {/* thick eyebrows, flat and relaxed by default, inner-down scowl on anger */}
        <mesh ref={browL} position={[-0.185, 0.178, 0.4]}>
          <boxGeometry args={[0.18, 0.05, 0.05]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh ref={browR} position={[0.185, 0.178, 0.4]}>
          <boxGeometry args={[0.18, 0.05, 0.05]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>

        {eye(-0.185, (el) => { eyeL.current = el })}
        {eye(0.185, (el) => { eyeR.current = el })}

        {/* wide flat nose with visible nostrils */}
        <mesh position={[0, -0.025, 0.418]} scale={[1.5, 0.7, 0.45]}>
          <sphereGeometry args={[0.062, 14, 14]} />
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </mesh>
        {[-0.052, 0.052].map((x, i) => (
          <mesh key={i} position={[x, -0.058, 0.434]} scale={[0.85, 0.55, 0.45]}>
            <sphereGeometry args={[0.024, 10, 10]} />
            <meshStandardMaterial color={SKIN_DK} roughness={0.8} />
          </mesh>
        ))}

        {/* mouth: one open grin — flat top, round bottom, smile rim at the corners */}
        <mesh position={[0, MOUTH_Y, 0.398]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.165, 0.028, 10, 24, Math.PI * 0.95]} />
          <meshStandardMaterial color={MOUTH} roughness={0.5} />
        </mesh>
        <group ref={jaw} position={[0, MOUTH_Y, 0.402]} scale={[1, 0.9, 1]}>
          {/* the opening: half-disc hanging from the top lip, stretches down when talking */}
          <mesh>
            <circleGeometry args={[0.15, 28, Math.PI, Math.PI]} />
            <meshStandardMaterial color="#1c0a07" roughness={0.7} />
          </mesh>
          {/* teeth along the top lip */}
          <mesh position={[0, -0.028, 0.004]}>
            <boxGeometry args={[0.205, 0.04, 0.014]} />
            <meshStandardMaterial color={EYE_W} roughness={0.25} />
          </mesh>
          {/* tongue at the bottom */}
          <mesh position={[0, -0.115, 0.004]} scale={[1.2, 0.55, 0.5]}>
            <sphereGeometry args={[0.058, 10, 10]} />
            <meshStandardMaterial color="#7d3a2d" roughness={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

/* ---------- speech: section observer + typewriter + hover chat ---------- */

const SECTION_IDS = ['about', 'featured', 'timeline', 'stack', 'honors', 'contact']

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
          aria-label="Say hi to Hazem's avatar, but don't overdo it"
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

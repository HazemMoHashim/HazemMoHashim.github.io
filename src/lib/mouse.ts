/* Window-level mouse singleton — lets the 3D rig track the pointer
   even when the canvas sits behind DOM content (pointer-events: none). */
export const mouse = { x: 0, y: 0 }

let inited = false
export function initMouse() {
  if (inited || typeof window === 'undefined') return
  inited = true
  window.addEventListener(
    'mousemove',
    (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    },
    { passive: true },
  )
}

/* smoothstep of scroll progress through the hero (0 at top → 1 past one viewport) */
export function heroScrollEase(): number {
  const p = Math.min(Math.max(window.scrollY / (window.innerHeight * 0.95), 0), 1)
  return p * p * (3 - 2 * p)
}

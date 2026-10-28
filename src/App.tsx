import { lazy, Suspense, useEffect, useState } from 'react'
import Preloader from './components/Preloader'
import Rail from './components/Rail'
import Cursor from './components/Cursor'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import About from './components/About'
import Revisions from './components/Revisions'
import Builds from './components/Builds'
import Stack from './components/Stack'
import Spine from './components/Spine'
import Contact from './components/Contact'
import EasterEgg from './components/EasterEgg'
import { useReveal } from './lib/useReveal'
import { initLenis } from './lib/lenis'

/* avatar + its whole R3F runtime are a separate chunk */
const Avatar = lazy(() => import('./components/Avatar'))

function Atmos() {
  return (
    <>
      <div className="atmos atmos-grid" aria-hidden="true" />
      <div className="atmos atmos-grain" aria-hidden="true" />
    </>
  )
}

export default function App() {
  const [booted, setBooted] = useState(false)
  useReveal()

  useEffect(() => {
    initLenis()
  }, [])

  return (
    <>
      <Atmos />
      <Cursor />
      <Preloader onBoot={() => setBooted(true)} />
      <Rail />
      <main className="page">
        <Hero booted={booted} />
        <Marquee />
        <About />
        <Revisions />
        <Builds />
        <Stack />
        <Spine />
        <Contact />
      </main>
      <Suspense fallback={null}>
        <Avatar booted={booted} />
      </Suspense>
      <EasterEgg />
    </>
  )
}

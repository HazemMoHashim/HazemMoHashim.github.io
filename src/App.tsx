import { Suspense, lazy, useEffect, useState } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import Preloader from './components/Preloader'
import Rail from './components/Rail'
import Cursor from './components/Cursor'
import Avatar from './components/Avatar'
import EasterEgg from './components/EasterEgg'
import { initLenis } from './lib/lenis'

function Atmos() {
  return (
    <>
      <div className="atmos atmos-grid" aria-hidden="true" />
      <div className="atmos atmos-grain" aria-hidden="true" />
    </>
  )
}

const Home = lazy(() => import('./pages/Home'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectPage = lazy(() => import('./pages/Project'))

export default function App() {
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    initLenis()
  }, [])

  return (
    <HashRouter>
      <Inner booted={booted} setBooted={setBooted} />
    </HashRouter>
  )
}

function Inner({ booted, setBooted }: { booted: boolean; setBooted: (b: boolean) => void }) {
  const { pathname } = useLocation()

  // scroll to top on route change (hash router)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <Atmos />
      <Cursor />
      <Preloader onBoot={() => setBooted(true)} />
      <Rail />
      <main className="page">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home booted={booted} />} />
            <Route path="/projects" element={<Projects booted={booted} />} />
            <Route path="/projects/:slug" element={<ProjectPage booted={booted} />} />
          </Routes>
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Avatar booted={booted} />
      </Suspense>
      <EasterEgg />
    </>
  )
}

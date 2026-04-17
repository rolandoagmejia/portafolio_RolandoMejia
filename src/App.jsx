import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Experience from './components/Experience'
import Hero from './components/Hero'
import CockpitHUD from './components/CockpitHUD'
import AmbientMusic from './components/AmbientMusic'
import ShooterGame from './components/ShooterGame'
import PlanetInfoOverlay from './components/PlanetInfoOverlay'
import ChatOverlay from './components/ChatOverlay'

/*
  App — Fullscreen 3D Canvas con scroll-driven camera.
  CockpitHUD es un overlay HTML fijo.
  ShooterGame es un overlay que aparece al final.
*/
export default function App() {
  const [showGame, setShowGame] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if (e.target.closest('[data-game="start"]')) {
        setShowGame(true)
      }
    }
    const gameHandler = () => setShowGame(true)
    document.addEventListener('click', handler)
    window.addEventListener('start-game', gameHandler)
    return () => {
      document.removeEventListener('click', handler)
      window.removeEventListener('start-game', gameHandler)
    }
  }, [])

  return (
    <>
      <Canvas
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh' }}
        camera={{ position: [0, 0.3, 8], fov: 65, near: 0.1, far: 800 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#000005']} />
        <fog attach="fog" args={['#000005', 300, 700]} />

        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>

      {/* <CockpitHUD /> */}
      <Hero />
      <PlanetInfoOverlay />
      <ChatOverlay />
      {/* <div className="flight-crosshair">+</div> */}
      <AmbientMusic />
      {showGame && <ShooterGame onClose={() => setShowGame(false)} />}
    </>
  )
}

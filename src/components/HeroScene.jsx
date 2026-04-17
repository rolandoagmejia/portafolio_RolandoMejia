import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import ParticleTunnel from './ParticleTunnel'
import TunnelRings from './TunnelRings'

/*
  HeroScene — Canvas 3D fijo como fondo.
  Túnel de partículas + anillos + bloom glow.
*/
export default function HeroScene() {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 65, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#000005']} />
        <fog attach="fog" args={['#000005', 10, 35]} />

        <ParticleTunnel count={4500} radius={5} depth={40} />
        <TunnelRings count={22} radius={5.2} depth={40} />

        <EffectComposer multisampling={0}>
          <Bloom
            intensity={1.8}
            luminanceThreshold={0.05}
            luminanceSmoothing={0.9}
            radius={0.85}
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

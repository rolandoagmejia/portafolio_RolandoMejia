import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from './Experience'

/*
  TunnelRings — Anillos de neón que se reciclan alrededor de la cámara.
  Invisibles al inicio, aparecen al acelerar.
*/
export default function TunnelRings({ count = 40, radius = 6.5, spacing = 8, cameraZ = 0 }) {
  const groupRef = useRef()

  const rings = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      baseZ: i * spacing,
      opacity: 0.04 + Math.random() * 0.1,
      scale: 0.92 + Math.random() * 0.16,
    })), [count, spacing])

  useFrame(() => {
    if (!groupRef.current) return
    const totalLen = count * spacing
    // Fade global: SOLO visibles al acelerar — al parar desaparecen
    const offsetFade = Math.min(1, (scrollState.offset || 0) * 12)
    const velFade = Math.min(1, (scrollState.visualVelocity || 0) * 4)
    // Sin velocidad = invisible (velFade driven)
    const globalFade = offsetFade * velFade

    groupRef.current.children.forEach((mesh, i) => {
      let z = rings[i].baseZ
      z = ((z - cameraZ) % totalLen + totalLen) % totalLen + cameraZ - totalLen * 0.3
      mesh.position.z = z
      const dist = Math.abs(z - cameraZ)
      const baseFade = dist < 5 ? 0 : rings[i].opacity * Math.max(0, 1 - dist / (totalLen * 0.5))
      mesh.material.opacity = baseFade * globalFade
    })
  })

  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <mesh key={i} position={[0, 0, ring.baseZ]} scale={ring.scale}>
          <ringGeometry args={[radius - 0.012, radius, 96]} />
          <meshBasicMaterial
            color="#00f5ff"
            transparent
            opacity={ring.opacity}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

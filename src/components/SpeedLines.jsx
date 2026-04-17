import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from './Experience'

/* Reusable temp objects (avoid GC) */
const _fwd = new THREE.Vector3()
const _defaultDir = new THREE.Vector3(0, 0, -1)
const _quat = new THREE.Quaternion()

/*
  SpeedLines — Estelas de hiperespacio. A velocidad baja son cortas
  y tenues. Al acelerar se estiran y brillan como salto a velocidad luz.
*/
export default function SpeedLines({ count = 300, radius = 7, length = 180, cameraPos = [0, 0, 0], cameraZ }) {
  const ref = useRef()
  const matRef = useRef()
  const baseLengths = useRef()
  const getCamZ = () => cameraPos ? cameraPos[2] : (cameraZ || 0)
  const getCamX = () => cameraPos ? cameraPos[0] : 0
  const getCamY = () => cameraPos ? cameraPos[1] : 0

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 6) // 2 verts per line
    const colors = new Float32Array(count * 6)
    const cyan = new THREE.Color('#aaddff')
    const lengths = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = radius * (0.7 + Math.random() * 0.4)
      const z = (Math.random() - 0.5) * length
      const lineLen = 0.5 + Math.random() * 2 // Cortas por defecto

      lengths[i] = lineLen

      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r

      positions[i * 6] = x
      positions[i * 6 + 1] = y
      positions[i * 6 + 2] = z
      positions[i * 6 + 3] = x
      positions[i * 6 + 4] = y
      positions[i * 6 + 5] = z + lineLen

      // Blanco a brillo tenue
      colors[i * 6] = cyan.r
      colors[i * 6 + 1] = cyan.g
      colors[i * 6 + 2] = cyan.b
      colors[i * 6 + 3] = cyan.r * 0.1
      colors[i * 6 + 4] = cyan.g * 0.1
      colors[i * 6 + 5] = cyan.b * 0.1
    }
    baseLengths.current = lengths
    return { positions, colors }
  }, [count, radius, length])

  useFrame(() => {
    if (!ref.current || !matRef.current) return
    const arr = ref.current.geometry.attributes.position.array
    const halfLen = length / 2

    // Center on full camera position
    ref.current.position.set(getCamX(), getCamY(), getCamZ())

    // Rotate to align with camera forward direction
    _fwd.set(
      scrollState.forwardX || 0,
      scrollState.forwardY || 0,
      scrollState.forwardZ || -1
    ).normalize()
    _quat.setFromUnitVectors(_defaultDir, _fwd)
    ref.current.quaternion.slerp(_quat, 0.1)

    const vel = Math.min(1, (scrollState.visualVelocity || 0) * 4)
    // Fade al inicio
    const offsetFade = Math.min(1, (scrollState.offset || 0) * 15)
    const effVel = vel * offsetFade

    // Invisible al frenar, aparece solo al acelerar
    matRef.current.opacity = effVel * effVel * 0.45

    for (let i = 0; i < count; i++) {
      const i6 = i * 6
      const z1 = arr[i6 + 2]
      const baseLen = baseLengths.current[i]
      // Líneas se estiran con la velocidad
      const stretchedLen = baseLen * 0.3 + effVel * effVel * 12

      arr[i6 + 5] = arr[i6 + 2] + stretchedLen

      // Recycle in local Z around 0 (group centered on camera)
      if (z1 < -halfLen * 0.5) {
        arr[i6 + 2] += length
        arr[i6 + 5] = arr[i6 + 2] + stretchedLen
      }
      if (z1 > halfLen * 0.5) {
        arr[i6 + 2] -= length
        arr[i6 + 5] = arr[i6 + 2] + stretchedLen
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count * 2} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count * 2} array={colors} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial
        ref={matRef}
        vertexColors
        transparent
        opacity={0.04}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  )
}

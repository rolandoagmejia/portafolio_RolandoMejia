import { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from './Experience'

/* Reusable temp objects (avoid GC) */
const _fwd = new THREE.Vector3()
const _defaultDir = new THREE.Vector3(0, 0, -1)
const _quat = new THREE.Quaternion()

/*
  Shader que estira las estrellas según la velocidad.
  A velocidad 0 = puntos estáticos (estrellas).
  A velocidad alta = se estiran como líneas (velocidad luz).
*/
const StarMaterial = {
  uniforms: {
    uVelocity: { value: 0 },
    uTime: { value: 0 },
    uSize: { value: 1.0 },
    uOffsetFade: { value: 0 },
  },
  vertexShader: /* glsl */ `
    attribute vec3 aVelocityDir;
    attribute float aSize;
    varying vec3 vColor;
    varying float vStretch;
    uniform float uVelocity;
    uniform float uTime;
    uniform float uSize;

    void main() {
      vColor = color;

      // Estirar posición en la dirección del movimiento (Z) según velocidad
      float stretch = uVelocity * 8.0;
      vec3 pos = position;

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

      // Estrellas pequeñas al frenar, crecen al acelerar
      float baseSz = aSize * uSize;
      float velBoost = 1.0 + uVelocity * 3.0;
      gl_PointSize = baseSz * velBoost * (80.0 / -mvPos.z);

      gl_Position = projectionMatrix * mvPos;
      vStretch = uVelocity;
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vColor;
    varying float vStretch;
    uniform float uOffsetFade;

    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float dist = length(uv);

      // Forma: círculo suave a baja velocidad, línea vertical a alta velocidad
      float stretch = 1.0 + vStretch * 6.0;
      vec2 scaled = vec2(uv.x, uv.y * stretch);
      float d = length(scaled);

      float alpha = smoothstep(0.5, 0.0, d);
      // Brillo central sutil
      float core = smoothstep(0.12, 0.0, d) * 0.3;
      alpha += core;

      // Estrellas siempre visibles (0.7 base), brillan más al acelerar
      float baseAlpha = 0.7 + vStretch * vStretch * 0.3;
      baseAlpha = clamp(baseAlpha, 0.0, 1.0);
      alpha *= baseAlpha;

      // Invisible solo al inicio (offset=0), aparecen al avanzar
      alpha *= uOffsetFade;
      alpha = clamp(alpha, 0.0, 1.0);

      // Color visible en reposo, se intensifica con velocidad
      float colorBoost = 0.6 + vStretch * 0.6;
      gl_FragColor = vec4(vColor * colorBoost, alpha);
    }
  `,
}

/*
  ParticleTunnel — Campo de estrellas que se estiran al acelerar.
  A velocidad 0 = cielo estrellado.
  A velocidad alta = hiperespacio.
*/
export default function ParticleTunnel({ count = 6000, radius = 6, length = 200, cameraPos = [0, 0, 0], cameraZ }) {
  const ref = useRef()
  const matRef = useRef()
  // Support both cameraPos (3D) and legacy cameraZ
  const getCamZ = () => cameraPos ? cameraPos[2] : (cameraZ || 0)
  const getCamX = () => cameraPos ? cameraPos[0] : 0
  const getCamY = () => cameraPos ? cameraPos[1] : 0

  const { positions, colors, sizes, speeds, angles, radii } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const speeds = new Float32Array(count)
    const angles = new Float32Array(count)
    const radii = new Float32Array(count)

    // Paleta de estrellas: blanco, blanco azulado, dorado tenue
    const white = new THREE.Color('#ffffff')
    const blueWhite = new THREE.Color('#cce8ff')
    const warmWhite = new THREE.Color('#fff4e0')
    const cyan = new THREE.Color('#00f5ff')

    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const r = radius * (0.3 + Math.random() * 0.8)
      const z = (Math.random() - 0.5) * length

      positions[i * 3] = Math.cos(a) * r
      positions[i * 3 + 1] = Math.sin(a) * r
      positions[i * 3 + 2] = z

      speeds[i] = 0.3 + Math.random() * 0.8
      angles[i] = a
      radii[i] = r

      // Tamaño variable — pequeños puntos de estrella
      sizes[i] = 0.3 + Math.random() * 0.7

      // Color de estrella
      const pick = Math.random()
      const c = pick < 0.25 ? white : pick < 0.55 ? blueWhite : pick < 0.80 ? warmWhite : cyan
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions, colors, sizes, speeds, angles, radii }
  }, [count, radius, length])

  useFrame((state) => {
    if (!ref.current || !matRef.current) return
    const t = state.clock.elapsedTime
    const arr = ref.current.geometry.attributes.position.array
    const halfLen = length / 2

    // Center on full camera position
    ref.current.position.set(getCamX(), getCamY(), getCamZ())

    // Rotate tunnel to align with camera forward direction
    _fwd.set(
      scrollState.forwardX || 0,
      scrollState.forwardY || 0,
      scrollState.forwardZ || -1
    ).normalize()
    _quat.setFromUnitVectors(_defaultDir, _fwd)
    ref.current.quaternion.slerp(_quat, 0.1)

    // Pasar velocidad visual combinada (scroll + flechas) al shader
    const vel = Math.min(1, (scrollState.visualVelocity || 0) * 3.5)
    // Fade: estrellas visibles casi desde el inicio (aparecen rápido)
    const offsetFade = Math.min(1, Math.max(0, ((scrollState.offset || 0) - 0.03) * 25))
    matRef.current.uniforms.uVelocity.value += (vel - matRef.current.uniforms.uVelocity.value) * 0.15
    matRef.current.uniforms.uOffsetFade.value += (offsetFade - matRef.current.uniforms.uOffsetFade.value) * 0.3
    matRef.current.uniforms.uTime.value = t

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const angle = angles[i] + t * 0.02 * speeds[i]
      const r = radii[i]

      arr[i3] = Math.cos(angle) * r
      arr[i3 + 1] = Math.sin(angle) * r

      // Recycle in local Z around 0 (group is centered on camera)
      let z = arr[i3 + 2]
      if (z < -halfLen * 0.5) z += length
      if (z > halfLen * 0.5) z -= length
      arr[i3 + 2] = z
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={StarMaterial.vertexShader}
        fragmentShader={StarMaterial.fragmentShader}
        uniforms={THREE.UniformsUtils.clone(StarMaterial.uniforms)}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

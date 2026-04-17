import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import ParticleTunnel from './ParticleTunnel'
import SpeedLines from './SpeedLines'

/*
  scrollState — Objeto mutable leído por CockpitHUD y efectos visuales.
*/
export const scrollState = { offset: 0, velocity: 0, visualVelocity: 0, steerX: 0, steerNorm: 0, forwardX: 0, forwardY: 0, forwardZ: -1 }

const NASA_FONT = '/fonts/Audiowide-Regular.ttf'

/* ── Flight constants ── */
const TOTAL_DISTANCE = 750
const MAX_SPEED = 1.5
const DRAG = 0.985
const SCROLL_THRUST = 0.08
const KEY_THRUST = 0.03
const AIM_SMOOTHING = 0.06
const AIM_RANGE = 0.7

/* ── Planetas esparcidos en 3D real — 360° ── */
const PLANETS = [
  { name: 'SOBRE MÍ',  pos: [50, 25, -150],   color: '#00f5ff', size: 3.5, type: 'ice'     },
  { name: 'SKILLS',     pos: [-60, -30, -250],  color: '#00ff88', size: 3.0, type: 'tech'    },
  { name: 'INDUSTRIAS', pos: [20, 55, -360],    color: '#ff8800', size: 4.0, type: 'rocky'   },
  { name: 'PROYECTOS',  pos: [-50, -20, -440],  color: '#ff3366', size: 3.2, type: 'crystal' },
  { name: 'CONTACTO',   pos: [40, -45, -540],   color: '#aa66ff', size: 4.5, type: 'gas'     },
]

/* Sol al final — destino final */
const SUN_POS = [0, 5, -660]
const SUN_COLOR = '#ffaa00'
const SUN_SIZE = 8

/* ═══════════════════════════════════════════════════════
   FreeFlightCamera — Apunta con mouse, acelera con scroll
   ═══════════════════════════════════════════════════════ */
function FreeFlightCamera() {
  const { camera, gl } = useThree()
  const speed = useRef(0)
  const smoothSpeed = useRef(0)
  const mouseNorm = useRef({ x: 0, y: 0 })
  const yaw = useRef(0)
  const pitch = useRef(0)
  const roll = useRef(0)
  const keysDown = useRef({})

  useEffect(() => {
    const onWheel = (e) => {
      e.preventDefault()
      if (e.deltaY > 0) {
        speed.current = Math.min(MAX_SPEED, speed.current + SCROLL_THRUST)
      } else {
        speed.current = Math.max(-MAX_SPEED * 0.4, speed.current - SCROLL_THRUST)
      }
    }
    const onMouseMove = (e) => {
      mouseNorm.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseNorm.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase()
      if (['w', 's', 'arrowup', 'arrowdown'].includes(k)) {
        e.preventDefault()
        keysDown.current[k] = true
      }
    }
    const onKeyUp = (e) => { keysDown.current[e.key.toLowerCase()] = false }

    /* ── Touch controls ── */
    let touchStartY = 0
    let lastTouchY = 0
    const onTouchStart = (e) => {
      const t = e.touches[0]
      touchStartY = t.clientY
      lastTouchY = t.clientY
      mouseNorm.current.x = (t.clientX / window.innerWidth - 0.5) * 2
      mouseNorm.current.y = (t.clientY / window.innerHeight - 0.5) * 2
    }
    const onTouchMove = (e) => {
      e.preventDefault()
      const t = e.touches[0]
      // Aim direction from finger position
      mouseNorm.current.x = (t.clientX / window.innerWidth - 0.5) * 2
      mouseNorm.current.y = (t.clientY / window.innerHeight - 0.5) * 2
      // Vertical drag = thrust (drag down = forward, drag up = reverse)
      const dy = lastTouchY - t.clientY
      lastTouchY = t.clientY
      if (Math.abs(dy) > 0.5) {
        speed.current = THREE.MathUtils.clamp(
          speed.current + dy * 0.003,
          -MAX_SPEED * 0.4,
          MAX_SPEED
        )
      }
    }
    const onTouchEnd = () => {
      touchStartY = 0
      lastTouchY = 0
    }

    gl.domElement.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('keyup', onKeyUp, { capture: true })
    gl.domElement.addEventListener('touchstart', onTouchStart, { passive: true })
    gl.domElement.addEventListener('touchmove', onTouchMove, { passive: false })
    gl.domElement.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      gl.domElement.removeEventListener('wheel', onWheel)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      window.removeEventListener('keyup', onKeyUp, { capture: true })
      gl.domElement.removeEventListener('touchstart', onTouchStart)
      gl.domElement.removeEventListener('touchmove', onTouchMove)
      gl.domElement.removeEventListener('touchend', onTouchEnd)
    }
  }, [gl])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const keys = keysDown.current

    if (keys.w || keys.arrowup) speed.current = Math.min(MAX_SPEED, speed.current + KEY_THRUST)
    if (keys.s || keys.arrowdown) speed.current = Math.max(-MAX_SPEED * 0.4, speed.current - KEY_THRUST)

    const targetYaw = -mouseNorm.current.x * AIM_RANGE
    const targetPitch = -mouseNorm.current.y * AIM_RANGE * 0.6

    yaw.current += (targetYaw - yaw.current) * AIM_SMOOTHING
    pitch.current += (targetPitch - pitch.current) * AIM_SMOOTHING

    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyEuler(new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ'))

    speed.current *= DRAG
    if (Math.abs(speed.current) < 0.0005) speed.current = 0
    smoothSpeed.current += (Math.abs(speed.current) - smoothSpeed.current) * 0.08

    camera.position.addScaledVector(forward, speed.current * 80 * dt)

    // Boundary — no pasar del sol ni ir muy atrás
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, SUN_POS[2] + 15, 15)
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -120, 120)
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, -100, 100)
    if (camera.position.z <= SUN_POS[2] + 16 || camera.position.z >= 14) speed.current *= 0.5

    const look = camera.position.clone().addScaledVector(forward, 20)
    camera.lookAt(look)

    const targetRoll = yaw.current * 0.12
    roll.current += (targetRoll - roll.current) * 0.04
    camera.rotation.z = roll.current

    const dist = camera.position.length()
    scrollState.offset = Math.max(0, Math.min(1, dist / TOTAL_DISTANCE))
    scrollState.velocity = speed.current
    scrollState.visualVelocity = Math.min(1, smoothSpeed.current * 4)
    scrollState.steerX = mouseNorm.current.x * 3
    scrollState.steerNorm = THREE.MathUtils.clamp(mouseNorm.current.x, -1, 1)
    scrollState.forwardX = forward.x
    scrollState.forwardY = forward.y
    scrollState.forwardZ = forward.z
  })

  return null
}

/* ═══════════════════════════════════════════════════════
   HeroText3D — Nombre estilo NASA, fade al alejarse
   ═══════════════════════════════════════════════════════ */
function HeroText3D() {
  const groupRef = useRef()

  useFrame(({ camera }) => {
    if (!groupRef.current) return
    const dist = camera.position.distanceTo(groupRef.current.position)
    const fade = Math.max(0, 1 - dist / 30)
    groupRef.current.children.forEach(child => {
      if (child.material) child.material.opacity = fade
    })
  })

  return (
    <group ref={groupRef} position={[0, 0.3, -8]}>
      <Text font={NASA_FONT} fontSize={2.2} letterSpacing={0.2} color="#00f5ff"
        anchorX="center" anchorY="middle" position={[0, 0.9, 0]}
        material-transparent material-opacity={1} material-depthWrite={false}>
        ROLANDO
      </Text>
      <Text font={NASA_FONT} fontSize={2.2} letterSpacing={0.2} color="#00f5ff"
        anchorX="center" anchorY="middle" position={[0, -0.9, 0]}
        material-transparent material-opacity={1} material-depthWrite={false}>
        MEJIA
      </Text>
      <Text font={NASA_FONT} fontSize={0.22} letterSpacing={0.25} color="#0080ff"
        anchorX="center" anchorY="middle" position={[0, -2.2, 0]}
        material-transparent material-opacity={0.7} material-depthWrite={false}>
        FULL STACK DEVELOPER  •  RPA SPECIALIST
      </Text>
      <Text font={NASA_FONT} fontSize={0.13} letterSpacing={0.4} color="#00f5ff"
        anchorX="center" anchorY="middle" position={[0, -2.8, 0]}
        material-transparent material-opacity={0.3} material-depthWrite={false}>
        {'APUNTA CON MOUSE  •  SCROLL ▽ ACELERAR  •  W PROPULSAR'}
      </Text>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════
   PlanetRing — Anillo orbital (como Saturno)
   ═══════════════════════════════════════════════════════ */
function PlanetRing({ innerRadius, outerRadius, color, tiltX = 1.2, tiltZ = 0.3 }) {
  return (
    <mesh rotation={[tiltX, 0, tiltZ]}>
      <ringGeometry args={[innerRadius, outerRadius, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.35}
        blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════════
   Planet3D — Cada tipo tiene geometría y rasgos únicos
   ice: esfera lisa con anillos cristalinos
   tech: icosaedro wireframe (digital)
   rocky: dodecaedro irregular (superficie rocosa)
   crystal: octaedro facetado con brillo
   gas: esfera grande con 2 anillos inclinados
   ═══════════════════════════════════════════════════════ */
function Planet3D({ name, pos, color, size, type }) {
  const groupRef = useRef()
  const coreRef = useRef()
  const [hovered, setHovered] = useState(false)

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    window.dispatchEvent(new CustomEvent('planet-click', { detail: { name, color } }))
  }, [name, color])

  useFrame(({ camera }) => {
    if (!groupRef.current) return
    const dist = camera.position.distanceTo(groupRef.current.position)
    // Visible a 250 unidades, fade gradual
    const farFade = dist < 40 ? 1 : dist < 250 ? (250 - dist) / 210 : 0
    const nearBoost = dist < 25 ? (1 - dist / 25) * 0.4 : 0
    const fade = Math.min(1, farFade + nearBoost)
    const t = Date.now() * 0.001
    const hoverBoost = hovered ? 1.3 : 1

    // Rotate the core body
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.003
      if (type === 'tech') coreRef.current.rotation.x += 0.002
      if (type === 'crystal') coreRef.current.rotation.z += 0.004
    }

    groupRef.current.traverse(child => {
      if (!child.material || child.userData?.isHitbox) return
      // Guardar opacidad base la primera vez
      if (child.material._baseOp === undefined) {
        child.material._baseOp = Math.max(child.material.opacity, 0.6)
      }
      child.material.opacity = child.material._baseOp * fade * hoverBoost
    })

  })

  const renderBody = () => {
    switch (type) {
      case 'ice':
        return (
          <group ref={coreRef}>
            <mesh>
              <sphereGeometry args={[size * 0.45, 32, 32]} />
              <meshBasicMaterial color={color} transparent opacity={0.8}
                blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <PlanetRing innerRadius={size * 0.7} outerRadius={size * 1.1} color="#88ddff" tiltX={1.3} tiltZ={0.2} />
          </group>
        )
      case 'tech':
        return (
          <group ref={coreRef}>
            {/* Wireframe icosaedro — look digital */}
            <mesh>
              <icosahedronGeometry args={[size * 0.45, 1]} />
              <meshBasicMaterial color={color} wireframe transparent opacity={0.9}
                blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            {/* Inner solid */}
            <mesh>
              <icosahedronGeometry args={[size * 0.25, 0]} />
              <meshBasicMaterial color={color} transparent opacity={0.4}
                blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>
        )
      case 'rocky':
        return (
          <group ref={coreRef}>
            {/* Dodecaedro — superficie irregular */}
            <mesh>
              <dodecahedronGeometry args={[size * 0.5, 1]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.2}
                transparent opacity={0.85} emissive={color} emissiveIntensity={0.3} />
            </mesh>
            {/* Anillo de asteroides (torus delgado) */}
            <mesh rotation={[1.4, 0.3, 0]}>
              <torusGeometry args={[size * 0.9, 0.06, 8, 40]} />
              <meshBasicMaterial color={color} transparent opacity={0.3}
                blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>
        )
      case 'crystal':
        return (
          <group ref={coreRef}>
            {/* Octaedro — cristal facetado */}
            <mesh>
              <octahedronGeometry args={[size * 0.5, 0]} />
              <meshBasicMaterial color={color} transparent opacity={0.7}
                blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            {/* Segundo octaedro rotado — efecto estrella */}
            <mesh rotation={[0, Math.PI / 4, Math.PI / 4]}>
              <octahedronGeometry args={[size * 0.35, 0]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.3}
                blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>
        )
      case 'gas':
        return (
          <group ref={coreRef}>
            {/* Gas giant — esfera grande */}
            <mesh>
              <sphereGeometry args={[size * 0.5, 32, 32]} />
              <meshBasicMaterial color={color} transparent opacity={0.6}
                blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            {/* Doble anillo */}
            <PlanetRing innerRadius={size * 0.7} outerRadius={size * 1.0} color={color} tiltX={1.2} tiltZ={0.1} />
            <PlanetRing innerRadius={size * 1.05} outerRadius={size * 1.25} color="#ddaaff" tiltX={1.3} tiltZ={-0.15} />
          </group>
        )
      default:
        return (
          <mesh ref={coreRef}>
            <sphereGeometry args={[size * 0.4, 24, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.8}
              blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        )
    }
  }

  return (
    <group ref={groupRef} position={pos}>
      {/* Hitbox invisible */}
      <mesh
        userData={{ isHitbox: true }}
        onClick={handleClick}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      >
        <sphereGeometry args={[size * 1.6, 16, 16]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>

      {/* Planet body — unique per type */}
      {renderBody()}



      {/* HUD Label */}
      <Billboard>
        <Text font={NASA_FONT} fontSize={0.35} letterSpacing={0.3} color={color}
          anchorX="center" anchorY="middle" position={[0, size * 1.4 + 0.6, 0]}
          material-transparent material-opacity={0.8} material-depthWrite={false}>
          {`[ ${name} ]`}
        </Text>
        <Text font={NASA_FONT} fontSize={0.13} letterSpacing={0.2} color={color}
          anchorX="center" anchorY="middle" position={[0, -(size * 1.2 + 0.5), 0]}
          material-transparent material-opacity={0.6} material-depthWrite={false}>
          ▸ CLICK PARA INFO ◂
        </Text>
      </Billboard>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════
   Sun3D — Sol al final del viaje, click abre chat
   Corona animada con capas de glow
   ═══════════════════════════════════════════════════════ */
function Sun3D() {
  const groupRef = useRef()
  const coronaRef = useRef()
  const corona2Ref = useRef()
  const [hovered, setHovered] = useState(false)

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    window.dispatchEvent(new CustomEvent('open-chat'))
  }, [])

  useFrame(({ camera }) => {
    if (!groupRef.current) return
    const dist = camera.position.distanceTo(groupRef.current.position)
    const farFade = dist < 60 ? 1 : dist < 250 ? (250 - dist) / 190 : 0
    const nearBoost = dist < 40 ? (1 - dist / 40) * 0.4 : 0
    const fade = Math.min(1, farFade + nearBoost)
    const t = Date.now() * 0.001

    // Rotate corona layers
    if (coronaRef.current) {
      coronaRef.current.rotation.y += 0.002
      coronaRef.current.rotation.z += 0.001
      const pulse = 1 + Math.sin(t * 1.5) * 0.08
      coronaRef.current.scale.setScalar(pulse)
      coronaRef.current.material.opacity = fade * (0.25 + Math.sin(t * 2) * 0.1)
    }
    if (corona2Ref.current) {
      corona2Ref.current.rotation.y -= 0.003
      corona2Ref.current.rotation.x += 0.001
      const pulse2 = 1 + Math.sin(t * 1.2 + 1) * 0.06
      corona2Ref.current.scale.setScalar(pulse2)
      corona2Ref.current.material.opacity = fade * (0.15 + Math.sin(t * 1.8 + 2) * 0.08)
    }

    groupRef.current.traverse(child => {
      if (!child.material || child === coronaRef.current || child === corona2Ref.current || child.userData?.isHitbox) return
      if (child.material._baseOp === undefined) {
        child.material._baseOp = Math.max(child.material.opacity, 0.6)
      }
      child.material.opacity = child.material._baseOp * fade * (hovered ? 1.3 : 1)
    })
  })

  return (
    <group ref={groupRef} position={SUN_POS}>
      {/* Hitbox */}
      <mesh
        userData={{ isHitbox: true }}
        onClick={handleClick}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      >
        <sphereGeometry args={[SUN_SIZE * 1.5, 16, 16]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>

      {/* Core */}
      <mesh>
        <sphereGeometry args={[SUN_SIZE * 0.4, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[SUN_SIZE * 0.6, 32, 32]} />
        <meshBasicMaterial color={SUN_COLOR} transparent opacity={0.5}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Corona layer 1 */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[SUN_SIZE * 1.0, 16, 16]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.25}
          blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>

      {/* Corona layer 2 — outer */}
      <mesh ref={corona2Ref}>
        <sphereGeometry args={[SUN_SIZE * 1.4, 12, 12]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0.12}
          blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>

      {/* HUD Label */}
      <Billboard>
        <Text font={NASA_FONT} fontSize={0.55} letterSpacing={0.35} color={SUN_COLOR}
          anchorX="center" anchorY="middle" position={[0, SUN_SIZE * 1.6 + 1, 0]}
          material-transparent material-opacity={0.8} material-depthWrite={false}>
          {'[ ☀ CHAT CONMIGO ]'}
        </Text>
        <Text font={NASA_FONT} fontSize={0.18} letterSpacing={0.2} color="#ffcc44"
          anchorX="center" anchorY="middle" position={[0, -(SUN_SIZE * 1.4 + 0.7), 0]}
          material-transparent material-opacity={0.6} material-depthWrite={false}>
          ▸ CLICK PARA CONVERSAR ◂
        </Text>
      </Billboard>

      {/* Point light — ilumina planetas rocky cercanos */}
      <pointLight color={SUN_COLOR} intensity={8} distance={80} decay={2} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════
   SpaceWorld — Estrellas + SpeedLines + Planetas + Sol
   ═══════════════════════════════════════════════════════ */
function SpaceWorld() {
  const { camera } = useThree()
  const [camPos, setCamPos] = useState([0, 0.3, 8])

  useFrame(() => {
    setCamPos([camera.position.x, camera.position.y, camera.position.z])
  })

  return (
    <>
      {/* Ambient light for rocky/standard materials */}
      <ambientLight intensity={0.15} />

      {PLANETS.map((p, i) => (
        <Planet3D key={i} name={p.name} pos={p.pos} color={p.color} size={p.size} type={p.type} />
      ))}
      <Sun3D />
      <ParticleTunnel count={6000} radius={50} length={800} cameraPos={camPos} />
      <SpeedLines count={400} radius={40} length={800} cameraPos={camPos} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   Experience — Componente raíz 3D (vuelo libre)
   ═══════════════════════════════════════════════════════ */
export default function Experience() {
  return (
    <>
      <FreeFlightCamera />
      <SpaceWorld />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.7}
          radius={0.6}
        />
      </EffectComposer>
    </>
  )
}

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/*
  ShooterGame — Juego de disparos en PRIMERA PERSONA estilo espacial.
  La cámara mira hacia adelante (-Z). Enemigos vienen de frente.
  Mouse para apuntar, click/espacio para disparar.
  Fullscreen overlay con su propio Canvas 3D.
*/

/* ── Game State factory ── */
function createGameState() {
  return {
    bullets: [],
    enemies: [],
    particles: [],
    score: 0,
    health: 100,
    gameOver: false,
    wave: 1,
    mouseX: 0,
    mouseY: 0,
    shooting: false,
    lastShot: 0,
    spawnTimer: 0,
  }
}

/* ── Stars background ── */
function GameStars({ count = 2000 }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 200
      arr[i * 3 + 1] = (Math.random() - 0.5) * 200
      arr[i * 3 + 2] = -Math.random() * 300
    }
    return arr
  }, [count])

  useFrame((_, dt) => {
    if (!ref.current) return
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 2] += 30 * dt
      if (arr[i * 3 + 2] > 10) arr[i * 3 + 2] -= 310
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.3} transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  )
}

/* ── Tunnel rings for atmosphere ── */
function GameRings({ count = 20 }) {
  const groupRef = useRef()
  const rings = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      z: -i * 15,
      scale: 0.9 + Math.random() * 0.2,
      opacity: 0.03 + Math.random() * 0.06,
    })), [count])

  useFrame((_, dt) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((mesh) => {
      mesh.position.z += 20 * dt
      if (mesh.position.z > 10) mesh.position.z -= count * 15
    })
  })

  return (
    <group ref={groupRef}>
      {rings.map((r, i) => (
        <mesh key={i} position={[0, 0, r.z]} scale={r.scale}>
          <ringGeometry args={[7.8, 8, 64]} />
          <meshBasicMaterial
            color="#00f5ff"
            transparent
            opacity={r.opacity}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ── Crosshair (3D, follows mouse) ── */
function Crosshair({ gameStateRef }) {
  const ref = useRef()

  useFrame(() => {
    if (!ref.current) return
    const gs = gameStateRef.current
    ref.current.position.set(gs.mouseX * 8, gs.mouseY * 5, -12)
  })

  return (
    <group ref={ref}>
      <mesh>
        <ringGeometry args={[0.18, 0.24, 32]} />
        <meshBasicMaterial color="#00f5ff" transparent opacity={0.8} side={THREE.DoubleSide} depthTest={false} />
      </mesh>
      {[0, Math.PI / 2].map((rot, i) => (
        <mesh key={i} rotation={[0, 0, rot]}>
          <planeGeometry args={[0.6, 0.04]} />
          <meshBasicMaterial color="#00f5ff" transparent opacity={0.4} side={THREE.DoubleSide} depthTest={false} />
        </mesh>
      ))}
    </group>
  )
}

/* ── Main Game Logic (runs in useFrame) ── */
function GameScene({ gameStateRef, syncUI }) {
  const { scene } = useThree()
  const enemyGroup = useRef()
  const bulletGroup = useRef()
  const particleGroup = useRef()
  const frameCount = useRef(0)

  // Create reusable geometries and materials
  const enemyGeo = useMemo(() => new THREE.OctahedronGeometry(0.6, 0), [])
  const enemyMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff3366', transparent: true, opacity: 0.9 }), [])
  const bulletGeo = useMemo(() => new THREE.SphereGeometry(0.15, 6, 6), [])
  const bulletMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#00ff88' }), [])
  const particleGeo = useMemo(() => new THREE.SphereGeometry(0.12, 4, 4), [])
  const particleMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ffaa33', transparent: true, blending: THREE.AdditiveBlending,
  }), [])

  useFrame((state, dt) => {
    const gameState = gameStateRef.current
    if (gameState.gameOver) return
    frameCount.current++
    const now = state.clock.elapsedTime

    // ── Spawn enemies ──
    gameState.spawnTimer += dt
    const spawnRate = Math.max(0.25, 0.7 - gameState.wave * 0.04)
    if (gameState.spawnTimer > spawnRate) {
      gameState.spawnTimer = 0
      const spread = 5 + gameState.wave * 0.3
      gameState.enemies.push({
        x: (Math.random() - 0.5) * spread * 2,
        y: (Math.random() - 0.5) * spread,
        z: -130 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1,
        speed: 18 + gameState.wave * 2.5 + Math.random() * 5,
        mesh: null,
      })
    }

    // ── Shooting ──
    if (gameState.shooting && now - gameState.lastShot > 0.1) {
      gameState.lastShot = now
      const aimX = gameState.mouseX * 8
      const aimY = gameState.mouseY * 5
      gameState.bullets.push({
        x: aimX * 0.15,
        y: aimY * 0.15 - 0.3,
        z: -3,
        dx: aimX * 0.08,
        dy: aimY * 0.05,
        mesh: null,
      })
    }

    // ── Update enemies ──
    for (const e of gameState.enemies) {
      e.z += e.speed * dt
      e.x += e.vx * dt
      e.y += e.vy * dt

      if (!e.mesh) {
        e.mesh = new THREE.Mesh(enemyGeo, enemyMat.clone())
        enemyGroup.current.add(e.mesh)
      }
      e.mesh.position.set(e.x, e.y, e.z)
      e.mesh.rotation.x += dt * 2
      e.mesh.rotation.z += dt * 1.5

      // Enemy reached player
      if (e.z > -1) {
        e.dead = true
        gameState.health -= 12
        if (gameState.health <= 0) {
          gameState.health = 0
          gameState.gameOver = true
        }
      }
    }

    // ── Update bullets ──
    for (const b of gameState.bullets) {
      b.z -= 90 * dt
      b.x += b.dx * dt * 4
      b.y += b.dy * dt * 4

      if (!b.mesh) {
        b.mesh = new THREE.Mesh(bulletGeo, bulletMat)
        bulletGroup.current.add(b.mesh)
      }
      b.mesh.position.set(b.x, b.y, b.z)

      // Collision with enemies
      for (const e of gameState.enemies) {
        if (e.dead) continue
        const dx = b.x - e.x
        const dy = b.y - e.y
        const dz = b.z - e.z
        if (Math.abs(dx) < 1.3 && Math.abs(dy) < 1.3 && Math.abs(dz) < 1.8) {
          e.dead = true
          b.dead = true
          gameState.score += 10
          // Explosion
          for (let p = 0; p < 6; p++) {
            const pm = new THREE.Mesh(particleGeo, particleMat.clone())
            pm.position.set(e.x, e.y, e.z)
            particleGroup.current.add(pm)
            gameState.particles.push({
              mesh: pm,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              vz: (Math.random() - 0.5) * 10,
              life: 1,
            })
          }
          break
        }
      }

      if (b.z < -200) b.dead = true
    }

    // ── Update particles ──
    for (const p of gameState.particles) {
      p.life -= dt * 2.5
      if (p.mesh) {
        p.mesh.position.x += p.vx * dt
        p.mesh.position.y += p.vy * dt
        p.mesh.position.z += p.vz * dt
        p.mesh.material.opacity = Math.max(0, p.life)
        p.mesh.scale.setScalar(Math.max(0.01, p.life * 0.8))
      }
    }

    // ── Cleanup dead ──
    for (const e of gameState.enemies) {
      if (e.dead && e.mesh) { enemyGroup.current.remove(e.mesh); e.mesh.geometry !== enemyGeo && e.mesh.geometry.dispose() }
    }
    for (const b of gameState.bullets) {
      if (b.dead && b.mesh) { bulletGroup.current.remove(b.mesh) }
    }
    gameState.particles = gameState.particles.filter(p => {
      if (p.life <= 0 && p.mesh) { particleGroup.current.remove(p.mesh); p.mesh.material.dispose(); return false }
      return true
    })
    gameState.enemies = gameState.enemies.filter(e => !e.dead)
    gameState.bullets = gameState.bullets.filter(b => !b.dead)

    // Wave progression
    const newWave = Math.floor(gameState.score / 80) + 1
    if (newWave !== gameState.wave) gameState.wave = newWave

    // Sync React state periodically
    if (frameCount.current % 4 === 0) syncUI()
  })

  return (
    <>
      <GameStars />
      <GameRings />
      <Crosshair gameStateRef={gameStateRef} />
      <group ref={enemyGroup} />
      <group ref={bulletGroup} />
      <group ref={particleGroup} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   ShooterGame — Overlay fullscreen con juego 3D primera persona
   ═══════════════════════════════════════════════════════ */
export default function ShooterGame({ onClose }) {
  const gameStateRef = useRef(createGameState())
  const [score, setScore] = useState(0)
  const [health, setHealth] = useState(100)
  const [wave, setWave] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const canvasKey = useRef(0)

  const syncUI = useCallback(() => {
    const gs = gameStateRef.current
    setScore(gs.score)
    setHealth(gs.health)
    setWave(gs.wave)
    if (gs.gameOver) setGameOver(true)
  }, [])

  const reset = useCallback(() => {
    // New key forces Canvas remount, cleaning all 3D meshes
    canvasKey.current++
    gameStateRef.current = createGameState()
    setScore(0)
    setHealth(100)
    setWave(1)
    setGameOver(false)
    setStarted(true)
  }, [])

  // Mouse tracking — always read gameStateRef.current inside handlers
  const containerRef = useRef()
  const handleMouseMove = useCallback((e) => {
    gameStateRef.current.mouseX = (e.clientX / window.innerWidth) * 2 - 1
    gameStateRef.current.mouseY = -(e.clientY / window.innerHeight) * 2 + 1
  }, [])
  const handleMouseDown = useCallback(() => { gameStateRef.current.shooting = true }, [])
  const handleMouseUp = useCallback(() => { gameStateRef.current.shooting = false }, [])

  // Keyboard (space to shoot, R to restart)
  useEffect(() => {
    const down = (e) => {
      if (e.key === ' ') { e.preventDefault(); gameStateRef.current.shooting = true }
      if ((e.key === 'r' || e.key === 'R') && gameStateRef.current.gameOver) reset()
    }
    const up = (e) => {
      if (e.key === ' ') gameStateRef.current.shooting = false
    }
    window.addEventListener('keydown', down, { capture: true })
    window.addEventListener('keyup', up, { capture: true })
    return () => {
      window.removeEventListener('keydown', down, { capture: true })
      window.removeEventListener('keyup', up, { capture: true })
    }
  }, [reset])

  return (
    <div
      ref={containerRef}
      className="shooter-game"
      style={{ cursor: started ? 'crosshair' : 'default' }}
      onMouseMove={started ? handleMouseMove : undefined}
      onMouseDown={started ? handleMouseDown : undefined}
      onMouseUp={started ? handleMouseUp : undefined}
    >
      {/* HUD */}
      <div className="shooter-header" style={{ zIndex: 10, pointerEvents: 'auto' }}>
        <span className="shooter-title">⚡ DEFENSA ESPACIAL</span>
        <span className="shooter-score">WAVE {wave} &nbsp;|&nbsp; SCORE: {score}</span>
        <button className="shooter-close" onClick={onClose}>✕ VOLVER</button>
      </div>

      {/* Health bar */}
      {started && (
        <div className="shooter-health-bar" style={{ zIndex: 10, pointerEvents: 'none' }}>
          <div
            className="shooter-health-fill"
            style={{
              width: `${health}%`,
              background: health > 50 ? '#00f5ff' : health > 25 ? '#ffaa33' : '#ff3366',
            }}
          />
          <span className="shooter-health-text">SHIELDS: {health}%</span>
        </div>
      )}

      {!started ? (
        <div className="shooter-start" onClick={reset}>
          <p className="shooter-start-title">DEFENSA ESPACIAL</p>
          <p className="shooter-start-sub">
            MOUSE para apuntar &nbsp;&nbsp; CLICK / ESPACIO para disparar
          </p>
          <button className="ts-btn" onClick={reset}>INICIAR MISIÓN</button>
        </div>
      ) : (
        <>
          <Canvas
            key={canvasKey.current}
            style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
            camera={{ position: [0, 0, 0], fov: 70, near: 0.1, far: 350 }}
            dpr={[1, 1.5]}
            gl={{ antialias: false, alpha: false }}
            events={() => ({ enabled: false, priority: 0 })}
          >
            <color attach="background" args={['#000005']} />
            <fog attach="fog" args={['#000005', 50, 200]} />
            <GameScene gameStateRef={gameStateRef} syncUI={syncUI} />
          </Canvas>

          {/* Game Over overlay */}
          {gameOver && (
            <div className="shooter-gameover">
              <h2 className="shooter-gameover-title">NAVE DESTRUIDA</h2>
              <p className="shooter-gameover-score">SCORE: {score} &nbsp;|&nbsp; WAVE: {wave}</p>
              <p className="shooter-gameover-hint">PRESIONA R PARA REINICIAR</p>
              <button className="ts-btn" onClick={reset} style={{ marginTop: '1rem' }}>
                REINICIAR
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

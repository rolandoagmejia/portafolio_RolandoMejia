import { useState, useEffect, useRef } from 'react'
import { scrollState } from './Experience'

/*
  CockpitHUD — Overlay de nave espacial.
  SPEED: sube al hacer scroll (propulsión), baja al detenerse.
  THRUST: porcentaje de empuje basado en scroll velocity.
  STEERING: indicador visual de maniobra lateral.
*/
const SECTIONS = [
  'SECTOR INICIO',
  '◄ SOBRE MÍ / SKILLS ►',
  '◄ SOBRE MÍ / SKILLS ►',
  '◄ INDUSTRIAS / PROYECTOS ►',
  '◄ INDUSTRIAS / PROYECTOS ►',
  'SECTOR CONTACTO',
]

export default function CockpitHUD() {
  const [pct, setPct] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [thrust, setThrust] = useState(0)
  const [section, setSection] = useState('SECTOR INICIO')
  const [steer, setSteer] = useState(0)
  const rafRef = useRef()
  const displaySpeed = useRef(0)

  useEffect(() => {
    const tick = () => {
      const t = scrollState.offset * 100
      setPct(t)

      // Velocidad: basada en velocidad visual combinada (scroll + flechas)
      const v = scrollState.visualVelocity || 0
      const targetSpd = Math.min(9999, v * 10000)
      // Inercia: sube rápido, baja lento (como una nave desacelerando)
      const factor = targetSpd > displaySpeed.current ? 0.2 : 0.04
      displaySpeed.current += (targetSpd - displaySpeed.current) * factor
      setSpeed(Math.round(displaySpeed.current))

      // Thrust % — empuje actual
      const thrustPct = Math.min(100, Math.round(v * 600))
      setThrust(thrustPct)

      // Steering
      setSteer(scrollState.steerX || 0)

      // Section
      const idx = Math.min(Math.floor(scrollState.offset * SECTIONS.length), SECTIONS.length - 1)
      setSection(SECTIONS[Math.max(0, idx)])

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Color del velocímetro según velocidad
  const speedColor = speed > 5000 ? '#ff3333' : speed > 2000 ? '#ffaa00' : undefined

  return (
    <div className="cockpit-hud">
      {/* Top bar */}
      <div className="hud-top">
        <span className="hud-label">NAVE RM-2026</span>
        <span className="hud-section">{section}</span>
        <span className="hud-label">WARP MODE</span>
      </div>

      {/* Steering indicator */}
      <div className="hud-steer">
        <div className="hud-steer-track">
          <div
            className="hud-steer-needle"
            style={{ left: `${50 + (steer / 4) * 45}%` }}
          />
          <div className="hud-steer-center" />
        </div>
        <span className="hud-steer-label">MANIOBRA</span>
      </div>

      {/* Side arrows hints */}
      <div className="hud-side-hint hud-side-hint--left">◄</div>
      <div className="hud-side-hint hud-side-hint--right">►</div>

      {/* Bottom telemetry */}
      <div className="hud-bottom">
        <div className="hud-gauge">
          <span className="hud-gauge-value" style={speedColor ? { color: speedColor, textShadow: `0 0 25px ${speedColor}` } : undefined}>
            {speed}
          </span>
          <span className="hud-gauge-unit">U/S</span>
        </div>

        <div className="hud-center-block">
          <div className="hud-thrust">
            <div className="hud-thrust-bar">
              <div className="hud-thrust-fill" style={{ height: `${thrust}%` }} />
            </div>
            <span className="hud-thrust-label">THR {thrust}%</span>
          </div>

          <div className="hud-progress">
            <div className="hud-progress-track">
              <div className="hud-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="hud-progress-label">TRAYECTO {Math.round(pct)}%</span>
          </div>
        </div>

        <div className="hud-gauge">
          <span className="hud-gauge-value">{Math.round(pct * 2.5)}</span>
          <span className="hud-gauge-unit">LY</span>
        </div>
      </div>

      {/* Corner brackets */}
      <div className="hud-corner hud-corner--tl" />
      <div className="hud-corner hud-corner--tr" />
      <div className="hud-corner hud-corner--bl" />
      <div className="hud-corner hud-corner--br" />
    </div>
  )
}

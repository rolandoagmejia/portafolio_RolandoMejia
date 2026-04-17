import { useState, useEffect, useCallback } from 'react'

/*
  Contenido de cada planeta.
  Al hacer clic en un planeta 3D, se muestra su card como
  un readout holográfico estilo Iron Man.
*/
const skills = [
  'React', 'PHP', 'Python', 'MySQL', 'AWS', 'Azure',
  'BluePrism', 'PowerAutomate', 'N8N', 'Node.js', 'Docker', 'Git',
]
const sectors = [
  { icon: '🏦', name: 'Banca & Finanzas', desc: 'Automatización de procesos bancarios, KYC y compliance.' },
  { icon: '✈️', name: 'Aviación', desc: 'Dashboards operativos de vuelos y gestión aeroportuaria.' },
  { icon: '🛒', name: 'E-commerce', desc: 'Plataformas de venta, pasarelas de pago y analítica.' },
  { icon: '📍', name: 'Tracking', desc: 'Rastreo en tiempo real, logística y geolocalización.' },
]
const projects = [
  { sector: 'BANCA', title: 'Automatización Onboarding', tech: ['BluePrism', 'Python', 'AWS'], impact: '-70% tiempo de procesamiento' },
  { sector: 'AVIACIÓN', title: 'Dashboard Operativo Vuelos', tech: ['React', 'Node.js', 'Azure'], impact: 'Monitoreo 24/7 +50 vuelos/día' },
  { sector: 'E-COMMERCE', title: 'Plataforma Multi-canal', tech: ['React', 'PHP', 'MySQL'], impact: '+40% conversión de ventas' },
  { sector: 'RPA', title: 'Orquestación Flujos RPA', tech: ['N8N', 'PowerAutomate', 'Python'], impact: '+200 hrs/mes ahorradas' },
]

/* Mapa de contenido por nombre de planeta */
const PLANET_CONTENT = {
  'SOBRE MÍ': {
    number: '01',
    body: (
      <>
        <p className="planet-text">
          Desarrollador Full Stack y especialista en RPA desde Tegucigalpa, Honduras.
          Combino desarrollo de software con automatización inteligente para transformar
          procesos en industrias como banca, aviación y e-commerce.
        </p>
        <div className="planet-stats">
          <div className="planet-stat"><span className="planet-stat-num">5+</span><span className="planet-stat-lbl">Años Exp.</span></div>
          <div className="planet-stat"><span className="planet-stat-num">4</span><span className="planet-stat-lbl">Industrias</span></div>
          <div className="planet-stat"><span className="planet-stat-num">20+</span><span className="planet-stat-lbl">Proyectos</span></div>
          <div className="planet-stat"><span className="planet-stat-num">3</span><span className="planet-stat-lbl">Plataformas RPA</span></div>
        </div>
      </>
    ),
  },
  'SKILLS': {
    number: '02',
    body: (
      <div className="planet-tags">
        {skills.map((s) => (
          <span className="planet-tag" key={s}>{s}</span>
        ))}
      </div>
    ),
  },
  'INDUSTRIAS': {
    number: '03',
    body: (
      <div className="planet-grid">
        {sectors.map((s) => (
          <div className="planet-grid-item" key={s.name}>
            <span className="planet-grid-icon">{s.icon}</span>
            <span className="planet-grid-title">{s.name}</span>
            <span className="planet-grid-desc">{s.desc}</span>
          </div>
        ))}
      </div>
    ),
  },
  'PROYECTOS': {
    number: '04',
    body: (
      <div className="planet-grid">
        {projects.map((p, i) => (
          <div className="planet-grid-item" key={i}>
            <span className="planet-grid-sector">{p.sector}</span>
            <span className="planet-grid-title">{p.title}</span>
            <span className="planet-grid-impact">↗ {p.impact}</span>
            <div className="planet-mini-tags">
              {p.tech.map((t) => <span className="planet-mini-tag" key={t}>{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  'CONTACTO': {
    number: '05',
    body: (
      <>
        <p className="planet-text">¿Tienes un proyecto en mente? Hablemos.</p>
        <div className="planet-contact">
          <a className="planet-btn" href="https://linkedin.com/in/rolandomejia" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a className="planet-btn" href="https://github.com/rolandomejia" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a className="planet-btn" href="mailto:contacto@rolandomejia.dev">Email</a>
        </div>
      </>
    ),
  },
}

export default function PlanetInfoOverlay() {
  const [planet, setPlanet] = useState(null) // { name, color }
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      const { name, color } = e.detail
      setPlanet({ name, color })
      // Trigger enter animation
      requestAnimationFrame(() => setVisible(true))
    }
    window.addEventListener('planet-click', handler)
    return () => window.removeEventListener('planet-click', handler)
  }, [])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(() => setPlanet(null), 400) // Wait for exit animation
  }, [])

  if (!planet) return null

  const content = PLANET_CONTENT[planet.name]
  if (!content) return null

  return (
    <div
      className={`planet-overlay ${visible ? 'planet-overlay--visible' : ''}`}
      onClick={handleClose}
    >
      <div
        className="planet-card"
        style={{ '--planet-color': planet.color }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — estilo HUD Iron Man */}
        <div className="planet-card-header">
          <span className="planet-card-number">{content.number}</span>
          <div className="planet-card-title-row">
            <span className="planet-card-bracket">[</span>
            <h2 className="planet-card-title">{planet.name}</h2>
            <span className="planet-card-bracket">]</span>
          </div>
          <button className="planet-card-close" onClick={handleClose}>✕</button>
        </div>

        {/* Línea decorativa */}
        <div className="planet-card-line" />

        {/* Contenido */}
        <div className="planet-card-body">
          {content.body}
        </div>

        {/* Footer decorativo */}
        <div className="planet-card-footer">
          <span className="planet-card-status">◉ DATOS TRANSMITIDOS</span>
          <span className="planet-card-coords">SECTOR {content.number}</span>
        </div>
      </div>
    </div>
  )
}

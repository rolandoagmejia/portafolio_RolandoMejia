import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const projects = [
  {
    sector: 'Banca',
    title: 'Automatización de Onboarding Bancario',
    desc: 'Flujo end-to-end de apertura de cuentas con validación automática de documentos, KYC y activación en core bancario.',
    tech: ['BluePrism', 'Python', 'MySQL', 'AWS'],
    impact: 'Reducción del 70% en tiempo de procesamiento',
  },
  {
    sector: 'Aviación',
    title: 'Dashboard Operativo de Vuelos',
    desc: 'Panel en tiempo real para monitoreo de vuelos, asignación de gates y alertas operativas automatizadas.',
    tech: ['React', 'Node.js', 'MySQL', 'Azure'],
    impact: 'Visibilidad operativa 24/7 para +50 vuelos diarios',
  },
  {
    sector: 'E-commerce',
    title: 'Plataforma de Ventas Multi-canal',
    desc: 'Sistema de e-commerce con sincronización de inventarios, pasarela de pagos local y analítica de conversión.',
    tech: ['React', 'PHP', 'MySQL', 'AWS'],
    impact: 'Aumento del 40% en conversión de ventas',
  },
  {
    sector: 'Automatización',
    title: 'Orquestación de Flujos RPA',
    desc: 'Plataforma centralizada para gestión y monitoreo de robots RPA en múltiples ambientes empresariales.',
    tech: ['N8N', 'PowerAutomate', 'Python', 'Docker'],
    impact: '+200 horas/mes ahorradas en tareas manuales',
  },
  {
    sector: 'Tracking',
    title: 'Sistema de Rastreo en Tiempo Real',
    desc: 'Plataforma de geolocalización para seguimiento de envíos y activos con notificaciones automatizadas.',
    tech: ['React', 'Python', 'AWS', 'MySQL'],
    impact: 'Trazabilidad completa de entregas',
  },
  {
    sector: 'Banca',
    title: 'Motor de Reportes Regulatorios',
    desc: 'Generación automatizada de reportes para entes reguladores con validación de datos y entrega programada.',
    tech: ['BluePrism', 'PHP', 'MySQL'],
    impact: 'Eliminación de errores manuales en reportería',
  },
]

export default function Projects() {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.project-card', {
        scrollTrigger: { trigger: ref.current, start: 'top 70%', toggleActions: 'play none none reverse' },
        y: 60, opacity: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out',
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="section projects-section" id="projects" ref={ref}>
      <span className="section-number">04</span>
      <div style={{ maxWidth: 1100, width: '100%' }}>
        <div className="hud-line" />
        <h2 className="hud-heading">Proyectos</h2>
        <div className="projects-grid">
          {projects.map((p, i) => (
            <div className="glass-card project-card" key={i}>
              <span className="project-sector">{p.sector}</span>
              <h3 className="project-title">{p.title}</h3>
              <p className="project-desc">{p.desc}</p>
              <p className="project-impact">↗ {p.impact}</p>
              <div className="project-tags">
                {p.tech.map((t) => (
                  <span className="tech-tag" key={t}>{t}</span>
                ))}
              </div>
              <span className="project-client">Cliente: Confidencial</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

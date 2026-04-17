import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const sectors = [
  {
    icon: '🏦',
    name: 'Banca & Finanzas',
    desc: 'Automatización de procesos bancarios, integración de sistemas core y flujos de compliance con RPA.',
  },
  {
    icon: '✈️',
    name: 'Aviación',
    desc: 'Sistemas de seguimiento de vuelos, dashboards operativos y herramientas de gestión aeroportuaria.',
  },
  {
    icon: '🛒',
    name: 'E-commerce',
    desc: 'Plataformas de venta online, pasarelas de pago, gestión de inventarios y analítica de ventas.',
  },
  {
    icon: '📍',
    name: 'Seguimiento & Tracking',
    desc: 'Sistemas de rastreo en tiempo real, logística y monitoreo de activos con geolocalización.',
  },
]

export default function Sectors() {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.sector-card', {
        scrollTrigger: { trigger: ref.current, start: 'top 70%', toggleActions: 'play none none reverse' },
        y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out',
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="section sectors-section" id="sectors" ref={ref}>
      <span className="section-number">03</span>
      <div style={{ maxWidth: 1100, width: '100%' }}>
        <div className="hud-line" />
        <h2 className="hud-heading">Industrias</h2>
        <div className="sectors-grid">
          {sectors.map((s) => (
            <div className="glass-card sector-card" key={s.name}>
              <div className="sector-icon">{s.icon}</div>
              <div className="sector-name">{s.name}</div>
              <div className="sector-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function About() {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.about-text p, .about-text .hud-heading, .about-text .hud-line', {
        scrollTrigger: { trigger: ref.current, start: 'top 75%', toggleActions: 'play none none reverse' },
        y: 30, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out',
      })
      gsap.from('.stat-card', {
        scrollTrigger: { trigger: '.about-stats', start: 'top 80%', toggleActions: 'play none none reverse' },
        y: 40, opacity: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out',
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="section about-section" id="about" ref={ref}>
      <span className="section-number">01</span>
      <div className="about-grid">
        <div className="about-text">
          <div className="hud-line" />
          <h2 className="hud-heading">Sobre Mí</h2>
          <p>
            Soy <span className="highlight">Rolando Mejia</span>, un desarrollador Full Stack
            y especialista en RPA desde <span className="highlight">Tegucigalpa, Honduras</span>.
          </p>
          <p>
            Combino desarrollo de software con <span className="highlight">automatización inteligente</span> para
            transformar procesos en industrias como banca, aviación y e-commerce. Mi enfoque:
            soluciones que escalan y reducen fricciones operativas.
          </p>
          <p>
            Creo en el código limpio, la arquitectura sólida y en que la tecnología
            debe resolver problemas reales con <span className="highlight">impacto medible</span>.
          </p>
        </div>
        <div className="about-stats">
          {[
            { num: '5+', label: 'Años experiencia' },
            { num: '4', label: 'Industrias' },
            { num: '20+', label: 'Proyectos' },
            { num: '3', label: 'Plataformas RPA' },
          ].map((s) => (
            <div className="glass-card stat-card" key={s.label}>
              <div className="stat-number">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import '../styles/Hero.css'

/*
  Hero — Sección de entrada con nombre holográfico,
  brackets HUD y animaciones GSAP escalonadas.
*/
export default function Hero() {
  const sectionRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('.hero-hud-line', { scaleX: 0, opacity: 0, duration: 1 }, 0.3)
        .from('.hero-name', { y: 40, opacity: 0, duration: 1.2 }, 0.5)
        .from('.hero-role', { y: 20, opacity: 0, duration: 1 }, 0.9)
        .from('.hero-location', { opacity: 0, duration: 1 }, 1.2)
        .from('.bracket', { opacity: 0, scale: 0.8, stagger: 0.1, duration: 0.6 }, 0.4)
        .from('.hero-scroll-cta', { opacity: 0, y: 10, duration: 1 }, 1.8)
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="hero-section section" id="hero" ref={sectionRef}>
      <div className="hero-overlay">
        {/* Brackets decorativos tipo HUD */}
        <div className="hero-brackets">
          <div className="bracket bracket--tl" />
          <div className="bracket bracket--tr" />
          <div className="bracket bracket--bl" />
          <div className="bracket bracket--br" />
        </div>

        <div className="hero-hud-line" />
        <h1 className="hero-name">Rolando Mejia</h1>
        <p className="hero-role">Full Stack Developer &bull; RPA Specialist</p>
        <p className="hero-location">Tegucigalpa, Honduras</p>
        <div className="hero-hud-line" />
      </div>

      <div className="hero-scroll-cta">
        <span>Explorar</span>
        <div className="scroll-line" />
      </div>
    </section>
  )
}

import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { scrollState } from './Experience'
import '../styles/Hero.css'

/*
  Hero — Overlay HTML fijo con nombre holográfico.
  Desaparece cuando la cámara empieza a moverse.
*/
export default function Hero() {
  const sectionRef = useRef()
  const [visible, setVisible] = useState(true)
  const rafRef = useRef()

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

  /* Fade out basado en la velocidad / posición de la cámara */
  useEffect(() => {
    const update = () => {
      if (!sectionRef.current) return
      const speed = Math.abs(scrollState.velocity)
      const offset = scrollState.offset

      // Fade out cuando hay velocidad o la cámara se aleja
      const fade = Math.max(0, 1 - offset * 15 - speed * 3)
      sectionRef.current.style.opacity = fade

      if (fade <= 0 && visible) {
        setVisible(false)
        sectionRef.current.style.pointerEvents = 'none'
      } else if (fade > 0 && !visible) {
        setVisible(true)
        sectionRef.current.style.pointerEvents = 'none'
      }

      rafRef.current = requestAnimationFrame(update)
    }
    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [visible])

  return (
    <div className="hero-section" id="hero" ref={sectionRef}>
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
        <span>Scroll para explorar</span>
        <div className="scroll-line" />
      </div>
    </div>
  )
}

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Contact() {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.contact-content > *', {
        scrollTrigger: { trigger: ref.current, start: 'top 70%', toggleActions: 'play none none reverse' },
        y: 40, opacity: 0, stagger: 0.12, duration: 0.8, ease: 'power3.out',
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const subject = encodeURIComponent(`Contacto Portafolio: ${data.get('name')}`)
    const body = encodeURIComponent(`Nombre: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`)
    window.open(`mailto:contacto@rolandomejia.dev?subject=${subject}&body=${body}`)
  }

  return (
    <section className="section contact-section" id="contact" ref={ref}>
      <span className="section-number">05</span>
      <div className="contact-content">
        <div className="hud-line" />
        <h2 className="hud-heading">Contacto</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
          ¿Tienes un proyecto en mente? Hablemos.
        </p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input className="contact-field" type="text" name="name" placeholder="Tu nombre" required />
          <input className="contact-field" type="email" name="email" placeholder="Tu email" required />
          <textarea className="contact-field" name="message" placeholder="Tu mensaje..." required />
          <button className="contact-btn" type="submit">Enviar Mensaje</button>
        </form>

        <div className="contact-links">
          <a className="contact-link" href="https://linkedin.com/in/rolandomejia" target="_blank" rel="noopener noreferrer">
            ⟐ LinkedIn
          </a>
          <a className="contact-link" href="https://github.com/rolandomejia" target="_blank" rel="noopener noreferrer">
            ⟐ GitHub
          </a>
          <a className="contact-link" href="mailto:contacto@rolandomejia.dev">
            ⟐ Email
          </a>
        </div>
      </div>
    </section>
  )
}

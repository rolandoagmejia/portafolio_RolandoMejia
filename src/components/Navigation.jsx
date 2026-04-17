import { useState, useEffect } from 'react'

const sections = [
  { id: 'hero', label: 'Inicio' },
  { id: 'about', label: 'Sobre Mí' },
  { id: 'skills', label: 'Skills' },
  { id: 'sectors', label: 'Industrias' },
  { id: 'projects', label: 'Proyectos' },
  { id: 'contact', label: 'Contacto' },
]

export default function Navigation() {
  const [active, setActive] = useState('hero')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { threshold: 0.35 }
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="nav-dots">
      {sections.map(({ id, label }) => (
        <button
          key={id}
          className={`nav-dot ${active === id ? 'active' : ''}`}
          data-label={label}
          onClick={() => scrollTo(id)}
          aria-label={`Ir a ${label}`}
        />
      ))}
    </nav>
  )
}

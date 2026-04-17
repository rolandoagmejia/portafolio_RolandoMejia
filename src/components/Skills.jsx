import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const skills = [
  { name: 'React', icon: '⚛️', level: 90 },
  { name: 'PHP', icon: '🐘', level: 85 },
  { name: 'Python', icon: '🐍', level: 80 },
  { name: 'MySQL', icon: '🗄️', level: 85 },
  { name: 'AWS', icon: '☁️', level: 75 },
  { name: 'Azure', icon: '🔷', level: 70 },
  { name: 'BluePrism', icon: '🤖', level: 85 },
  { name: 'PowerAutomate', icon: '⚡', level: 80 },
  { name: 'N8N', icon: '🔗', level: 75 },
  { name: 'Node.js', icon: '🟢', level: 80 },
  { name: 'Docker', icon: '🐳', level: 70 },
  { name: 'Git', icon: '📦', level: 90 },
]

export default function Skills() {
  const ref = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.skill-card', {
        scrollTrigger: { trigger: ref.current, start: 'top 70%', toggleActions: 'play none none reverse' },
        y: 50, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'power3.out',
      })
      // Animate skill bars
      gsap.to('.skill-bar-fill', {
        scrollTrigger: { trigger: ref.current, start: 'top 60%', toggleActions: 'play none none reverse' },
        width: (i) => `${skills[i]?.level || 0}%`,
        duration: 1.2,
        stagger: 0.06,
        ease: 'power2.out',
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section className="section skills-section" id="skills" ref={ref}>
      <span className="section-number">02</span>
      <div style={{ maxWidth: 900, width: '100%' }}>
        <div className="hud-line" />
        <h2 className="hud-heading">Stack Tecnológico</h2>
        <div className="skills-grid">
          {skills.map((s) => (
            <div className="glass-card skill-card" key={s.name}>
              <span className="skill-icon">{s.icon}</span>
              <span className="skill-name">{s.name}</span>
              <div className="skill-bar">
                <div className="skill-bar-fill" style={{ width: 0 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

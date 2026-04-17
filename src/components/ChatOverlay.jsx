import { useState, useEffect, useCallback, useRef } from 'react'

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    text: '¡Hola! Soy la IA de Rolando. Pregúntame sobre su experiencia, proyectos, stack tecnológico o cualquier cosa que quieras saber. 🚀',
  },
]

const QUICK_REPLIES = [
  '¿Cuál es tu stack principal?',
  '¿En qué industrias has trabajado?',
  '¿Tienes experiencia con RPA?',
  '¿Cómo te contacto?',
]

/* Respuestas locales simuladas — sin API por ahora */
function getLocalReply(input) {
  const lower = input.toLowerCase()
  if (lower.includes('stack') || lower.includes('tecnolog') || lower.includes('lenguaje'))
    return 'Mi stack principal incluye React, Node.js, Python, PHP y MySQL. En RPA trabajo con BluePrism, PowerAutomate y N8N. Para infraestructura uso AWS y Azure con Docker.'
  if (lower.includes('industria') || lower.includes('sector'))
    return 'He trabajado en Banca & Finanzas (automatización de procesos bancarios), Aviación (dashboards operativos), E-commerce (plataformas multi-canal) y Tracking/Logística (rastreo en tiempo real).'
  if (lower.includes('rpa') || lower.includes('automat'))
    return 'Tengo 5+ años en RPA. He implementado soluciones con BluePrism, PowerAutomate y N8N que han ahorrado +200 hrs/mes en procesos de banca, onboarding y compliance.'
  if (lower.includes('contact') || lower.includes('email') || lower.includes('linkedin'))
    return 'Puedes contactarme en: LinkedIn → linkedin.com/in/rolandomejia | GitHub → github.com/rolandomejia | Email → contacto@rolandomejia.dev'
  if (lower.includes('proyecto'))
    return 'Algunos proyectos destacados: Automatización de Onboarding Bancario (-70% tiempo), Dashboard Operativo de Vuelos (50+ vuelos/día), Plataforma E-commerce Multi-canal (+40% conversión).'
  if (lower.includes('experiencia') || lower.includes('año'))
    return '5+ años de experiencia como Full Stack Developer y especialista en RPA. He trabajado en 4 industrias con 20+ proyectos entregados.'
  if (lower.includes('hola') || lower.includes('hey') || lower.includes('buenos'))
    return '¡Hola! ¿En qué puedo ayudarte? Pregúntame sobre la experiencia de Rolando, sus proyectos o habilidades técnicas.'
  return 'Interesante pregunta. Pronto estaré conectado a una IA más avanzada para responderte mejor. Por ahora, pregúntame sobre stack tecnológico, industrias, proyectos o datos de contacto.'
}

export default function ChatOverlay() {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    const handler = () => {
      setOpen(true)
      requestAnimationFrame(() => setVisible(true))
    }
    window.addEventListener('open-chat', handler)
    return () => window.removeEventListener('open-chat', handler)
  }, [])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, typing])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(() => setOpen(false), 400)
  }, [])

  const sendMessage = useCallback((text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    // Simular delay de "pensando"
    setTimeout(() => {
      const reply = getLocalReply(text)
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
      setTyping(false)
    }, 800 + Math.random() * 600)
  }, [])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    sendMessage(input)
  }, [input, sendMessage])

  if (!open) return null

  return (
    <div className={`chat-overlay ${visible ? 'chat-overlay--visible' : ''}`} onClick={handleClose}>
      <div className="chat-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <span className="chat-header-icon">☀</span>
            <span className="chat-header-title">CHAT CON ROLANDO AI</span>
          </div>
          <div className="chat-header-right">
            <span className="chat-header-status">◉ SIMULADO</span>
            <button className="chat-close" onClick={handleClose}>✕</button>
          </div>
        </div>

        <div className="chat-line" />

        {/* Messages */}
        <div className="chat-messages" ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg chat-msg--${m.role}`}>
              <div className="chat-msg-bubble">{m.text}</div>
            </div>
          ))}
          {typing && (
            <div className="chat-msg chat-msg--assistant">
              <div className="chat-msg-bubble chat-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {/* Quick replies */}
        {messages.length <= 2 && (
          <div className="chat-quick">
            {QUICK_REPLIES.map((q, i) => (
              <button key={i} className="chat-quick-btn" onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input
            className="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            autoFocus
          />
          <button className="chat-send" type="submit" disabled={!input.trim()}>▸</button>
        </form>

        <div className="chat-footer">
          <span>PRONTO: CONECTADO A CHATGPT API</span>
        </div>
      </div>
    </div>
  )
}

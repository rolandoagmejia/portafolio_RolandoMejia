import { useEffect, useRef, useState } from 'react'
import { scrollState } from './Experience'

/*
  AmbientMusic — Música techno/electrónica generada con Web Audio API.
  Se activa al primer click/scroll del usuario.
  La intensidad y los filtros responden a la velocidad de scroll.
*/
export default function AmbientMusic() {
  const ctxRef = useRef(null)
  const nodesRef = useRef({})
  const startedRef = useRef(false)
  const [muted, setMuted] = useState(false)
  const rafRef = useRef()

  function initAudio() {
    if (startedRef.current) return
    startedRef.current = true

    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ctxRef.current = ctx

    // Master gain
    const master = ctx.createGain()
    master.gain.value = 0.18
    master.connect(ctx.destination)

    // Low-pass filter — se abre con velocidad
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400
    filter.Q.value = 8
    filter.connect(master)

    // ── Bass drone (sub) ──
    const bass = ctx.createOscillator()
    const bassGain = ctx.createGain()
    bass.type = 'sawtooth'
    bass.frequency.value = 55
    bassGain.gain.value = 0.25
    bass.connect(bassGain)
    bassGain.connect(filter)
    bass.start()

    // ── Pad (chord) ──
    const padNotes = [110, 146.83, 164.81] // Am chord
    const padOscs = padNotes.map((freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.value = 0.06
      osc.connect(gain)
      gain.connect(filter)
      osc.start()
      return { osc, gain }
    })

    // ── Hi-hat pattern (noise) ──
    const bufferSize = ctx.sampleRate * 0.05
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

    let hatInterval = null
    const startHat = () => {
      if (hatInterval) clearInterval(hatInterval)
      hatInterval = setInterval(() => {
        const src = ctx.createBufferSource()
        const hatGain = ctx.createGain()
        const hatFilter = ctx.createBiquadFilter()
        hatFilter.type = 'highpass'
        hatFilter.frequency.value = 8000
        src.buffer = noiseBuffer
        hatGain.gain.setValueAtTime(0.08, ctx.currentTime)
        hatGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
        src.connect(hatFilter)
        hatFilter.connect(hatGain)
        hatGain.connect(master)
        src.start()
      }, 125) // ~120 BPM 16th notes
    }
    startHat()

    // ── Kick drum ──
    let kickInterval = null
    const playKick = () => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.connect(gain)
      gain.connect(master)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    }
    kickInterval = setInterval(playKick, 500) // 120 BPM

    nodesRef.current = { ctx, master, filter, bass, bassGain, padOscs, hatInterval, kickInterval }

    // Reactivo a velocidad
    const tick = () => {
      if (!ctxRef.current) return
      const vel = scrollState.visualVelocity || 0
      const offset = scrollState.offset || 0

      // Filtro se abre con velocidad (400 → 6000 Hz)
      const targetFreq = 400 + vel * 5600
      filter.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1)

      // Volumen master sube con offset (silencio al inicio)
      const volFade = Math.min(1, offset * 8)
      master.gain.setTargetAtTime(0.18 * volFade, ctx.currentTime, 0.1)

      // Bass más fuerte a alta velocidad
      bassGain.gain.setTargetAtTime(0.15 + vel * 0.25, ctx.currentTime, 0.1)

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    // Iniciar al primer gesto del usuario
    const start = () => {
      initAudio()
      window.removeEventListener('click', start)
      window.removeEventListener('scroll', start)
      window.removeEventListener('wheel', start)
      window.removeEventListener('keydown', start)
      window.removeEventListener('touchstart', start)
    }
    window.addEventListener('click', start, { once: false })
    window.addEventListener('scroll', start, { once: false })
    window.addEventListener('wheel', start, { once: false })
    window.addEventListener('keydown', start, { once: false })
    window.addEventListener('touchstart', start, { once: false })

    return () => {
      window.removeEventListener('click', start)
      window.removeEventListener('scroll', start)
      window.removeEventListener('wheel', start)
      window.removeEventListener('keydown', start)
      window.removeEventListener('touchstart', start)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (nodesRef.current.hatInterval) clearInterval(nodesRef.current.hatInterval)
      if (nodesRef.current.kickInterval) clearInterval(nodesRef.current.kickInterval)
      if (ctxRef.current) ctxRef.current.close()
    }
  }, [])

  const toggleMute = () => {
    if (!nodesRef.current.master) return
    const next = !muted
    setMuted(next)
    nodesRef.current.master.gain.setTargetAtTime(
      next ? 0 : 0.18,
      ctxRef.current.currentTime,
      0.05,
    )
  }

  return (
    <button
      className="music-toggle"
      onClick={toggleMute}
      title={muted ? 'Activar música' : 'Silenciar música'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}

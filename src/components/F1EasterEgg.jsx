import { useState, useEffect, useCallback } from 'react'
import gsap from 'gsap'

/*
  F1EasterEgg — Un carro F1 cruza la pantalla aleatoriamente.
  Se activa después de 30 segundos y luego cada ~60 segundos.
  También se puede triggear con Konami code (↑↑↓↓←→←→).
*/
export default function F1EasterEgg() {
  const [triggered, setTriggered] = useState(false)

  const launchCar = useCallback(() => {
    if (triggered) return
    setTriggered(true)

    const car = document.createElement('div')
    car.className = 'f1-car'
    car.innerHTML = '🏎️'
    car.style.left = '-150px'
    car.style.opacity = '1'
    document.body.appendChild(car)

    gsap.to(car, {
      x: window.innerWidth + 300,
      duration: 2.5,
      ease: 'power2.in',
      onComplete: () => {
        car.remove()
        setTimeout(() => setTriggered(false), 60000)
      },
    })
  }, [triggered])

  useEffect(() => {
    // Timer aleatorio
    const timer = setTimeout(launchCar, 30000 + Math.random() * 30000)

    // Konami code detector
    const code = [38, 38, 40, 40, 37, 39, 37, 39]
    let pos = 0
    const handleKey = (e) => {
      if (e.keyCode === code[pos]) {
        pos++
        if (pos === code.length) {
          launchCar()
          pos = 0
        }
      } else {
        pos = 0
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKey)
    }
  }, [launchCar])

  return null
}

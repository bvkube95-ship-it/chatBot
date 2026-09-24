import { useMemo } from 'react'
import type { Firefly } from '../utils/types'
import './styles/Fireflies.css'

const FIREFLY_COUNT = 25

function Fireflies() {
  const fireflies = useMemo<Firefly[]>(() => {
    return Array.from({ length: FIREFLY_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 10,
      drift: -30 + Math.random() * 60,
    }))
  }, [])

  return (
    <div className="fireflies-container">
      {fireflies.map((f) => (
        <span
          key={f.id}
          className="firefly"
          style={{
            left: `${f.left}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            // @ts-expect-error — a custom CSS property for use in keyframes
            '--drift': `${f.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

export default Fireflies
import { useState, useEffect } from 'react'

export function useClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime([now.getHours(), now.getMinutes(), now.getSeconds()]
        .map(n => n.toString().padStart(2, '0')).join(':'))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

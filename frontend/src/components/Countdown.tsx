import { useEffect, useState } from 'react'

export default function Countdown({ endDate, onEnd }: { endDate: string; onEnd?: () => void }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    const end = new Date(endDate).getTime()
    const tick = () => {
      const now = Date.now()
      const diff = end - now
      if (diff <= 0) {
        setEnded(true)
        onEnd?.()
        return
      }
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [endDate, onEnd])

  if (ended) return <span className="text-red-400 font-bold">Ended</span>

  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <span className="font-mono font-bold text-brand-400 tabular-nums">
      {time.d > 0 && <>{time.d}d </>}
      {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
    </span>
  )
}

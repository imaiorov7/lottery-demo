import { useCallback, useEffect, useRef, useState } from 'react'

interface MiniGameProps {
  gameType: string
  duration: number
  maxScore: number
  minScore: number
  onComplete: (score: number) => void
  onCancel: () => void
}

export default function MiniGame({ gameType, duration, maxScore, minScore, onComplete, onCancel }: MiniGameProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [targets, setTargets] = useState<Array<{id: number, x: number, y: number, active: boolean}>>([])
  const intervalRef = useRef<number | null>(null)
  const targetIdRef = useRef(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  const startGame = () => {
    setPhase('playing')
    setScore(0)
    setTimeLeft(duration)
  }

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing') return
    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPhase('done')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [phase])

  // Spawn targets
  useEffect(() => {
    if (phase !== 'playing') return
    const spawn = () => {
      targetIdRef.current++
      const newTarget = {
        id: targetIdRef.current,
        x: Math.random() * 80 + 5,
        y: Math.random() * 70 + 5,
        active: true,
      }
      setTargets(prev => [...prev.filter(t => t.active).slice(-5), newTarget])

      // Auto-remove after 1.5s
      setTimeout(() => {
        setTargets(prev => prev.map(t => t.id === newTarget.id ? {...t, active: false} : t))
      }, 1500)
    }
    spawn()
    const spawnInterval = window.setInterval(spawn, 800)
    return () => clearInterval(spawnInterval)
  }, [phase])

  const hitTarget = useCallback((id: number) => {
    setTargets(prev => prev.map(t => t.id === id ? {...t, active: false} : t))
    setScore(prev => {
      const pointsPerTarget = Math.max(1, Math.ceil(maxScore / 10))
      const points = Math.min(prev + pointsPerTarget, maxScore)
      return points
    })
  }, [maxScore])

  const qualified = score >= minScore
  const progressPercent = Math.min((score / maxScore) * 100, 100)
  const thresholdPercent = (minScore / maxScore) * 100

  if (phase === 'ready') {
    return (
      <div className="bg-gray-900 rounded-xl p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Tap Attack!</h2>
        <p className="text-gray-400">Tap the targets as fast as you can to earn points!</p>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Duration: <span className="text-white font-medium">{duration}s</span></p>
          <p>Score needed: <span className="text-green-400 font-medium">{minScore}</span> / {maxScore}</p>
        </div>
        <div className="flex gap-3 justify-center pt-4">
          <button onClick={startGame} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors">
            Start Game
          </button>
          <button onClick={onCancel} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="bg-gray-900 rounded-xl p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Game Over!</h2>
        <div className={`text-5xl font-bold ${qualified ? 'text-green-400' : 'text-red-400'}`}>{score}</div>
        <p className="text-gray-400">
          {qualified
            ? `You qualified! Score ${score} >= ${minScore}`
            : `Not enough! Score ${score} < ${minScore} needed`}
        </p>
        {qualified && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-400">
            You earned a lottery entry!
          </div>
        )}
        <button onClick={() => onComplete(score)}
          className={`px-8 py-3 rounded-lg font-bold text-lg transition-colors ${qualified ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>
          {qualified ? 'Claim Entry' : 'Try Again Later'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="text-white font-bold text-lg">Score: {score}</div>
        <div className={`font-mono font-bold text-lg ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          {timeLeft}s
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
        <div className="absolute h-full bg-blue-500 transition-all duration-300" style={{width: `${progressPercent}%`}} />
        <div className="absolute h-full w-0.5 bg-green-400" style={{left: `${thresholdPercent}%`}} />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>0</span>
        <span className="text-green-400">Min: {minScore}</span>
        <span>{maxScore}</span>
      </div>

      {/* Game area */}
      <div ref={gameAreaRef} className="relative bg-gray-800 rounded-lg h-64 overflow-hidden cursor-crosshair select-none">
        {targets.filter(t => t.active).map(t => (
          <button key={t.id} onClick={() => hitTarget(t.id)}
            className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-red-500 shadow-lg shadow-yellow-500/30 animate-bounce hover:scale-110 transition-transform flex items-center justify-center text-white font-bold text-lg"
            style={{left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)'}}>
            +{Math.max(1, Math.ceil(maxScore / 10))}
          </button>
        ))}
        {targets.filter(t => t.active).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
            Wait for targets...
          </div>
        )}
      </div>
    </div>
  )
}

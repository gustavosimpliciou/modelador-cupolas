import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setTimeout(onDone, 400)
          return 100
        }
        return p + 2
      })
    }, 25)
    return () => clearInterval(interval)
  }, [onDone])

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        animation: 'fadeIn 0.5s ease both',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 8,
          background: 'linear-gradient(135deg, #FF6A00, #ff9944)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 800, color: '#000',
          fontFamily: 'var(--font-condensed)',
          boxShadow: '0 0 30px rgba(255,106,0,0.3)',
          animation: 'splashGlow 2s ease infinite',
        }}>
          L
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-condensed)', fontSize: 24, fontWeight: 800,
            letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text)',
          }}>
            Lampshade Studio
          </div>
          <div style={{
            fontFamily: 'var(--font-condensed)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)',
          }}>
            Pro · 3D Mesh Designer
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: 240, height: 2,
        background: 'var(--line)', borderRadius: 1, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'var(--accent)',
          borderRadius: 1,
          transition: 'width 0.05s linear',
          boxShadow: '0 0 8px var(--accent-glow)',
        }} />
      </div>

      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--text-dim)', letterSpacing: '0.1em',
      }}>
        {progress < 100 ? 'CARREGANDO MOTOR 3D...' : 'PRONTO'}
      </span>
    </div>
  )
}

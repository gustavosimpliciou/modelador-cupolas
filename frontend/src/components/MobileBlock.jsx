import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { useT } from '../i18n/useT'
import { LANGUAGES } from '../i18n/translations'

// Threshold below which we consider the device "mobile" and block the app.
const MIN_WIDTH = 900

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < MIN_WIDTH
  })
  useEffect(() => {
    const on = () => setIsMobile(window.innerWidth < MIN_WIDTH)
    window.addEventListener('resize', on)
    window.addEventListener('orientationchange', on)
    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('orientationchange', on)
    }
  }, [])
  return isMobile
}

export default function MobileBlock() {
  const t = useT()
  const language = useStore((s) => s.language)
  const setLanguage = useStore((s) => s.setLanguage)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center', gap: 24,
      zIndex: 9999,
    }}>
      {/* Language selector (small, above everything) */}
      <div style={{
        display: 'flex', gap: 2,
        padding: 2,
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 4,
      }}>
        {LANGUAGES.map((lng) => {
          const active = language === lng.code
          return (
            <button
              key={lng.code}
              data-testid={`mobile-lang-${lng.code}`}
              onClick={() => setLanguage(lng.code)}
              style={{
                padding: '5px 12px',
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#000' : 'var(--text-secondary)',
                border: 'none', borderRadius: 3,
                fontFamily: 'var(--font-condensed)', fontSize: 12,
                fontWeight: 800, letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >{lng.name}</button>
          )
        })}
      </div>

      {/* Logo glow */}
      <img
        src="/logo.png"
        alt="Nativos Studio Pro"
        style={{
          width: 72, height: 72,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 24px rgba(255,106,0,0.65))',
          animation: 'splashGlow 2s ease infinite',
        }}
      />

      {/* Static (locked) progress bar to reinforce "loading blocked" feeling */}
      <div style={{
        width: 200, height: 2,
        background: 'var(--line)', borderRadius: 1, overflow: 'hidden',
      }}>
        <div style={{
          width: '30%', height: '100%',
          background: 'var(--accent)',
          boxShadow: '0 0 8px var(--accent-glow)',
        }} />
      </div>

      <div>
        <div style={{
          fontFamily: 'var(--font-condensed)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: 12,
        }}>
          {t('mobile.title')}
        </div>
        <div style={{
          fontFamily: 'var(--font-condensed)', fontSize: 22, fontWeight: 800,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--text)',
          lineHeight: 1.25,
          maxWidth: 320,
        }}>
          {t('mobile.message')}
        </div>
      </div>

      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 13,
        color: 'var(--text-secondary)',
        maxWidth: 360, lineHeight: 1.5,
      }}>
        {t('mobile.sub')}
      </p>
    </div>
  )
}

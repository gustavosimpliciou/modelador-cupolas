import { Suspense, useState } from 'react'
import Navbar from './components/Navbar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import Viewport from './components/Viewport'
import Footer from './components/Footer'
import SplashScreen from './components/SplashScreen'
import MobileBlock, { useIsMobile } from './components/MobileBlock'
import { useT } from './i18n/useT'

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const isMobile = useIsMobile()

  // Mobile devices get a locked screen — the app is not compatible.
  // Runs BEFORE splash so users never see the "loading" pass through.
  if (isMobile) {
    return <MobileBlock />
  }

  if (!loaded) {
    return <SplashScreen onDone={() => setLoaded(true)} />
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left panel — 220px */}
        <div style={{ width: 220, flexShrink: 0, overflow: 'hidden' }}>
          <LeftPanel />
        </div>

        {/* Viewport — fluid */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <Suspense fallback={<ViewportFallback />}>
            <Viewport />
          </Suspense>
        </div>

        {/* Right panel — 280px */}
        <div style={{ width: 280, flexShrink: 0, overflow: 'hidden' }}>
          <RightPanel />
        </div>
      </div>

      <Footer />
    </div>
  )
}

function ViewportFallback() {
  const t = useT()
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        width: 32, height: 32,
        border: '2px solid var(--line)', borderTopColor: 'var(--accent)',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{
        fontFamily: 'var(--font-condensed)', fontSize: 11,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--text-secondary)',
      }}>
        {t('splash.initEngine')}
      </span>
    </div>
  )
}

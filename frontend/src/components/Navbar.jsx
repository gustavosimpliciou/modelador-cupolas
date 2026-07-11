import { useStore } from '../store/useStore'
import { useT } from '../i18n/useT'
import { LANGUAGES } from '../i18n/translations'

export default function Navbar() {
  const openMenu = useStore((s) => s.openMenu)
  const setOpenMenu = useStore((s) => s.setOpenMenu)
  const setViewMode = useStore((s) => s.setViewMode)
  const setShowGrid = useStore((s) => s.setShowGrid)
  const showGrid = useStore((s) => s.showGrid)
  const autoRotate = useStore((s) => s.autoRotate)
  const setAutoRotate = useStore((s) => s.setAutoRotate)
  const language = useStore((s) => s.language)
  const setLanguage = useStore((s) => s.setLanguage)
  const t = useT()

  const MENUS = {
    file: {
      label: t('nav.file'),
      items: [
        { id: 'new', label: t('nav.file.new') },
        { id: 'open', label: t('nav.file.open') },
        { id: 'save', label: t('nav.file.save') },
        { id: 'saveAs', label: t('nav.file.saveAs') },
        { id: 'export', label: t('nav.file.export') },
        { id: 'exit', label: t('nav.file.exit') },
      ],
    },
    help: {
      label: t('nav.help'),
      items: [
        { id: 'docs', label: t('nav.help.docs') },
        { id: 'shortcuts', label: t('nav.help.shortcuts') },
        { id: 'about', label: t('nav.help.about') },
        { id: 'bug', label: t('nav.help.bug') },
      ],
    },
  }

  const handleAction = (action) => {
    setOpenMenu(null)
    const viewMap = { solid: 'solid', wireframe: 'wireframe', render: 'render', technical: 'technical' }
    if (viewMap[action]) setViewMode(viewMap[action])
    if (action === 'grid') setShowGrid(!showGrid)
    if (action === 'autoRotate') setAutoRotate(!autoRotate)
  }

  return (
    <nav style={{
      height: 38, flexShrink: 0,
      display: 'flex', alignItems: 'center',
      background: 'var(--panel)',
      borderBottom: '1px solid var(--line)',
      padding: '0 10px',
      gap: 2,
      position: 'relative',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
        <img
          src="/logo.png"
          alt="Nativos Studio Pro"
          loading="eager"
          decoding="sync"
          fetchpriority="high"
          style={{
            width: 24, height: 24,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 6px rgba(255,106,0,0.6))',
          }}
        />
        <span style={{
          fontFamily: 'var(--font-condensed)', fontSize: 13, fontWeight: 800,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text)',
        }}>
          Nativos Studio
        </span>
        <span style={{
          fontFamily: 'var(--font-condensed)', fontSize: 9, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--accent)', marginLeft: -4,
        }}>
          Pro
        </span>
      </div>

      {/* Menus */}
      {Object.entries(MENUS).map(([key, menu]) => (
        <div key={key} style={{ position: 'relative' }}>
          <button
            data-testid={`nav-menu-${key}`}
            onClick={() => setOpenMenu(openMenu === key ? null : key)}
            style={{
              padding: '5px 10px',
              background: openMenu === key ? 'rgba(255,255,255,0.05)' : 'none',
              border: 'none', borderRadius: 2,
              fontFamily: 'var(--font-body)', fontSize: 12,
              color: openMenu === key ? 'var(--text)' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'color 0.15s',
            }}
          >
            {menu.label}
          </button>

          {openMenu === key && (
            <>
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                onClick={() => setOpenMenu(null)} />
              <div style={{
                position: 'absolute', top: '100%', left: 0,
                minWidth: 180, marginTop: 4,
                background: 'var(--panel)',
                border: '1px solid var(--line)', borderRadius: 3,
                padding: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                zIndex: 100,
                animation: 'fadeIn 0.12s ease both',
              }}>
                {menu.items.map((item) => (
                  <button
                    key={item.id}
                    data-testid={`nav-item-${item.id}`}
                    onClick={() => handleAction(item.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      width: '100%', padding: '6px 10px',
                      background: 'none', border: 'none', borderRadius: 2,
                      fontFamily: 'var(--font-body)', fontSize: 12,
                      color: 'var(--text)', cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,106,0,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      {/* Language selector */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        padding: '2px', marginRight: 10,
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 3,
      }}>
        {LANGUAGES.map((lng) => {
          const active = language === lng.code
          return (
            <button
              key={lng.code}
              data-testid={`lang-btn-${lng.code}`}
              onClick={() => setLanguage(lng.code)}
              title={lng.full}
              style={{
                padding: '3px 8px',
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#000' : 'var(--text-secondary)',
                border: 'none', borderRadius: 2,
                fontFamily: 'var(--font-condensed)', fontSize: 10.5,
                fontWeight: 800, letterSpacing: '0.08em',
                cursor: 'pointer', transition: 'all 0.12s',
              }}
            >
              {lng.name}
            </button>
          )
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-dim)',
        }}>
          v0.2.0
        </span>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--success)',
          boxShadow: '0 0 6px var(--success)',
        }} />
      </div>
    </nav>
  )
}

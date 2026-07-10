import { useStore } from '../store/useStore'

const MENUS = {
  'Arquivo': ['Novo Projeto', 'Abrir...', 'Salvar Projeto', 'Salvar Como...', 'Exportar...', 'Sair'],
  'Editar': ['Desfazer', 'Refazer', 'Duplicar', 'Resetar Geometria', 'Preferências...'],
  'Vista': ['Sólido', 'Wireframe', 'Render', 'Técnico', 'Mostrar Grid', 'Auto-Rotação'],
  'Malhas': ['Biblioteca', 'Editor Paramétrico', 'Importar Malha...', 'Criar Malha...'],
  'Análise': ['Métricas', 'Análise de Luz', 'Compatibilidade', 'Relatório PDF'],
  'Ajuda': ['Documentação', 'Atalhos', 'Sobre', 'Reportar Bug'],
}

export default function Navbar() {
  const openMenu = useStore((s) => s.openMenu)
  const setOpenMenu = useStore((s) => s.setOpenMenu)
  const setViewMode = useStore((s) => s.setViewMode)
  const setShowGrid = useStore((s) => s.setShowGrid)
  const showGrid = useStore((s) => s.showGrid)
  const autoRotate = useStore((s) => s.autoRotate)
  const setAutoRotate = useStore((s) => s.setAutoRotate)

  const handleAction = (action) => {
    setOpenMenu(null)
    const viewMap = { 'Sólido': 'solid', 'Wireframe': 'wireframe', 'Render': 'render', 'Técnico': 'technical' }
    if (viewMap[action]) setViewMode(viewMap[action])
    if (action === 'Mostrar Grid') setShowGrid(!showGrid)
    if (action === 'Auto-Rotação') setAutoRotate(!autoRotate)
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
        <div style={{
          width: 22, height: 22, borderRadius: 4,
          background: 'linear-gradient(135deg, #FF6A00, #ff9944)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: '#000',
          fontFamily: 'var(--font-condensed)',
        }}>
          L
        </div>
        <span style={{
          fontFamily: 'var(--font-condensed)', fontSize: 13, fontWeight: 800,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text)',
        }}>
          Lampshade Studio
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
      {Object.entries(MENUS).map(([name, items]) => (
        <div key={name} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpenMenu(openMenu === name ? null : name)}
            style={{
              padding: '5px 10px',
              background: openMenu === name ? 'rgba(255,255,255,0.05)' : 'none',
              border: 'none', borderRadius: 2,
              fontFamily: 'var(--font-body)', fontSize: 12,
              color: openMenu === name ? 'var(--text)' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'color 0.15s',
            }}
          >
            {name}
          </button>

          {openMenu === name && (
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
                {items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleAction(item)}
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
                    <span>{item}</span>
                    {item === 'Mostrar Grid' && showGrid && <span style={{ color: 'var(--accent)' }}>✓</span>}
                    {item === 'Auto-Rotação' && autoRotate && <span style={{ color: 'var(--accent)' }}>✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ))}

      <div style={{ flex: 1 }} />

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

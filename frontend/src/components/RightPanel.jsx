import { useState } from 'react'
import { useStore } from '../store/useStore'
import MeshLibrary from './MeshLibrary'
import TextureLibrary from './TextureLibrary'
import { exportGeometry } from '../lib/exporters'
import { useT } from '../i18n/useT'

const MESH_PARAMS_CONFIG = [
  { key: 'lineThickness', label: 'Espessura', min: 0.2, max: 3.0, step: 0.05, unit: 'mm' },
  { key: 'openingWidth', label: 'Abertura', min: 0.5, max: 20, step: 0.5, unit: 'mm' },
  { key: 'depth', label: 'Profundidade', min: 0, max: 5, step: 0.1, unit: 'mm' },
  { key: 'density', label: 'Densidade', min: 0.2, max: 4, step: 0.05, unit: 'x' },
  { key: 'rotation', label: 'Rotação', min: 0, max: 360, step: 1, unit: '°' },
  { key: 'tilt', label: 'Inclinação', min: -45, max: 45, step: 1, unit: '°' },
  { key: 'amplitude', label: 'Amplitude', min: 0, max: 3, step: 0.05, unit: 'x' },
  { key: 'frequency', label: 'Frequência', min: 0.5, max: 10, step: 0.1, unit: 'x' },
  { key: 'scale', label: 'Escala', min: 0.1, max: 3, step: 0.05, unit: 'x' },
  { key: 'noise', label: 'Ruído', min: 0, max: 1, step: 0.01, unit: '' },
  { key: 'randomization', label: 'Randomização', min: 0, max: 1, step: 0.01, unit: '' },
  { key: 'symmetry', label: 'Simetria', min: 1, max: 16, step: 1, unit: '' },
  { key: 'gradient', label: 'Gradiente', min: 0, max: 1, step: 0.01, unit: '' },
  { key: 'curvature', label: 'Curvatura', min: -1, max: 1, step: 0.01, unit: '' },
]

const EXPORT_FORMATS = [
  { ext: 'STL', desc: 'Fatiamento padrão', compat: 'Universal' },
  { ext: '3MF', desc: 'Bambu / Prusa / Orca', compat: 'Recomendado' },
  { ext: 'OBJ', desc: 'Modelagem 3D', compat: 'Universal' },
  { ext: 'STEP', desc: 'CAD industrial', compat: 'CAD' },
  { ext: 'GLB', desc: 'WebGL / Blender', compat: 'Web' },
  { ext: 'USDZ', desc: 'AR / Apple', compat: 'AR' },
]

const COLOR_PALETTE = [
  { id: 'white', name: 'Branco', color: '#f0ece4' },
  { id: 'cream', name: 'Creme', color: '#e8e0d8' },
  { id: 'sand', name: 'Areia', color: '#d8ccb0' },
  { id: 'terracotta', name: 'Terracota', color: '#c47a5a' },
  { id: 'salmon', name: 'Salmão', color: '#e89078' },
  { id: 'yellow', name: 'Amarelo', color: '#e8c860' },
  { id: 'olive', name: 'Oliva', color: '#8a8a4a' },
  { id: 'sage', name: 'Sage', color: '#a0b090' },
  { id: 'mint', name: 'Menta', color: '#d0e8d8' },
  { id: 'teal', name: 'Azul-Petróleo', color: '#3a7080' },
  { id: 'navy', name: 'Marinho', color: '#2a3a5a' },
  { id: 'lavender', name: 'Lavanda', color: '#d0c8e0' },
  { id: 'burgundy', name: 'Vinho', color: '#7a2a3a' },
  { id: 'coral', name: 'Coral', color: '#e87868' },
  { id: 'graphite', name: 'Grafite', color: '#3a3a3a' },
  { id: 'black', name: 'Preto', color: '#0f0f0f' },
]

export default function RightPanel() {
  const rightPanel = useStore((s) => s.rightPanel)
  const setRightPanel = useStore((s) => s.setRightPanel)
  const t = useT()
  const TABS = [
    { key: 'meshes', label: t('tab.meshes') },
    { key: 'textures', label: t('tab.textures') },
    { key: 'materials', label: t('tab.materials') },
    { key: 'export', label: t('tab.export') },
    { key: 'analysis', label: t('tab.analysis') },
    { key: 'ai', label: t('tab.ai') },
  ]

  // If user was on the removed Modifiers tab, redirect to meshes
  if (rightPanel === 'modifiers') {
    setRightPanel('meshes')
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'var(--panel)', borderLeft: '1px solid var(--line)',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            data-testid={`right-tab-${tab.label}`}
            onClick={() => setRightPanel(tab.key)}
            style={{
              flex: 1, minWidth: 0,
              padding: '9px 4px',
              fontFamily: 'var(--font-condensed)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: rightPanel === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: rightPanel === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.2s',
              background: 'none', cursor: 'pointer', border: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {rightPanel === 'meshes' && <MeshesPanel />}
        {rightPanel === 'textures' && <TextureLibrary />}
        {rightPanel === 'materials' && <MaterialsPanel />}
        {rightPanel === 'export' && <ExportPanel />}
        {rightPanel === 'analysis' && <AnalysisPanel />}
        {rightPanel === 'ai' && <AIPanel />}
      </div>
    </div>
  )
}

// ─── Meshes Panel ──────────────────────────────────────────────────

function MeshesPanel() {
  const activeMesh = useStore((s) => s.activeMesh)
  const meshParams = useStore((s) => s.meshParams)
  const setMeshParams = useStore((s) => s.setMeshParams)
  const resetMeshParams = useStore((s) => s.resetMeshParams)
  const [view, setView] = useState('library')
  const t = useT()

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
        {['library', 'editor'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: 1, padding: '7px',
              fontFamily: 'var(--font-condensed)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: view === v ? 'var(--text)' : 'var(--text-secondary)',
              background: view === v ? 'rgba(255,255,255,0.04)' : 'none',
              borderBottom: view === v ? '1px solid var(--line)' : '1px solid transparent',
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
            }}
          >
            {v === 'library' ? t('lib.library') : t('lib.editor')}
          </button>
        ))}
      </div>

      {view === 'library' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <MeshLibrary />
        </div>
      )}

      {view === 'editor' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }} className="fade-in">
          {!activeMesh && (
            <div style={{
              padding: '24px 12px', textAlign: 'center',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-condensed)', fontSize: 12,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Selecione uma malha na biblioteca
            </div>
          )}
          {activeMesh && (
            <>
              <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-condensed)', fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                    {activeMesh.name}
                  </span>
                </div>
                <p style={{ marginTop: 6, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
                  {activeMesh.description}
                </p>
              </div>

              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MESH_PARAMS_CONFIG.map((p) => (
                  <div key={p.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span className="label-upper">{p.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
                        {meshParams[p.key]?.toFixed(2)}{p.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={p.min} max={p.max} step={p.step}
                      value={meshParams[p.key] ?? 0}
                      onChange={(e) => setMeshParams({ [p.key]: parseFloat(e.target.value) })}
                    />
                  </div>
                ))}

                <button
                  onClick={resetMeshParams}
                  style={{
                    marginTop: 4, padding: '8px',
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: 2,
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-condensed)', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  Resetar Parâmetros
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Cores Panel ──────────────────────────────────────────────────

function MaterialsPanel() {
  const material = useStore((s) => s.material)
  const setMaterial = useStore((s) => s.setMaterial)

  const applyColor = (c) => {
    setMaterial({
      id: c.id,
      name: c.name,
      color: c.color,
      roughness: material?.roughness ?? 0.4,
      metalness: material?.metalness ?? 0,
    })
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }} className="fade-in">
      <h3 className="label-upper" style={{ marginBottom: 12 }}>Paleta de Cores</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {COLOR_PALETTE.map((c) => {
          const active = material?.color?.toLowerCase() === c.color.toLowerCase()
          return (
            <button
              key={c.id}
              data-testid={`color-${c.id}`}
              onClick={() => applyColor(c)}
              title={c.name}
              style={{
                aspectRatio: '1 / 1',
                background: c.color,
                border: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                borderRadius: 3,
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                boxShadow: active
                  ? '0 0 0 1px rgba(0,0,0,0.35), 0 0 12px rgba(255,106,0,0.4)'
                  : '0 0 0 1px rgba(0,0,0,0.35)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {active && (
                <span style={{
                  position: 'absolute', bottom: 4, right: 4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 4px var(--accent)',
                }} />
              )}
            </button>
          )
        })}
      </div>

      <div style={{
        marginTop: 12,
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: material ? 'var(--text)' : 'var(--text-secondary)',
        textAlign: 'center',
      }}>
        {material?.name || 'Selecione uma cor'}
        <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: 10 }}>
          {material?.color?.toUpperCase()}
        </span>
      </div>

      {/* Custom color */}
      <h3 className="label-upper" style={{ marginTop: 20, marginBottom: 8 }}>Cor Personalizada</h3>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="color"
          data-testid="custom-color-picker"
          value={material?.color || '#e8e0d8'}
          onChange={(e) => setMaterial({ ...material, id: 'custom', name: 'Personalizada', color: e.target.value })}
          style={{ width: 44, height: 34, border: '1px solid var(--line)', borderRadius: 2, cursor: 'pointer', background: 'none' }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)' }}>
          {material?.color?.toUpperCase() || '#E8E0D8'}
        </span>
      </div>
    </div>
  )
}

// ─── Export Panel ──────────────────────────────────────────────────

function ExportPanel() {
  const exportFormat = useStore((s) => s.exportFormat)
  const setExportFormat = useStore((s) => s.setExportFormat)
  const exportQuality = useStore((s) => s.exportQuality)
  const setExportQuality = useStore((s) => s.setExportQuality)
  const lampshade = useStore((s) => s.lampshade)
  const activeMesh = useStore((s) => s.activeMesh)
  const activeTexture = useStore((s) => s.activeTexture)
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [exportErr, setExportErr] = useState('')
  const t = useT()

  const handleExport = async () => {
    setExporting(true)
    setExportDone(false)
    setExportErr('')
    // Snapshot the state so exporter runs synchronously off latest values.
    const state = useStore.getState()
    try {
      // Yield to browser so button paints "Exportando..." before heavy CPU
      await new Promise((r) => setTimeout(r, 40))
      await exportGeometry(exportFormat, {
        lampshade: state.lampshade,
        meshParams: state.meshParams,
        activeMesh: state.activeMesh,
        activeTexture: state.activeTexture,
        textureParams: state.textureParams,
        exportQuality: state.exportQuality,
        bottomCap: state.bottomCap,
      })
      setExporting(false)
      setExportDone(true)
      setTimeout(() => setExportDone(false), 3000)
    } catch (e) {
      setExporting(false)
      setExportErr(e?.message || t('export.error'))
      setTimeout(() => setExportErr(''), 4000)
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="fade-in">
      <h3 className="label-upper" style={{ marginBottom: 10 }}>{t('export.format')}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {EXPORT_FORMATS.map((f) => (
          <button
            key={f.ext}
            onClick={() => setExportFormat(f.ext)}
            style={{
              padding: '10px 12px',
              background: exportFormat === f.ext ? 'var(--accent-dim)' : 'var(--card)',
              border: `1px solid ${exportFormat === f.ext ? 'var(--accent)' : 'var(--line)'}`,
              borderRadius: 2,
              cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: 'var(--font-condensed)', fontSize: 14, fontWeight: 800,
                letterSpacing: '0.06em',
                color: exportFormat === f.ext ? 'var(--accent)' : 'var(--text)',
              }}>
                {f.ext}
              </span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                  {f.desc}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {f.compat}
                </div>
              </div>
            </div>
            {exportFormat === f.ext && (
              <span style={{ color: 'var(--accent)', fontSize: 14 }}>✓</span>
            )}
          </button>
        ))}
      </div>

      <h3 className="label-upper" style={{ marginTop: 16, marginBottom: 8 }}>{t('export.quality')}</h3>
      <div style={{ display: 'flex', gap: 4 }}>
        {['draft', 'standard', 'high', 'ultra'].map((q) => (
          <button
            key={q}
            onClick={() => setExportQuality(q)}
            style={{
              flex: 1, padding: '6px',
              background: exportQuality === q ? 'var(--accent-dim)' : 'var(--card)',
              border: `1px solid ${exportQuality === q ? 'var(--accent)' : 'var(--line)'}`,
              borderRadius: 2,
              fontFamily: 'var(--font-condensed)', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: exportQuality === q ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {t(`export.q.${q}`)}
          </button>
        ))}
      </div>

      {/* Export summary */}
      <div style={{
        marginTop: 16, padding: '12px',
        background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 3,
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
          {t('export.summary')}
        </div>
        <Row label={t('export.summary.format')} value={exportFormat} />
        <Row label={t('export.summary.quality')} value={t(`export.q.${exportQuality}`)} />
        <Row label={t('export.summary.profile')} value={lampshade.profile} />
        <Row label={t('export.summary.mesh')} value={activeMesh?.name || t('export.none')} />
        <Row label={t('export.summary.texture')} value={activeTexture?.name || t('export.none')} />
        <Row label={t('export.summary.segments')} value={lampshade.segments} />
        <Row label={t('export.summary.unit')} value="mm" />
      </div>

      {exportErr && (
        <div style={{
          marginTop: 10, padding: '8px 10px',
          background: 'rgba(214,48,49,0.12)',
          border: '1px solid #d63031',
          borderRadius: 3,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: '#ff8888',
        }}>
          {exportErr}
        </div>
      )}

      {/* Export button */}
      <button
        data-testid="export-btn"
        onClick={handleExport}
        disabled={exporting}
        style={{
          width: '100%', marginTop: 14,
          padding: '12px',
          background: exporting ? 'var(--card)' : 'var(--accent)',
          border: 'none', borderRadius: 3,
          color: exporting ? 'var(--text-secondary)' : '#000',
          fontFamily: 'var(--font-condensed)', fontSize: 13, fontWeight: 800,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          cursor: exporting ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {exporting ? (
          <>
            <span style={{ width: 14, height: 14, border: '2px solid var(--text-secondary)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            {t('export.downloading')}
          </>
        ) : exportDone ? (
          `✓ ${t('export.done')}`
        ) : (
          `${t('export.download')} ${exportFormat}`
        )}
      </button>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  )
}

// ─── Analysis Panel ────────────────────────────────────────────────

function AnalysisPanel() {
  const stats = useStore((s) => s.stats)
  const lampshade = useStore((s) => s.lampshade)
  const activeMesh = useStore((s) => s.activeMesh)

  const lightArea = Math.PI * (lampshade.bottomDiameter / 2) ** 2 * 0.0001
  const transparencyRatio = activeMesh ? activeMesh.lightTransp : 100
  const lightOutput = (lightArea * transparencyRatio / 100).toFixed(1)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="fade-in">
      <h3 className="label-upper" style={{ marginBottom: 10 }}>Métricas de Impressão</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <MetricCard label="Polígonos" value={stats.polygons} />
        <MetricCard label="Faces" value={stats.faces} />
        <MetricCard label="Volume" value={stats.volume} />
        <MetricCard label="Peso" value={stats.weight} />
        <MetricCard label="Tempo" value={stats.printTime} />
        <MetricCard label="FPS" value={stats.fps} />
      </div>

      <h3 className="label-upper" style={{ marginTop: 16, marginBottom: 10 }}>Análise de Luz</h3>
      <div style={{ padding: '12px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 3 }}>
        <Row label="Transparência" value={`${transparencyRatio}%`} />
        <Row label="Área de Saída" value={`${lightArea.toFixed(2)} dm²`} />
        <Row label="Fluxo Luminoso" value={`${lightOutput} lm`} />
        <Row label="Difusão" value={activeMesh ? 'Difusa' : 'Uniforme'} />
      </div>

      {/* Light distribution bar */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span className="label-upper">Distribuição</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>
            {transparencyRatio}%
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${transparencyRatio}%`,
            background: 'linear-gradient(90deg, #FF6A00, #ffcc66)',
            borderRadius: 3,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      <h3 className="label-upper" style={{ marginTop: 16, marginBottom: 10 }}>Compatibilidade</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <CompatRow label="Modo Vase" compat={activeMesh?.vaseModeCompat} />
        <CompatRow label="FDM Padrão" compat={activeMesh?.stdPrintCompat} />
        <CompatRow label="Resin SLA" compat={true} />
        <CompatRow label="Multi-material" compat={false} />
      </div>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div style={{
      padding: '10px', background: 'var(--card)',
      border: '1px solid var(--line)', borderRadius: 3,
    }}>
      <div style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-condensed)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 16, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 500, marginTop: 3 }}>
        {value}
      </div>
    </div>
  )
}

function CompatRow({ label, compat }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 10px', background: 'var(--card)',
      border: '1px solid var(--line)', borderRadius: 2,
    }}>
      <span style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{label}</span>
      <span style={{
        fontSize: 10, fontFamily: 'var(--font-condensed)', fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        color: compat ? '#00b894' : '#d63031',
      }}>
        {compat ? '✓ Compatível' : '✗ Incompatível'}
      </span>
    </div>
  )
}

// ─── AI Panel ──────────────────────────────────────────────────────

function AIPanel() {
  const lampshade = useStore((s) => s.lampshade)
  const activeMesh = useStore((s) => s.activeMesh)
  const [prompt, setPrompt] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  const generate = () => {
    if (!prompt.trim()) return
    setLoading(true)
    setSuggestions([])
    setTimeout(() => {
      const ideas = [
        { title: 'Variação A', desc: `${prompt} — versão otimizada para impressão vase mode com 0.4mm de parede.`, tag: 'Vase' },
        { title: 'Variação B', desc: `${prompt} — adaptado para FDM padrão com suportes mínimos.`, tag: 'FDM' },
        { title: 'Variação C', desc: `${prompt} — versão decorativa com mais detalhe e filamento silk.`, tag: 'Luxo' },
      ]
      setSuggestions(ideas)
      setLoading(false)
    }, 1500)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="fade-in">
      <h3 className="label-upper" style={{ marginBottom: 10 }}>Gerador de Malha IA</h3>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.5, marginBottom: 12 }}>
        Descreva o estilo desejado e a IA sugerirá variações de malha personalizadas.
      </p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ex: padrão floral orgânico com alta transparência..."
        style={{
          width: '100%', minHeight: 70,
          background: 'var(--card)', border: '1px solid var(--line)',
          borderRadius: 3, padding: '10px',
          color: 'var(--text)', fontSize: 12,
          fontFamily: 'var(--font-body)', resize: 'vertical',
          outline: 'none',
        }}
      />

      <button
        onClick={generate}
        disabled={loading || !prompt.trim()}
        style={{
          width: '100%', marginTop: 8, padding: '10px',
          background: loading || !prompt.trim() ? 'var(--card)' : 'var(--accent)',
          border: 'none', borderRadius: 3,
          color: loading || !prompt.trim() ? 'var(--text-secondary)' : '#000',
          fontFamily: 'var(--font-condensed)', fontSize: 12, fontWeight: 800,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading ? (
          <>
            <span style={{ width: 12, height: 12, border: '2px solid var(--text-secondary)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Gerando...
          </>
        ) : 'Gerar Sugestões'}
      </button>

      {/* Suggestions */}
      {suggestions.map((s, i) => (
        <div key={i} style={{
          marginTop: 8, padding: '10px',
          background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 3,
          animation: 'fadeIn 0.3s ease both',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-condensed)', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
              {s.title}
            </span>
            <span style={{
              fontFamily: 'var(--font-condensed)', fontSize: 8, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--info)', background: 'rgba(116,185,255,0.1)',
              padding: '2px 5px', borderRadius: 1,
            }}>
              {s.tag}
            </span>
          </div>
          <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
            {s.desc}
          </p>
        </div>
      ))}

      {/* Current design info */}
      <div style={{
        marginTop: 16, padding: '10px',
        background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 3,
      }}>
        <div style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
          DESIGN ATUAL
        </div>
        <Row label="Perfil" value={lampshade.profile} />
        <Row label="Malha" value={activeMesh?.name || 'Nenhuma'} />
        <Row label="Altura" value={`${lampshade.height}mm`} />
        <Row label="Diâmetro" value={`${lampshade.bottomDiameter}mm`} />
      </div>
    </div>
  )
}

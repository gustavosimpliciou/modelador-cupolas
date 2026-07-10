import { useStore } from '../store/useStore'

const PROFILES = [
  { id: 'cone', name: 'Cone', icon: '△' },
  { id: 'drum', name: 'Tambor', icon: '⬛' },
  { id: 'bell', name: 'Sino', icon: '◡' },
  { id: 'flare', name: 'Flare', icon: '⌄' },
  { id: 'globe', name: 'Globo', icon: '○' },
  { id: 'empire', name: 'Império', icon: '⏢' },
  { id: 'torchiere', name: 'Tocha', icon: '▽' },
  { id: 'cylinder', name: 'Cilindro', icon: '□' },
]

const FITTERS = [
  { id: 'E27', name: 'E27', desc: 'Standard' },
  { id: 'E14', name: 'E14', desc: 'Small' },
  { id: 'GU10', name: 'GU10', desc: 'Spot' },
  { id: 'E40', name: 'E40', desc: 'Large' },
]

const DIMENSION_CONFIG = [
  { key: 'height', label: 'Altura', min: 80, max: 400, step: 5, unit: 'mm' },
  { key: 'topDiameter', label: 'Diâmetro Superior', min: 20, max: 200, step: 5, unit: 'mm' },
  { key: 'bottomDiameter', label: 'Diâmetro Inferior', min: 40, max: 350, step: 5, unit: 'mm' },
  { key: 'wallThickness', label: 'Espessura Parede', min: 0.4, max: 5, step: 0.1, unit: 'mm' },
  { key: 'bellCurve', label: 'Curva Sino', min: 0, max: 1, step: 0.05, unit: '' },
  { key: 'segments', label: 'Segmentos', min: 32, max: 128, step: 4, unit: '' },
  { key: 'smoothing', label: 'Suavização', min: 0, max: 2, step: 0.1, unit: '' },
  { key: 'flareAngle', label: 'Ângulo Flare', min: 0, max: 45, step: 1, unit: '°' },
]

export default function LeftPanel() {
  const lampshade = useStore((s) => s.lampshade)
  const setLampshade = useStore((s) => s.setLampshade)

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--panel)',
      borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
        <h2 style={{
          fontFamily: 'var(--font-condensed)', fontSize: 13, fontWeight: 800,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)',
        }}>
          Geometria
        </h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
        {/* Profile selection */}
        <Section title="Perfil">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4 }}>
            {PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => setLampshade({ profile: p.id })}
                style={{
                  padding: '8px 4px',
                  background: lampshade.profile === p.id ? 'var(--accent-dim)' : 'var(--card)',
                  border: `1px solid ${lampshade.profile === p.id ? 'var(--accent)' : 'var(--line)'}`,
                  borderRadius: 2,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 16, color: lampshade.profile === p.id ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {p.icon}
                </span>
                <span style={{
                  fontFamily: 'var(--font-condensed)', fontSize: 8, fontWeight: 700,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: lampshade.profile === p.id ? 'var(--accent)' : 'var(--text-secondary)',
                }}>
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* Dimensions */}
        <Section title="Dimensões">
          {DIMENSION_CONFIG.map((d) => (
            <div key={d.key} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span className="label-upper">{d.label}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--accent)', fontWeight: 500,
                }}>
                  {lampshade[d.key]}{d.unit}
                </span>
              </div>
              <input
                type="range"
                min={d.min}
                max={d.max}
                step={d.step}
                value={lampshade[d.key]}
                onChange={(e) => setLampshade({ [d.key]: parseFloat(e.target.value) })}
              />
            </div>
          ))}
        </Section>

        {/* Fitter type */}
        <Section title="Rosca / Soquete">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {FITTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setLampshade({ fitterType: f.id })}
                style={{
                  padding: '8px 10px',
                  background: lampshade.fitterType === f.id ? 'var(--accent-dim)' : 'var(--card)',
                  border: `1px solid ${lampshade.fitterType === f.id ? 'var(--accent)' : 'var(--line)'}`,
                  borderRadius: 2,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-condensed)', fontSize: 13, fontWeight: 700,
                  color: lampshade.fitterType === f.id ? 'var(--accent)' : 'var(--text)',
                }}>
                  {f.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-condensed)', fontSize: 9,
                  color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  {f.desc}
                </div>
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-light)' }}>
      <h3 style={{
        fontFamily: 'var(--font-condensed)', fontSize: 10, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--text-secondary)', marginBottom: 10,
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

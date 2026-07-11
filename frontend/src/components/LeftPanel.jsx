import { useStore } from '../store/useStore'
import { BOTTOM_CAP_MODELS } from '../data/bottomCapPatterns'
import { useT } from '../i18n/useT'

// ─── Profile SVG icons (accurate silhouette of each shade shape) ───
const ProfileIcon = ({ id, size = 20, color }) => {
  const s = size, m = size / 2
  const stroke = color || 'currentColor'
  const common = { fill: 'none', stroke, strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' }
  switch (id) {
    case 'cone':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20"><polygon points="7,3 13,3 17,17 3,17" {...common} /></svg>
      )
    case 'drum':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20"><rect x="3.5" y="3" width="13" height="14" rx="0.5" {...common} /></svg>
      )
    case 'bell':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <path d="M 6 3 L 14 3 C 15 7 18 12 17 17 L 3 17 C 2 12 5 7 6 3 Z" {...common} />
        </svg>
      )
    case 'flare':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <path d="M 7 3 L 13 3 L 18 17 L 2 17 Z" {...common} />
          <path d="M 2 17 Q 10 14 18 17" {...common} />
        </svg>
      )
    case 'globe':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <ellipse cx="10" cy="10.5" rx="7" ry="7" {...common} />
          <line x1="7" y1="4" x2="13" y2="4" {...common} />
        </svg>
      )
    case 'empire':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <path d="M 6.5 3 L 13.5 3 Q 17 10 17 17 L 3 17 Q 3 10 6.5 3 Z" {...common} />
        </svg>
      )
    case 'torchiere':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <path d="M 3 3 L 17 3 Q 15 12 12 17 L 8 17 Q 5 12 3 3 Z" {...common} />
        </svg>
      )
    case 'cylinder':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <rect x="4.5" y="3" width="11" height="14" {...common} />
          <ellipse cx="10" cy="3" rx="5.5" ry="1.4" {...common} />
        </svg>
      )
    default:
      return null
  }
}

const PROFILES = [
  { id: 'cone', tk: 'profile.cone' },
  { id: 'drum', tk: 'profile.drum' },
  { id: 'bell', tk: 'profile.bell' },
  { id: 'flare', tk: 'profile.flare' },
  { id: 'globe', tk: 'profile.globe' },
  { id: 'empire', tk: 'profile.empire' },
  { id: 'torchiere', tk: 'profile.torchiere' },
  { id: 'cylinder', tk: 'profile.cylinder' },
]

const FITTERS = [
  { id: 'E27', name: 'E27', desc: 'Standard' },
  { id: 'E14', name: 'E14', desc: 'Small' },
  { id: 'GU10', name: 'GU10', desc: 'Spot' },
  { id: 'E40', name: 'E40', desc: 'Large' },
]

const DIMENSION_CONFIG = [
  { key: 'height', tk: 'dim.height', min: 80, max: 400, step: 5, unit: 'mm' },
  { key: 'topDiameter', tk: 'dim.topDiameter', min: 20, max: 350, step: 5, unit: 'mm' },
  { key: 'middleDiameter', tk: 'dim.middleDiameter', min: 20, max: 400, step: 5, unit: 'mm' },
  { key: 'bottomDiameter', tk: 'dim.bottomDiameter', min: 40, max: 350, step: 5, unit: 'mm' },
  { key: 'wallThickness', tk: 'dim.wallThickness', min: 0.8, max: 10, step: 0.1, unit: 'mm' },
  { key: 'bellCurve', tk: 'dim.bellCurve', min: 0, max: 8, step: 0.05, unit: '' },
  { key: 'segments', tk: 'dim.segments', min: 32, max: 200, step: 4, unit: '' },
  { key: 'smoothing', tk: 'dim.smoothing', min: 0, max: 4, step: 0.1, unit: '' },
  { key: 'flareAngle', tk: 'dim.flareAngle', min: 0, max: 45, step: 1, unit: '°' },
]

// ─── Socket presets (from prompt) ───────────────────────────────
const SOCKET_PRESETS = [
  { id: 'E27', name: 'E27', desc: 'Padrão Brasil', diameter: 29 },
  { id: 'E14', name: 'E14', desc: 'Pequeno',        diameter: 27 },
  { id: 'custom', name: 'Custom', desc: 'Personalizado', diameter: null },
]

const HOLE_DIAMETERS = [10, 12, 20, 25, 27, 29, 30, 35, 40, 45, 50]
const THICKNESS_PRESETS = [2, 2.5, 3, 3.5, 4, 5]
const SUPPORT_OPTIONS = [2, 3, 4]

export default function LeftPanel() {
  const lampshade = useStore((s) => s.lampshade)
  const setLampshade = useStore((s) => s.setLampshade)
  const showHandle = useStore((s) => s.showHandle)
  const setShowHandle = useStore((s) => s.setShowHandle)
  const bottomCap = useStore((s) => s.bottomCap)
  const setBottomCap = useStore((s) => s.setBottomCap)
  const resetBottomTransform = useStore((s) => s.resetBottomTransform)
  const t = useT()

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
          {t('left.geometry')}
        </h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
        {/* Profile selection */}
        <Section title={t('left.profile')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4 }}>
            {PROFILES.map((p) => {
              const active = lampshade.profile === p.id
              return (
                <button
                  key={p.id}
                  data-testid={`profile-btn-${p.id}`}
                  onClick={() => setLampshade({ profile: p.id })}
                  style={{
                    padding: '8px 4px 6px',
                    background: active ? 'var(--accent-dim)' : 'var(--card)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                    borderRadius: 2, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all 0.15s',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <ProfileIcon id={p.id} size={22} />
                  <span style={{
                    fontFamily: 'var(--font-condensed)', fontSize: 8.5, fontWeight: 700,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    {t(p.tk)}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Handle toggle */}
        <Section title={t('left.handle')}>
          <ToggleRow
            testId="handle-toggle"
            label={t('left.showHandle')}
            value={showHandle}
            onChange={setShowHandle}
          />
        </Section>

        {/* Dimensions */}
        <Section title={t('left.dimensions')}>
          {DIMENSION_CONFIG.map((d) => (
            <div key={d.key} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span className="label-upper">{t(d.tk)}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--accent)', fontWeight: 500,
                }}>
                  {lampshade[d.key]}{d.unit}
                </span>
              </div>
              <input
                data-testid={`dim-${d.key}`}
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

        {/* Fitter type removed per user request — using bottom cap socket instead */}

        {/* Fundo da Cúpula (Bottom Cap) */}
        <Section title={t('left.bottomCap')} accent>
          <ToggleRow
            testId="bottomcap-toggle"
            label={t('left.bottomCap.enable')}
            value={bottomCap.enabled}
            onChange={(v) => setBottomCap({ enabled: v })}
          />

          {bottomCap.enabled && (
            <div className="fade-in" style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Model cards */}
              <SubLabel>{t('left.bottomCap.model')}</SubLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {BOTTOM_CAP_MODELS.map((m) => {
                  const active = bottomCap.model === m.id
                  return (
                    <button
                      key={m.id}
                      data-testid={`bottomcap-model-${m.id}`}
                      onClick={() => setBottomCap({ model: m.id })}
                      style={{
                        padding: '8px 6px',
                        background: active ? 'var(--accent-dim)' : 'var(--card)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                        borderRadius: 2, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <ModelMini id={m.id} active={active} />
                      <div style={{
                        fontFamily: 'var(--font-condensed)', fontSize: 10, fontWeight: 700,
                        marginTop: 4,
                        color: active ? 'var(--accent)' : 'var(--text)',
                      }}>{m.name}</div>
                      <div style={{
                        fontFamily: 'var(--font-condensed)', fontSize: 8.5,
                        color: 'var(--text-secondary)', letterSpacing: '0.04em',
                      }}>{m.desc}</div>
                    </button>
                  )
                })}
              </div>

              {/* Socket type */}
              <SubLabel>{t('left.bottomCap.socket')}</SubLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {SOCKET_PRESETS.map((sk) => {
                  const active = bottomCap.socketType === sk.id
                  return (
                    <button
                      key={sk.id}
                      data-testid={`socket-${sk.id}`}
                      onClick={() => {
                        const patch = { socketType: sk.id }
                        if (sk.diameter) patch.holeDiameter = sk.diameter
                        setBottomCap(patch)
                      }}
                      style={{
                        padding: '6px 4px',
                        background: active ? 'var(--accent-dim)' : 'var(--card)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                        borderRadius: 2, cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{
                        fontFamily: 'var(--font-condensed)', fontSize: 11, fontWeight: 700,
                        color: active ? 'var(--accent)' : 'var(--text)',
                      }}>{sk.name}</div>
                      <div style={{
                        fontFamily: 'var(--font-condensed)', fontSize: 8,
                        color: 'var(--text-secondary)',
                      }}>{sk.desc}</div>
                    </button>
                  )
                })}
              </div>

              {/* Hole diameter quick chips */}
              <SubLabel>{t('left.bottomCap.hole')}</SubLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {HOLE_DIAMETERS.map((d) => {
                  const active = bottomCap.holeDiameter === d
                  return (
                    <button
                      key={d}
                      data-testid={`hole-${d}`}
                      onClick={() => setBottomCap({ holeDiameter: d, socketType: 'custom' })}
                      style={{
                        padding: '4px 7px',
                        background: active ? 'var(--accent)' : 'var(--card)',
                        color: active ? '#000' : 'var(--text-secondary)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                        borderRadius: 10, cursor: 'pointer',
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                      }}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="label-upper">{t('left.bottomCap.custom')}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
                    {bottomCap.holeDiameter}mm
                  </span>
                </div>
                <input
                  data-testid="hole-slider"
                  type="range" min={10} max={150} step={0.5}
                  value={bottomCap.holeDiameter}
                  onChange={(e) => setBottomCap({ holeDiameter: parseFloat(e.target.value), socketType: 'custom' })}
                />
              </div>

              {/* Thickness */}
              <SubLabel>{t('left.bottomCap.thickness')}</SubLabel>
              <div style={{ display: 'flex', gap: 3 }}>
                {THICKNESS_PRESETS.map((t) => {
                  const active = bottomCap.thickness === t
                  return (
                    <button
                      key={t}
                      data-testid={`thickness-${t}`}
                      onClick={() => setBottomCap({ thickness: t })}
                      style={{
                        flex: 1, padding: '5px 0',
                        background: active ? 'var(--accent-dim)' : 'var(--card)',
                        color: active ? 'var(--accent)' : 'var(--text-secondary)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                        borderRadius: 2, cursor: 'pointer',
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                      }}
                    >
                      {t}mm
                    </button>
                  )
                })}
              </div>

              {/* Supports */}
              <SubLabel>{t('left.bottomCap.supports')}</SubLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {SUPPORT_OPTIONS.map((n) => {
                  const active = bottomCap.supports === n
                  return (
                    <button
                      key={n}
                      data-testid={`supports-${n}`}
                      onClick={() => setBottomCap({ supports: n })}
                      style={{
                        padding: '6px 0',
                        background: active ? 'var(--accent-dim)' : 'var(--card)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                        borderRadius: 2, cursor: 'pointer',
                        color: active ? 'var(--accent)' : 'var(--text)',
                        fontFamily: 'var(--font-condensed)', fontSize: 11, fontWeight: 700,
                      }}
                    >
                      {n} {n === 4 && <span style={{ fontSize: 7, marginLeft: 3, color: 'var(--accent)' }}>REC</span>}
                    </button>
                  )
                })}
              </div>

              {/* Vented area */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="label-upper">{t('left.bottomCap.vented')}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
                    {bottomCap.ventedArea}%
                  </span>
                </div>
                <input
                  data-testid="vented-slider"
                  type="range" min={20} max={80} step={5}
                  value={bottomCap.ventedArea}
                  onChange={(e) => setBottomCap({ ventedArea: parseInt(e.target.value) })}
                />
              </div>

              {/* Auto-align toggle */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 6, marginTop: 4, borderTop: '1px solid var(--line-light)',
              }}>
                <span className="label-upper" style={{ fontSize: 10 }}>{t('left.bottomCap.autoAlign')}</span>
                <label style={{
                  position: 'relative', display: 'inline-block',
                  width: 30, height: 16, cursor: 'pointer',
                }}>
                  <input
                    data-testid="autoalign-toggle"
                    type="checkbox"
                    checked={bottomCap.autoAlign !== false}
                    onChange={(e) => setBottomCap({ autoAlign: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute', inset: 0,
                    background: bottomCap.autoAlign !== false ? 'var(--accent)' : 'var(--line)',
                    borderRadius: 8, transition: 'background 0.15s',
                  }}>
                    <span style={{
                      position: 'absolute', top: 2,
                      left: bottomCap.autoAlign !== false ? 16 : 2,
                      width: 12, height: 12, background: '#fff', borderRadius: '50%',
                      transition: 'left 0.15s',
                    }} />
                  </span>
                </label>
              </div>

              {/* ── Bottom Alignment / Transform ── */}
              <div style={{
                paddingTop: 8, marginTop: 4,
                borderTop: '1px solid var(--line-light)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                  <span className="label-upper" style={{ fontSize: 10, color: 'var(--accent)' }}>
                    {t('left.bottomCap.alignment')}
                  </span>
                  <button
                    data-testid="reset-bottom-transform-btn"
                    onClick={() => resetBottomTransform()}
                    style={{
                      fontFamily: 'var(--font-condensed)', fontSize: 9,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '3px 8px', border: '1px solid var(--line)',
                      background: 'transparent', color: 'var(--text-secondary)',
                      cursor: 'pointer', borderRadius: 3,
                    }}
                    title="Reset all rotations & flips"
                  >{t('left.bottomCap.reset')}</button>
                </div>

                {[
                  { axis: 'X', key: 'rotationX' },
                  { axis: 'Y', key: 'rotationY' },
                  { axis: 'Z', key: 'rotationZ' },
                ].map(({ axis, key }) => (
                  <div key={key} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span className="label-upper" style={{ fontSize: 10 }}>{t('left.bottomCap.rot')} {axis}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
                        {bottomCap[key] || 0}°
                      </span>
                    </div>
                    <input
                      data-testid={`bottom-rot-${axis.toLowerCase()}-slider`}
                      type="range" min={0} max={360} step={1}
                      value={bottomCap[key] || 0}
                      onChange={(e) => setBottomCap({ [key]: parseInt(e.target.value) })}
                    />
                  </div>
                ))}

                {/* Flip options */}
                <div style={{
                  display: 'flex', gap: 8, marginTop: 6,
                }}>
                  {[
                    { key: 'flipHorizontal', label: t('left.bottomCap.flipH') },
                    { key: 'flipVertical', label: t('left.bottomCap.flipV') },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      data-testid={`bottom-${key}-btn`}
                      onClick={() => setBottomCap({ [key]: !bottomCap[key] })}
                      style={{
                        flex: 1, padding: '5px 6px',
                        fontFamily: 'var(--font-condensed)', fontSize: 10,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        border: '1px solid ' + (bottomCap[key] ? 'var(--accent)' : 'var(--line)'),
                        background: bottomCap[key] ? 'var(--accent)' : 'transparent',
                        color: bottomCap[key] ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer', borderRadius: 3,
                        transition: 'all 0.12s',
                      }}
                    >{label}</button>
                  ))}
                </div>

                <div style={{
                  fontSize: 9, color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-condensed)', letterSpacing: '0.06em',
                  marginTop: 6, lineHeight: 1.35,
                }}>
                  {t('left.bottomCap.hint')}
                </div>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, accent, children }) {
  return (
    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-light)' }}>
      <h3 style={{
        fontFamily: 'var(--font-condensed)', fontSize: 10, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: accent ? 'var(--accent)' : 'var(--text-secondary)',
        marginBottom: 10,
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function SubLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-condensed)', fontSize: 9, fontWeight: 700,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      color: 'var(--text-dim)',
    }}>{children}</div>
  )
}

function ToggleRow({ testId, label, value, onChange }) {
  return (
    <button
      data-testid={testId}
      onClick={() => onChange(!value)}
      style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 10px',
        background: value ? 'var(--accent-dim)' : 'var(--card)',
        border: `1px solid ${value ? 'var(--accent)' : 'var(--line)'}`,
        borderRadius: 2, cursor: 'pointer',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-condensed)', fontSize: 11, fontWeight: 600,
        color: value ? 'var(--accent)' : 'var(--text)',
        letterSpacing: '0.04em',
      }}>
        {label}
      </span>
      <span style={{
        width: 26, height: 14, borderRadius: 8,
        background: value ? 'var(--accent)' : '#333',
        position: 'relative', transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 14 : 2,
          width: 10, height: 10, borderRadius: '50%',
          background: '#fff', transition: 'left 0.15s',
        }} />
      </span>
    </button>
  )
}

// Miniature icon that visually hints the pattern of each bottom cap model
function ModelMini({ id, active }) {
  const color = active ? 'var(--accent)' : 'var(--text-secondary)'
  const stroke = { fill: 'none', stroke: color, strokeWidth: 0.8, strokeLinejoin: 'round' }
  const size = 38
  return (
    <svg width="100%" height="30" viewBox="0 0 40 30" style={{ display: 'block' }}>
      {/* outer + center hole common */}
      <circle cx="20" cy="15" r="13" {...stroke} />
      <circle cx="20" cy="15" r="3" {...stroke} />
      {/* pattern hint */}
      {id === 'triangles' && [0, 60, 120, 180, 240, 300].map((a, i) => {
        const rad = (a * Math.PI) / 180
        const cx = 20 + Math.cos(rad) * 8
        const cy = 15 + Math.sin(rad) * 8
        return <polygon key={i} points={`${cx-2},${cy+1.5} ${cx+2},${cy+1.5} ${cx},${cy-2}`} {...stroke} />
      })}
      {id === 'squares' && [0, 60, 120, 180, 240, 300].map((a, i) => {
        const rad = (a * Math.PI) / 180
        const cx = 20 + Math.cos(rad) * 8
        const cy = 15 + Math.sin(rad) * 8
        return <rect key={i} x={cx-2} y={cy-2} width="4" height="4" rx="1" {...stroke} />
      })}
      {id === 'drops' && [0, 60, 120, 180, 240, 300].map((a, i) => {
        const rad = (a * Math.PI) / 180
        const cx = 20 + Math.cos(rad) * 8
        const cy = 15 + Math.sin(rad) * 8
        return <ellipse key={i} cx={cx} cy={cy} rx="1.5" ry="2.4" transform={`rotate(${a} ${cx} ${cy})`} {...stroke} />
      })}
      {id === 'hexagons' && [0, 60, 120, 180, 240, 300].map((a, i) => {
        const rad = (a * Math.PI) / 180
        const cx = 20 + Math.cos(rad) * 8
        const cy = 15 + Math.sin(rad) * 8
        const pts = []
        for (let k = 0; k < 6; k++) {
          const aa = (k * Math.PI) / 3
          pts.push(`${cx + Math.cos(aa) * 2},${cy + Math.sin(aa) * 2}`)
        }
        return <polygon key={i} points={pts.join(' ')} {...stroke} />
      })}
      {id === 'diamonds' && [0, 60, 120, 180, 240, 300].map((a, i) => {
        const rad = (a * Math.PI) / 180
        const cx = 20 + Math.cos(rad) * 8
        const cy = 15 + Math.sin(rad) * 8
        return <polygon key={i} points={`${cx},${cy-2.4} ${cx+1.6},${cy} ${cx},${cy+2.4} ${cx-1.6},${cy}`} {...stroke} />
      })}
      {id === 'arabesque' && [0, 60, 120, 180, 240, 300].map((a, i) => {
        const rad = (a * Math.PI) / 180
        const cx = 20 + Math.cos(rad) * 8
        const cy = 15 + Math.sin(rad) * 8
        return <path key={i} d={`M ${cx-2} ${cy} Q ${cx} ${cy-3} ${cx+2} ${cy} Q ${cx} ${cy+3} ${cx-2} ${cy} Z`} {...stroke} />
      })}
      {/* 4 supports */}
      {[0, 90, 180, 270].map((a, i) => {
        const rad = (a * Math.PI) / 180
        return <line key={i} x1={20+Math.cos(rad)*3} y1={15+Math.sin(rad)*3} x2={20+Math.cos(rad)*13} y2={15+Math.sin(rad)*13} {...stroke} strokeWidth="1.4" />
      })}
    </svg>
  )
}

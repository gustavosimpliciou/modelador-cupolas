import { useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { TEXTURES } from '../data/textures'
import { buildLampshadeGeometry } from '../lib/lampshadeGeometry'

// ─── Thumbnail geometry cache ──────────────────────────────────────

const thumbCache = new Map()

function getThumbGeo(tex) {
  if (thumbCache.has(tex.id)) return thumbCache.get(tex.id)
  const dummyLamp = {
    profile: 'cylinder', height: 250, topDiameter: 180, bottomDiameter: 180,
    wallThickness: 1.5, bellCurve: 0.3, segments: 96, smoothing: 1, flareAngle: 0,
  }
  const params = {
    intensity: Math.max(1.2, tex.defaults.intensity),
    scale: tex.defaults.scale,
    rotation: 0,
    direction: tex.defaults.direction,
    repetition: tex.defaults.repetition,
    smooth: tex.defaults.smooth,
    offset: 0,
  }
  const geo = buildLampshadeGeometry(
    dummyLamp,
    { density: 1, rotation: 0, lineThickness: 1, amplitude: 1.5, frequency: 1, noise: 0, scale: 1 },
    null,
    tex,
    params,
  )
  thumbCache.set(tex.id, geo)
  return geo
}

function ThumbMesh({ tex, active }) {
  const ref = useRef()
  const geo = useMemo(() => getThumbGeo(tex), [tex])
  // Static pose — canvases use frameloop="demand" to avoid burning CPU
  // on 10 simultaneous WebGL contexts.
  return (
    <mesh ref={ref} geometry={geo} rotation={[0, 0.55, 0]}>
      <meshStandardMaterial
        color={active ? '#FF6A00' : '#d4cfc8'}
        roughness={0.42}
        metalness={0.05}
        side={THREE.DoubleSide}
        emissive={active ? '#FF6A00' : '#000000'}
        emissiveIntensity={active ? 0.12 : 0}
      />
    </mesh>
  )
}

function ThumbCanvas({ tex, active }) {
  return (
    <Canvas
      camera={{ position: [0, 0.15, 3.4], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      dpr={[1, 1.5]}
      frameloop="demand"
      onCreated={({ scene }) => { scene.background = null }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 3]} intensity={2.2} />
      <directionalLight position={[-2, 2, -3]} intensity={0.6} color="#ff8844" />
      <pointLight position={[0, -2, 2]} intensity={0.3} color="#4488ff" />
      <ThumbMesh tex={tex} active={active} />
    </Canvas>
  )
}

// ─── Card ──────────────────────────────────────────────────────────

function TextureCard({ tex, active, onSelect, index }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      data-testid={`texture-card-${tex.id}`}
      onClick={() => onSelect(tex)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: active ? 'rgba(255,106,0,0.06)' : 'var(--card)',
        border: `1px solid ${active ? 'var(--accent)' : hovered ? 'rgba(255,106,0,0.4)' : 'var(--line)'}`,
        borderRadius: 3, cursor: 'pointer',
        transform: hovered ? 'translateY(-4px) scale(1.03)' : 'translateY(0) scale(1)',
        transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.15s, box-shadow 0.22s',
        boxShadow: hovered
          ? '0 14px 26px -8px rgba(0,0,0,0.65), 0 0 18px rgba(255,106,0,0.18)'
          : active ? '0 0 12px rgba(255,106,0,0.15)' : 'none',
        overflow: 'hidden', aspectRatio: '1 / 1',
        display: 'flex', flexDirection: 'column', position: 'relative',
        animation: 'fadeIn 0.2s ease both',
      }}
    >
      <div style={{ flex: 1, background: '#0c0c0c', position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <ThumbCanvas tex={tex} active={active} />
        {/* Numeric badge like reference */}
        <div style={{
          position: 'absolute', top: 5, left: 5,
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-secondary)',
          background: 'rgba(10,10,10,0.75)',
          border: '1px solid var(--line)', borderRadius: 2,
          padding: '1px 5px', letterSpacing: '0.06em',
        }}>
          {String(index + 1).padStart(2, '0')}
        </div>
        {active && (
          <div style={{
            position: 'absolute', top: 5, right: 5,
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)',
            animation: 'pulse-accent 2s infinite',
          }} />
        )}
      </div>
      <div style={{ padding: '5px 7px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-condensed)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: active ? 'var(--accent)' : 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {tex.name}
        </div>
      </div>
    </div>
  )
}

// ─── Parameter row ────────────────────────────────────────────────

function Slider({ label, unit = '', value, min, max, step, onChange, testId }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span className="label-upper">{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
          {typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}{unit}
        </span>
      </div>
      <input
        data-testid={testId}
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}

// ─── Main Library Panel ────────────────────────────────────────────

export default function TextureLibrary() {
  const activeTexture = useStore((s) => s.activeTexture)
  const setActiveTexture = useStore((s) => s.setActiveTexture)
  const textureParams = useStore((s) => s.textureParams)
  const setTextureParams = useStore((s) => s.setTextureParams)
  const resetTextureParams = useStore((s) => s.resetTextureParams)
  const [view, setView] = useState('library')

  const DIRECTIONS = ['vertical', 'horizontal', 'diagonal', 'radial', 'helicoidal']

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
        {['library', 'editor'].map((v) => (
          <button
            key={v}
            data-testid={`tex-subtab-${v}`}
            onClick={() => setView(v)}
            style={{
              flex: 1, padding: '7px',
              fontFamily: 'var(--font-condensed)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: view === v ? 'var(--text)' : 'var(--text-secondary)',
              background: view === v ? 'rgba(255,255,255,0.04)' : 'none',
              borderBottom: view === v ? '1px solid var(--line)' : '1px solid transparent',
              cursor: 'pointer', border: 'none',
            }}
          >
            {v === 'library' ? 'Biblioteca' : 'Parâmetros'}
          </button>
        ))}
      </div>

      {view === 'library' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 14px' }} className="fade-in">
          <div style={{ padding: '2px 2px 8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
              10 texturas · baixo relevo · impressão 3D
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TEXTURES.map((tex, idx) => (
              <TextureCard
                key={tex.id}
                tex={tex}
                index={idx}
                active={activeTexture?.id === tex.id}
                onSelect={setActiveTexture}
              />
            ))}
          </div>

          {/* Off button */}
          <button
            data-testid="texture-clear-btn"
            onClick={() => setActiveTexture(null)}
            disabled={!activeTexture}
            style={{
              width: '100%', marginTop: 12, padding: '9px',
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 2,
              color: activeTexture ? 'var(--text)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-condensed)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: activeTexture ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            {activeTexture ? 'Remover Textura (cúpula lisa)' : 'Nenhuma textura'}
          </button>
        </div>
      )}

      {view === 'editor' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }} className="fade-in">
          {!activeTexture && (
            <div style={{
              padding: '24px 12px', textAlign: 'center',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-condensed)', fontSize: 12,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Selecione uma textura na biblioteca
            </div>
          )}
          {activeTexture && (
            <>
              <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-condensed)', fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                    {activeTexture.name}
                  </span>
                </div>
                <p style={{ marginTop: 6, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
                  {activeTexture.description}
                </p>
              </div>

              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Slider
                  testId="tex-intensity"
                  label="Intensidade" unit="mm"
                  value={textureParams.intensity}
                  min={0} max={3} step={0.05}
                  onChange={(v) => setTextureParams({ intensity: v })}
                />
                <Slider
                  testId="tex-scale"
                  label="Escala" unit="x"
                  value={textureParams.scale}
                  min={0.2} max={3} step={0.05}
                  onChange={(v) => setTextureParams({ scale: v })}
                />
                <Slider
                  testId="tex-repetition"
                  label="Repetição"
                  value={textureParams.repetition}
                  min={2} max={120} step={1}
                  onChange={(v) => setTextureParams({ repetition: v })}
                />
                <Slider
                  testId="tex-rotation"
                  label="Rotação" unit="°"
                  value={textureParams.rotation}
                  min={0} max={360} step={1}
                  onChange={(v) => setTextureParams({ rotation: v })}
                />
                <Slider
                  testId="tex-offset"
                  label="Offset" unit="°"
                  value={textureParams.offset}
                  min={0} max={360} step={1}
                  onChange={(v) => setTextureParams({ offset: v })}
                />
                <Slider
                  testId="tex-smooth"
                  label="Suavização"
                  value={textureParams.smooth}
                  min={0} max={1} step={0.01}
                  onChange={(v) => setTextureParams({ smooth: v })}
                />

                <div>
                  <span className="label-upper" style={{ display: 'block', marginBottom: 6 }}>Direção</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                    {DIRECTIONS.map((d) => {
                      const active = textureParams.direction === d
                      return (
                        <button
                          key={d}
                          data-testid={`tex-dir-${d}`}
                          onClick={() => setTextureParams({ direction: d })}
                          style={{
                            padding: '6px 4px',
                            background: active ? 'var(--accent-dim)' : 'var(--card)',
                            border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                            borderRadius: 2,
                            fontFamily: 'var(--font-condensed)', fontSize: 9, fontWeight: 700,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            color: active ? 'var(--accent)' : 'var(--text-secondary)',
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  data-testid="tex-reset-btn"
                  onClick={resetTextureParams}
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

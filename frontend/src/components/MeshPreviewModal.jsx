import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { buildLampshadeGeometry } from '../lib/lampshadeGeometry'

// ─── Big 3D preview mesh (auto-rotates) ────────────────────────────

function PreviewMesh({ mesh }) {
  const ref = useRef()
  const geo = useRef(null)

  if (!geo.current) {
    const dummyLamp = {
      profile: 'cone', height: 250, topDiameter: 80, bottomDiameter: 200,
      wallThickness: 1.2, bellCurve: 0.5, segments: 64, smoothing: 1, flareAngle: 15,
    }
    const dummyParams = {
      density: mesh.params.density || 1,
      rotation: mesh.params.rotation || 0,
      lineThickness: mesh.params.lineThickness || 1,
      amplitude: 1.5, frequency: 1, noise: 0, scale: 1,
    }
    geo.current = buildLampshadeGeometry(dummyLamp, dummyParams, mesh)
  }

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.35
  })

  return (
    <mesh ref={ref} geometry={geo.current}>
      <meshStandardMaterial
        color="#d4cfc8"
        roughness={0.28}
        metalness={0.12}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─── Difficulty pill color ─────────────────────────────────────────

function getDiffColor(diff) {
  return {
    'Very Easy': '#00b894', 'Easy': '#55efc4',
    'Medium': '#fdcb6e', 'Hard': '#e17055', 'Expert': '#d63031',
  }[diff] || '#9A9A9A'
}

// ─── Modal ─────────────────────────────────────────────────────────

export default function MeshPreviewModal({ mesh, onApply, onClose, isActive }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    // Lock body scroll while modal open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (!mesh) return null

  const diff = mesh.printDiff
  const diffColor = getDiffColor(diff)

  return (
    <div
      data-testid="mesh-preview-modal"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'mpm-fade 0.18s ease both',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520, maxWidth: '90vw',
          background: 'linear-gradient(180deg, #171717 0%, #0d0d0d 100%)',
          border: '1px solid var(--line)',
          borderRadius: 4,
          overflow: 'hidden',
          animation: 'mpm-slide 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
          position: 'relative',
        }}
      >
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderBottom: '1px solid var(--line)',
          background: 'rgba(255,255,255,0.015)',
        }}>
          <div style={{
            fontFamily: 'var(--font-condensed)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--accent)',
          }}>
            Preview de Malha
          </div>
          <button
            data-testid="mesh-preview-close"
            onClick={onClose}
            style={{
              width: 22, height: 22,
              background: 'transparent', border: '1px solid var(--line)',
              borderRadius: 2, color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.14s',
              fontSize: 12, fontFamily: 'var(--font-mono)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.color = 'var(--accent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--line)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >×</button>
        </div>

        {/* 3D canvas */}
        <div style={{
          height: 320,
          background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 70%)',
          position: 'relative',
        }}>
          <Canvas
            camera={{ position: [0, 0.2, 3.4], fov: 32 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
          >
            <ambientLight intensity={0.55} />
            <directionalLight position={[4, 6, 4]} intensity={2} />
            <directionalLight position={[-3, 2, -4]} intensity={0.5} color="#ff8844" />
            <pointLight position={[0, -2, 3]} intensity={0.4} color="#4488ff" />
            <PreviewMesh mesh={mesh} />
            <OrbitControls enablePan={false} enableZoom={false} autoRotate={false} />
          </Canvas>
          {/* subtle grid overlay to convey "engineering preview" */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            mixBlendMode: 'overlay',
          }} />
        </div>

        {/* Info */}
        <div style={{ padding: '14px 18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
            <div style={{
              fontFamily: 'var(--font-condensed)', fontSize: 18, fontWeight: 700,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'var(--text)',
            }}>
              {mesh.name}
            </div>
            <div style={{
              fontFamily: 'var(--font-condensed)', fontSize: 10,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--text-secondary)',
            }}>
              {mesh.category}
            </div>
          </div>

          {/* Metadata row */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
            <MetaChip label="Dificuldade" value={diff} color={diffColor} />
            <MetaChip label="Densidade" value={mesh.params.density?.toFixed?.(1) || '1.0'} color="var(--text)" />
            <MetaChip label="Espessura" value={mesh.params.lineThickness?.toFixed?.(1) || '1.0'} color="var(--text)" />
            <MetaChip label="Rotação" value={`${mesh.params.rotation || 0}°`} color="var(--text)" />
          </div>

          {mesh.description && (
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.55,
              color: 'var(--text-secondary)', marginBottom: 14,
              paddingTop: 10, borderTop: '1px solid var(--line-light)',
            }}>
              {mesh.description}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              data-testid="mesh-preview-cancel"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid var(--line)',
                fontFamily: 'var(--font-condensed)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                cursor: 'pointer', borderRadius: 2,
                transition: 'all 0.14s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >Cancelar</button>
            <button
              data-testid="mesh-preview-apply"
              onClick={() => { onApply(mesh); onClose() }}
              style={{
                padding: '8px 20px',
                background: isActive ? '#333' : 'var(--accent)',
                border: `1px solid ${isActive ? '#444' : 'var(--accent)'}`,
                fontFamily: 'var(--font-condensed)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: isActive ? 'var(--text-secondary)' : '#000',
                cursor: 'pointer', borderRadius: 2,
                transition: 'all 0.14s',
                boxShadow: isActive ? 'none' : '0 0 12px rgba(255,106,0,0.35)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.boxShadow = '0 0 20px rgba(255,106,0,0.55)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.boxShadow = '0 0 12px rgba(255,106,0,0.35)'
              }}
            >
              {isActive ? 'Malha Ativa' : 'Aplicar Malha'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mpm-fade {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes mpm-slide {
          from { opacity: 0; transform: translateY(20px) scale(0.96) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>
    </div>
  )
}

function MetaChip({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <span style={{
        fontFamily: 'var(--font-condensed)', fontSize: 8,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--text-secondary)',
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
        color,
      }}>{value}</span>
    </div>
  )
}

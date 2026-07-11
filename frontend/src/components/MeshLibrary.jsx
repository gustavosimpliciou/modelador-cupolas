import { useMemo, useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { MESHES, MESH_CATEGORIES, getPattern } from '../data/meshes'
import { buildLampshadeGeometry } from '../lib/lampshadeGeometry'

// ─── SVG pattern renderer (unique per mesh) ────────────────────────

function MeshPatternSVG({ mesh, active, hovered }) {
  const svg = useMemo(() => {
    const cat = mesh.category
    const p = mesh.params
    const dens = p.density || 1
    const rot = (p.rotation || 0) * Math.PI / 180
    const thick = p.lineThickness || 1
    const w = 100, h = 100, cx = 50, cy = 46
    const elements = []
    const stroke = active ? '#FF6A00' : hovered ? '#bbb' : '#666'
    const sw = thick * 0.7

    // Lampshade silhouette (trapezoid)
    elements.push(
      <path key="silhouette" d={`M ${cx} 10 L ${cx + 30} 82 L ${cx - 30} 82 Z`}
        fill={active ? 'rgba(255,106,0,0.05)' : 'rgba(255,255,255,0.015)'}
        stroke={active ? 'rgba(255,106,0,0.2)' : 'rgba(255,255,255,0.05)'}
        strokeWidth="0.5" />
    )

    // Generate pattern lines by sampling the pattern function
    const patternFn = getPattern(mesh.pattern)
    if (patternFn) {
      const samples = 24
      const hSteps = 8
      for (let hi = 0; hi <= hSteps; hi++) {
        const hn = hi / hSteps
        const y = 12 + hn * 68
        const widthAtH = 8 + hn * 22 // trapezoid width
        const points = []
        for (let si = 0; si <= samples; si++) {
          const a = (si / samples) * Math.PI * 2 + rot
          const disp = patternFn(a, hn, { density: dens, rotation: rot, lineThickness: thick })
          const r = widthAtH + disp * 200
          const x = cx + Math.cos(a) * r
          const py = y + Math.sin(a) * r * 0.3 // squish vertically for perspective
          points.push(`${x.toFixed(1)},${py.toFixed(1)}`)
        }
        elements.push(
          <polyline key={`r${hi}`} points={points.join(' ')}
            fill="none" stroke={stroke} strokeWidth={sw * 0.6} opacity={0.4} />
        )
      }
    }

    return elements
  }, [mesh, active, hovered])

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ display: 'block' }}>
      {svg}
    </svg>
  )
}

// ─── 3D Thumbnail (only for active mesh) ────────────────────────────

const geoCache = new Map()

function getThumbGeometry(mesh) {
  if (geoCache.has(mesh.id)) return geoCache.get(mesh.id)
  const dummyLamp = {
    profile: 'cone', height: 250, topDiameter: 80, bottomDiameter: 200,
    wallThickness: 1.2, bellCurve: 0.5, segments: 48, smoothing: 1, flareAngle: 15,
  }
  const dummyParams = {
    density: mesh.params.density || 1, rotation: mesh.params.rotation || 0,
    lineThickness: mesh.params.lineThickness || 1, amplitude: 1.5,
    frequency: 1, noise: 0, scale: 1,
  }
  const geo = buildLampshadeGeometry(dummyLamp, dummyParams, mesh)
  geoCache.set(mesh.id, geo)
  return geo
}

function ThumbMesh({ mesh, active }) {
  const ref = useRef()
  const geo = useMemo(() => getThumbGeometry(mesh), [mesh])

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.5
  })

  return (
    <mesh ref={ref} geometry={geo}>
      <meshStandardMaterial
        color={active ? '#FF6A00' : '#d4cfc8'}
        roughness={0.3}
        metalness={0.1}
        side={THREE.DoubleSide}
        emissive={active ? '#FF6A00' : '#000000'}
        emissiveIntensity={active ? 0.15 : 0}
      />
    </mesh>
  )
}

function ThumbCanvas({ mesh, active }) {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 3.2], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      dpr={[1, 1.5]}
      onCreated={({ scene }) => { scene.background = null }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={2} />
      <directionalLight position={[-2, 2, -3]} intensity={0.6} color="#ff8844" />
      <ThumbMesh mesh={mesh} active={active} />
    </Canvas>
  )
}

// ─── Mesh Card (square) ────────────────────────────────────────────

function MeshCard({ mesh, active, onSelect, onFavorite, isFavorite, onHover, onHoverEnd, stackIndex, isStackMode }) {
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef(null)

  const stackRot = isStackMode ? ((stackIndex % 7) - 3) * 0.35 : 0
  const stackOffset = isStackMode ? Math.abs((stackIndex % 5) - 2) * 3 : 0

  const liftY = hovered ? -14 : stackOffset
  const scale = hovered ? 1.045 : 1
  const shadow = hovered
    ? '0 18px 32px -8px rgba(0,0,0,0.7), 0 0 22px rgba(255,106,0,0.18), 0 0 0 1px rgba(255,106,0,0.35)'
    : active
      ? '0 0 14px rgba(255,106,0,0.15)'
      : isStackMode
        ? '0 4px 8px -2px rgba(0,0,0,0.35)'
        : 'none'

  const handleEnter = () => {
    setHovered(true)
    if (cardRef.current && onHover) {
      const rect = cardRef.current.getBoundingClientRect()
      onHover(mesh, rect)
    }
  }
  const handleLeave = () => {
    setHovered(false)
    if (onHoverEnd) onHoverEnd()
  }

  return (
    <div
      ref={cardRef}
      data-testid={`mesh-card-${mesh.id}`}
      onClick={() => onSelect(mesh)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        background: active ? 'rgba(255,106,0,0.06)' : hovered ? 'rgba(255,255,255,0.03)' : 'var(--card)',
        border: `1px solid ${active ? 'var(--accent)' : hovered ? 'rgba(255,106,0,0.4)' : 'var(--line)'}`,
        borderRadius: 3,
        cursor: 'pointer',
        transform: `translateY(${liftY}px) scale(${scale}) rotate(${hovered ? 0 : stackRot}deg)`,
        transformOrigin: 'center bottom',
        transition: hovered
          ? 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.15s, box-shadow 0.22s, background 0.15s'
          : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.15s, box-shadow 0.22s, background 0.15s',
        overflow: 'hidden',
        boxShadow: shadow,
        position: 'relative',
        zIndex: hovered ? 20 : (active ? 5 : 1),
        animation: 'fadeIn 0.2s ease both',
        aspectRatio: '1 / 1',
        display: 'flex',
        flexDirection: 'column',
        willChange: 'transform, box-shadow',
      }}
    >
      {/* Thumbnail — square */}
      <div style={{ flex: 1, background: '#0c0c0c', position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {active ? (
          <ThumbCanvas mesh={mesh} active={active} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
          }}>
            <MeshPatternSVG mesh={mesh} active={active} hovered={hovered} />
          </div>
        )}

        {/* Favorite */}
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(mesh.id) }}
          style={{
            position: 'absolute', top: 5, right: 5,
            width: 20, height: 20,
            background: 'rgba(10,10,10,0.85)',
            border: '1px solid var(--line)', borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isFavorite ? '#f9ca24' : 'var(--text-secondary)',
            fontSize: 10, cursor: 'pointer', zIndex: 5,
          }}
        >
          {isFavorite ? '★' : '☆'}
        </button>

        {/* Active dot */}
        {active && (
          <div style={{
            position: 'absolute', top: 5, left: 5,
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)',
            animation: 'pulse-accent 2s infinite', zIndex: 5,
          }} />
        )}
      </div>

      {/* Info bar */}
      <div style={{
        padding: '5px 7px',
        borderTop: '1px solid var(--line)',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--font-condensed)',
          fontSize: 11, fontWeight: 700,
          letterSpacing: '0.04em',
          color: active ? 'var(--accent)' : 'var(--text)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {mesh.name}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--font-condensed)', fontSize: 8, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {mesh.category}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 8,
            color: getDiffColor(mesh.printDiff),
            background: `${getDiffColor(mesh.printDiff)}18`,
            padding: '1px 3px', borderRadius: 1,
          }}>
            {mesh.printDiff}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Floating Hover Preview ────────────────────────────────────────
//
// Shows a live 3D preview + metadata for whichever card the cursor
// is currently on. Positioned to the LEFT of the card so it doesn't
// obscure the mesh library. Uses position: fixed so it escapes the
// scrollable grid overflow.

function HoverPreview({ mesh, cardRect }) {
  if (!mesh || !cardRect) return null

  const W = 260, H = 300
  // Position to the left of the card, vertically centered on it.
  const left = Math.max(8, cardRect.left - W - 12)
  const top = Math.min(
    Math.max(8, cardRect.top + cardRect.height / 2 - H / 2),
    window.innerHeight - H - 8
  )

  return (
    <div
      style={{
        position: 'fixed', left, top, width: W, height: H, zIndex: 500,
        background: 'linear-gradient(180deg, #171717 0%, #0d0d0d 100%)',
        border: '1px solid var(--line)',
        borderRadius: 4,
        boxShadow: '0 18px 42px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,106,0,0.15)',
        overflow: 'hidden',
        pointerEvents: 'none',
        animation: 'hp-in 0.14s ease-out both',
      }}
    >
      {/* 3D canvas */}
      <div style={{
        height: 190,
        background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 70%)',
        position: 'relative',
      }}>
        <Canvas
          camera={{ position: [0, 0.2, 3.2], fov: 34 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 6, 4]} intensity={2} />
          <directionalLight position={[-3, 2, -4]} intensity={0.5} color="#ff8844" />
          <pointLight position={[0, -2, 3]} intensity={0.35} color="#4488ff" />
          <ThumbMesh mesh={mesh} active={false} />
        </Canvas>
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          mixBlendMode: 'overlay',
        }} />
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{
          fontFamily: 'var(--font-condensed)', fontSize: 14, fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          color: 'var(--text)', marginBottom: 3,
        }}>
          {mesh.name}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{
            fontFamily: 'var(--font-condensed)', fontSize: 9,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--accent)',
          }}>{mesh.category}</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: getDiffColor(mesh.printDiff),
            background: `${getDiffColor(mesh.printDiff)}22`,
            padding: '2px 5px', borderRadius: 1,
          }}>
            {mesh.printDiff}
          </span>
        </div>
        {mesh.description && (
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 10, lineHeight: 1.4,
            color: 'var(--text-secondary)',
          }}>
            {mesh.description.length > 90 ? mesh.description.slice(0, 90) + '…' : mesh.description}
          </div>
        )}
      </div>

      <style>{`
        @keyframes hp-in {
          from { opacity: 0; transform: translateX(6px) }
          to { opacity: 1; transform: translateX(0) }
        }
      `}</style>
    </div>
  )
}

function getDiffColor(diff) {
  return { 'Very Easy': '#00b894', 'Easy': '#55efc4', 'Medium': '#fdcb6e', 'Hard': '#e17055', 'Expert': '#d63031' }[diff] || '#9A9A9A'
}

// ─── Main Library ──────────────────────────────────────────────────

export default function MeshLibrary() {
  const activeMesh = useStore((s) => s.activeMesh)
  const setActiveMesh = useStore((s) => s.setActiveMesh)
  const meshSearchQuery = useStore((s) => s.meshSearchQuery)
  const setMeshSearchQuery = useStore((s) => s.setMeshSearchQuery)
  const meshCategoryFilter = useStore((s) => s.meshCategoryFilter)
  const setMeshCategoryFilter = useStore((s) => s.setMeshCategoryFilter)
  const favorites = useStore((s) => s.favorites)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [hoverInfo, setHoverInfo] = useState(null) // { mesh, rect }

  const filtered = useMemo(() => {
    let result = MESHES
    if (meshCategoryFilter !== 'ALL') result = result.filter((m) => m.category === meshCategoryFilter)
    if (meshSearchQuery) result = result.filter((m) => m.name.toLowerCase().includes(meshSearchQuery.toLowerCase()))
    if (showFavoritesOnly) result = result.filter((m) => favorites.has(m.id))
    return result
  }, [meshCategoryFilter, meshSearchQuery, showFavoritesOnly, favorites])

  // Stack mode is enabled only in the ALL category (default view) —
  // that's where dozens of models pile up and the visual hierarchy
  // benefits most from a "card deck" metaphor.
  const isStackMode = meshCategoryFilter === 'ALL' && !meshSearchQuery && !showFavoritesOnly

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 2,
          padding: '6px 10px',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2">
            <circle cx="5" cy="5" r="4" />
            <line x1="8.5" y1="8.5" x2="11" y2="11" />
          </svg>
          <input
            type="text"
            placeholder="Buscar malhas..."
            value={meshSearchQuery}
            onChange={(e) => setMeshSearchQuery(e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: 12,
              fontFamily: 'var(--font-body)', flex: 1,
            }}
          />
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={{
              color: showFavoritesOnly ? '#f9ca24' : 'var(--text-secondary)',
              fontSize: 13, background: 'none', border: 'none', cursor: 'pointer',
            }}
            title="Favoritos"
          >
            {showFavoritesOnly ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div style={{
        display: 'flex', gap: 4, padding: '6px 10px',
        overflowX: 'auto', flexShrink: 0,
        borderBottom: '1px solid var(--line)',
      }}>
        {MESH_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setMeshCategoryFilter(cat)}
            style={{
              flexShrink: 0,
              padding: '4px 8px',
              background: meshCategoryFilter === cat ? 'var(--accent)' : 'var(--card)',
              border: `1px solid ${meshCategoryFilter === cat ? 'var(--accent)' : 'var(--line)'}`,
              borderRadius: 2,
              fontFamily: 'var(--font-condensed)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: meshCategoryFilter === cat ? '#000' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ padding: '4px 10px 2px', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
          {filtered.length} modelos
        </span>
      </div>

      {/* Grid — square cards with scrollbar */}
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: isStackMode ? '18px 12px 20px' : '4px 8px 12px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: isStackMode ? 10 : 6,
        alignContent: 'start',
      }}>
        {filtered.map((mesh, idx) => (
          <MeshCard
            key={mesh.id}
            mesh={mesh}
            active={activeMesh?.id === mesh.id}
            onSelect={setActiveMesh}
            onHover={(m, rect) => setHoverInfo({ mesh: m, rect })}
            onHoverEnd={() => setHoverInfo(null)}
            onFavorite={toggleFavorite}
            isFavorite={favorites.has(mesh.id)}
            stackIndex={idx}
            isStackMode={isStackMode}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{
            gridColumn: '1/-1', padding: '32px', textAlign: 'center',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-condensed)', fontSize: 13,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Nenhuma malha encontrada
          </div>
        )}
      </div>

      {/* Floating hover preview */}
      {hoverInfo && (
        <HoverPreview mesh={hoverInfo.mesh} cardRect={hoverInfo.rect} />
      )}
    </div>
  )
}

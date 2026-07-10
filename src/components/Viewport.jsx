import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { getPattern } from '../data/meshes'

// ─── Geometry builder ──────────────────────────────────────────────

export function buildLampshadeGeometry(lampshade, meshParams, activeMesh) {
  const { profile, height, topDiameter, bottomDiameter, bellCurve, segments } = lampshade

  const h = Math.max(0.5, height / 100)
  const rTop = Math.max(0.05, topDiameter / 200)
  const rBot = Math.max(0.05, bottomDiameter / 200)
  const segs = Math.max(32, Math.min(128, segments))

  // Build lathe profile points
  const points = []
  const steps = 40

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    let r

    switch (profile) {
      case 'cylinder':
        r = rBot
        break
      case 'drum':
        r = rTop + (rBot - rTop) * t
        break
      case 'bell': {
        const bell = Math.sin(t * Math.PI) * bellCurve
        r = rTop + (rBot - rTop) * t + bell * (rBot - rTop) * 0.3
        break
      }
      case 'flare': {
        const flare = Math.pow(t, 1.5)
        r = rTop + (rBot - rTop) * flare
        break
      }
      case 'globe': {
        const angle = t * Math.PI
        r = rBot * Math.sin(angle) * 0.6 + (rTop + (rBot - rTop) * t) * 0.4
        break
      }
      case 'empire': {
        r = rTop + (rBot - rTop) * Math.pow(t, 0.7)
        break
      }
      case 'torchiere': {
        r = rTop + (rBot - rTop) * (1 - Math.pow(1 - t, 2))
        break
      }
      case 'cone':
      default:
        r = rTop + (rBot - rTop) * t
    }

    r = Math.max(0.02, r)
    points.push(new THREE.Vector2(r, (1 - t) * h - h / 2))
  }

  const geo = new THREE.LatheGeometry(points, segs)

  // Apply mesh pattern deformation
  if (activeMesh) {
    const patternFn = getPattern(activeMesh.pattern)
    if (patternFn) {
      const pos = geo.attributes.position
      const { density, rotation, lineThickness, amplitude, frequency, noise, scale } = meshParams
      const rot = (rotation * Math.PI) / 180
      const amp = amplitude

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const z = pos.getZ(i)

        const angle = Math.atan2(z, x) + rot
        const radius = Math.sqrt(x * x + z * z)
        const heightNorm = (y + h / 2) / h

        let displacement = patternFn(angle, heightNorm, {
          density: density * frequency,
          rotation: rot,
          lineThickness: lineThickness * amp,
        })

        if (noise > 0) {
          displacement += (Math.sin(angle * 47 + y * 31) * Math.cos(angle * 13 - y * 29)) * noise * 0.015
        }

        displacement *= scale

        const newR = Math.max(0.01, radius + displacement)
        pos.setXYZ(i, (x / radius) * newR, y, (z / radius) * newR)
      }

      geo.computeVertexNormals()
    }
  }

  return geo
}

// ─── Lampshade component ───────────────────────────────────────────

function Lampshade({ lampshade, meshParams, activeMesh, viewMode, material, autoRotate }) {
  const meshRef = useRef()
  const groupRef = useRef()

  const geometry = useMemo(
    () => buildLampshadeGeometry(lampshade, meshParams, activeMesh),
    [lampshade, meshParams, activeMesh]
  )

  const mat = useMemo(() => {
    const color = material?.color || '#e8e0d8'
    const roughness = material?.roughness ?? 0.4
    const metalness = material?.metalness ?? 0.05

    if (viewMode === 'wireframe') {
      return new THREE.MeshBasicMaterial({ color: '#FF6A00', wireframe: true, transparent: true, opacity: 0.85 })
    }
    if (viewMode === 'technical') {
      return new THREE.MeshNormalMaterial({ flatShading: true })
    }
    if (viewMode === 'render') {
      return new THREE.MeshStandardMaterial({
        color, roughness: Math.max(0.1, roughness * 0.5), metalness: metalness * 1.5,
        side: THREE.DoubleSide, envMapIntensity: 1.5,
      })
    }
    return new THREE.MeshStandardMaterial({ color, roughness, metalness, side: THREE.DoubleSide })
  }, [viewMode, material])

  useFrame(() => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.0015
    }
  })

  const h = lampshade.height / 100
  const connectorR = Math.max(0.05, lampshade.topDiameter / 200)

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} geometry={geometry} material={mat} />
      {/* Connector ring at top */}
      <mesh position={[0, h / 2 - 0.02, 0]}>
        <torusGeometry args={[connectorR, 0.018, 12, 48]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Inner light bulb glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#ffcc66" transparent opacity={0.7} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={1.5} color="#ffcc88" distance={3} decay={2} />
    </group>
  )
}

// ─── Scene ─────────────────────────────────────────────────────────

function Scene({ showGrid, viewMode }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 8, 4]} intensity={2} />
      <directionalLight position={[-4, 4, -4]} intensity={0.8} color="#ffeedd" />
      <directionalLight position={[0, -3, 5]} intensity={0.5} color="#aaddff" />

      {viewMode === 'render' && (
        <>
          <hemisphereLight args={['#fff4e0', '#202020', 0.6]} />
          <spotLight position={[5, 8, 5]} angle={0.3} penumbra={0.8} intensity={3} color="#ffffff" />
          <spotLight position={[-5, 5, -3]} angle={0.4} penumbra={0.5} intensity={1.5} color="#ff8844" />
        </>
      )}

      {showGrid && (
        <Grid
          args={[12, 12]}
          cellSize={0.15}
          cellThickness={0.5}
          cellColor="#1f1f1f"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#333333"
          fadeDistance={12}
          fadeStrength={1.5}
          position={[0, -1.6, 0]}
          infiniteGrid
        />
      )}

      <ContactShadows
        position={[0, -1.55, 0]}
        opacity={0.4}
        scale={6}
        blur={2.5}
        far={4}
        color="#000000"
      />
    </>
  )
}

// ─── FPS tracker ───────────────────────────────────────────────────

function FPSTracker() {
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const setStats = useStore((s) => s.setStats)

  useFrame(() => {
    frameCount.current++
    const now = performance.now()
    if (now - lastTime.current >= 1000) {
      setStats({ fps: frameCount.current })
      frameCount.current = 0
      lastTime.current = now
    }
  })

  return null
}

// ─── Main Viewport ─────────────────────────────────────────────────

export default function Viewport() {
  const lampshade = useStore((s) => s.lampshade)
  const meshParams = useStore((s) => s.meshParams)
  const activeMesh = useStore((s) => s.activeMesh)
  const viewMode = useStore((s) => s.viewMode)
  const showGrid = useStore((s) => s.showGrid)
  const orbitEnabled = useStore((s) => s.orbitEnabled)
  const autoRotate = useStore((s) => s.autoRotate)
  const material = useStore((s) => s.material)
  const setStats = useStore((s) => s.setStats)

  useEffect(() => {
    const h = lampshade.height
    const r = lampshade.bottomDiameter / 2
    const volume = Math.PI * r * r * h * 0.00006
    const weight = (volume * 1.24).toFixed(1)
    const polys = lampshade.segments * 80

    setStats({
      polygons: polys.toLocaleString(),
      faces: (polys * 2).toLocaleString(),
      printTime: `${Math.round((volume * 0.08) / 60)}h ${Math.round((volume * 0.08) % 60)}m`,
      weight: `${weight}g`,
      volume: `${volume.toFixed(0)}cm³`,
    })
  }, [lampshade, setStats])

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0a', position: 'relative' }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [2.5, 1.5, 3.5], fov: 42, near: 0.01, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color('#0a0a0a')
          scene.fog = new THREE.Fog('#0a0a0a', 8, 20)
        }}
      >
        <FPSTracker />
        <Scene showGrid={showGrid} viewMode={viewMode} />
        <Lampshade
          lampshade={lampshade}
          meshParams={meshParams}
          activeMesh={activeMesh}
          viewMode={viewMode}
          material={material}
          autoRotate={autoRotate}
        />
        <OrbitControls
          enabled={orbitEnabled}
          enableDamping
          dampingFactor={0.08}
          minDistance={1.5}
          maxDistance={10}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI - 0.1}
          makeDefault
        />
      </Canvas>

      <ViewportOverlay />
    </div>
  )
}

// ─── Overlay ───────────────────────────────────────────────────────

function ViewportOverlay() {
  const viewMode = useStore((s) => s.viewMode)
  const setViewMode = useStore((s) => s.setViewMode)
  const showGrid = useStore((s) => s.showGrid)
  const setShowGrid = useStore((s) => s.setShowGrid)
  const autoRotate = useStore((s) => s.autoRotate)
  const setAutoRotate = useStore((s) => s.setAutoRotate)
  const activeMesh = useStore((s) => s.activeMesh)

  return (
    <>
      {/* View mode selector */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        display: 'flex', gap: 2, background: 'rgba(10,10,10,0.9)',
        border: '1px solid #2A2A2A', borderRadius: 3, padding: '3px 4px',
        backdropFilter: 'blur(8px)',
      }}>
        {['solid', 'wireframe', 'render', 'technical'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              fontSize: 11, padding: '5px 12px',
              color: viewMode === mode ? '#FF6A00' : '#9A9A9A',
              background: viewMode === mode ? 'rgba(255,106,0,0.12)' : 'transparent',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              fontFamily: 'var(--font-condensed)', fontWeight: 700,
              border: 'none', borderRadius: 2, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Right controls */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        display: 'flex', gap: 6, alignItems: 'center',
      }}>
        <OverlayBtn active={autoRotate} onClick={() => setAutoRotate(!autoRotate)} title="Auto-rotate">
          <RotateIcon />
        </OverlayBtn>
        <OverlayBtn active={showGrid} onClick={() => setShowGrid(!showGrid)} title="Toggle grid">
          <GridIcon />
        </OverlayBtn>
      </div>

      {/* Active mesh badge */}
      {activeMesh && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          background: 'rgba(10,10,10,0.92)',
          border: '1px solid rgba(255,106,0,0.5)',
          borderRadius: 3, padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#FF6A00', boxShadow: '0 0 8px #FF6A00', flexShrink: 0,
          }} />
          <span style={{ fontFamily: 'var(--font-condensed)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#fff' }}>
            {activeMesh.name.toUpperCase()}
          </span>
          <span style={{ fontSize: 10, color: '#9A9A9A', fontFamily: 'var(--font-condensed)', letterSpacing: '0.06em' }}>
            {activeMesh.category.toUpperCase()}
          </span>
        </div>
      )}

      {/* Coordinate indicator */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        color: '#3a3a3a', fontFamily: 'var(--font-mono)',
        fontSize: 10, letterSpacing: '0.06em', userSelect: 'none',
      }}>
        X · Y · Z
      </div>
    </>
  )
}

function OverlayBtn({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'rgba(10,10,10,0.9)',
        border: `1px solid ${active ? 'rgba(255,106,0,0.4)' : '#2A2A2A'}`,
        borderRadius: 3, width: 34, height: 34,
        color: active ? '#FF6A00' : '#9A9A9A',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)', transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="0" y1="4.67" x2="14" y2="4.67" />
      <line x1="0" y1="9.33" x2="14" y2="9.33" />
      <line x1="4.67" y1="0" x2="4.67" y2="14" />
      <line x1="9.33" y1="0" x2="9.33" y2="14" />
    </svg>
  )
}

function RotateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M 2 7 A 5 5 0 1 1 7 12" />
      <path d="M 2 7 L 2 4 L 5 7" />
    </svg>
  )
}

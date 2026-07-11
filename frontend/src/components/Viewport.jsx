import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { buildBottomCapGeometry } from '../data/bottomCapPatterns'
import { buildLampshadeGeometry } from '../lib/lampshadeGeometry'

// mm helper (scene unit is 200mm)
const mm_local = (v) => v / 200

// ─── Lampshade component ───────────────────────────────────────────

function Lampshade({
  lampshade, meshParams, activeMesh, activeTexture, textureParams,
  viewMode, material, autoRotate,
  showHandle, bottomCap,
}) {
  const meshRef = useRef()
  const groupRef = useRef()

  const geometry = useMemo(
    () => buildLampshadeGeometry(lampshade, meshParams, activeMesh, activeTexture, textureParams),
    [lampshade, meshParams, activeMesh, activeTexture, textureParams]
  )

  const bottomCapGeo = useMemo(() => {
    if (!bottomCap.enabled) return null

    // ── MESH-CONFORMING FUNDO ─────────────────────────────────────
    // The fundo is a GEOMETRIC MOLD of the shade's actual deformed
    // bottom edge. We sample the outer wall at the exact bottom row
    // (y = -h/2) at the SAME angular resolution as the shade's
    // LatheGeometry (segs divisions). This guarantees:
    //   • fundo has 1 vertex per shade angular division
    //   • fundo edges = shade edges (same straight-line chords)
    //   • ZERO gap: fundo rim shares vertices with shade rim
    //   • every mesh model gets a UNIQUE fundo contour reflecting
    //     its own displacement pattern
    const hSU = Math.max(0.5, lampshade.height / 100)
    const bottomY = -hSU / 2
    const bandEps = Math.max(0.002, hSU / 60 * 0.35)
    const segs = Math.max(32, Math.min(160, lampshade.segments))
    const wallSU = Math.max(0.004, lampshade.wallThickness / 100)
    const pos = geometry.attributes.position

    // Per-vertex sampling at shade's own angular resolution.
    // Init to -1 to detect empty slots.
    const N = segs
    const radiusAtAngle = new Float32Array(N)
    for (let i = 0; i < N; i++) radiusAtAngle[i] = -1

    // Bucket vertices to exactly the segs-th angular grid.
    // Because LatheGeometry emits segs+1 rings (last duplicates first)
    // at phi = k * 2π/segs, our sampling grid matches perfectly.
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      if (y >= bottomY - bandEps && y <= bottomY + bandEps) {
        const x = pos.getX(i), z = pos.getZ(i)
        const r = Math.hypot(x, z)
        let a = Math.atan2(z, x)
        if (a < 0) a += Math.PI * 2
        // Snap to nearest of N grid angles
        const idx = Math.round((a / (Math.PI * 2)) * N) % N
        // Take MAX so outer-wall vertex wins over inner-shell-cap
        if (r > radiusAtAngle[idx]) radiusAtAngle[idx] = r
      }
    }

    // Ensure every angular slot has a value (LatheGeometry rounding
    // may occasionally leave a slot empty).
    let anyR = 0
    for (let i = 0; i < N; i++) if (radiusAtAngle[i] > anyR) anyR = radiusAtAngle[i]
    if (anyR < 0.02) {
      const rBotSU = Math.max(0.05, lampshade.bottomDiameter / 200)
      for (let i = 0; i < N; i++) radiusAtAngle[i] = rBotSU
      anyR = rBotSU
    } else {
      for (let i = 0; i < N; i++) {
        if (radiusAtAngle[i] < 0) {
          // Linear-interp between nearest known neighbours
          let li = -1, ri = -1, ld = 0, rd = 0
          for (let s = 1; s <= N; s++) {
            const p = (i - s + N) % N
            if (radiusAtAngle[p] >= 0) { li = p; ld = s; break }
          }
          for (let s = 1; s <= N; s++) {
            const p = (i + s) % N
            if (radiusAtAngle[p] >= 0) { ri = p; rd = s; break }
          }
          if (li >= 0 && ri >= 0) {
            const total = ld + rd
            radiusAtAngle[i] = (radiusAtAngle[li] * rd + radiusAtAngle[ri] * ld) / total
          } else if (li >= 0) radiusAtAngle[i] = radiusAtAngle[li]
          else if (ri >= 0) radiusAtAngle[i] = radiusAtAngle[ri]
          else radiusAtAngle[i] = anyR
        }
      }
    }

    // Detect the auto-align contour reference (before any inset)
    const contourForAlign = radiusAtAngle

    // ── OUTER BOUNDARY = EXACT SHADE CONTOUR ──────────────────────
    // Use the sampled contour DIRECTLY, matching the shade's own
    // vertices. No smoothing (would round off peaks), no wall
    // subtraction (would leave a visible ring gap), no z-fighting
    // inset (fundo bottom face is above shade shell annular ring at
    // y=-h/2, so surfaces don't co-plane).
    const outerBoundary = Array.from(radiusAtAngle)
    let outerMax = 0
    for (let i = 0; i < N; i++) if (outerBoundary[i] > outerMax) outerMax = outerBoundary[i]

    // ── AUTO-ALIGN SUPPORTS WITH PATTERN PEAKS ────────────────────
    const nSup = Math.max(2, Math.min(4, bottomCap.supports))
    let autoOffset = 0
    if (bottomCap.autoAlign !== false) {
      const sectorAng = N / nSup
      let bestRot = 0
      let bestSum = -Infinity
      for (let rot = 0; rot < Math.floor(sectorAng); rot++) {
        let sum = 0
        for (let s = 0; s < nSup; s++) {
          const idx = Math.floor(rot + s * sectorAng) % N
          sum += contourForAlign[idx]
        }
        if (sum > bestSum) {
          bestSum = sum
          bestRot = rot
        }
      }
      autoOffset = (bestRot / N) * Math.PI * 2
    }
    const manualOffset = 0 // rotationY is applied as a mesh transform (rigid body) below
    const supportOffset = autoOffset + manualOffset

    return buildBottomCapGeometry({
      outerDiameter: outerMax * 2 * 100,
      outerBoundary,
      supportOffset,
      holeDiameter: bottomCap.holeDiameter,
      thickness: bottomCap.thickness,
      supports: bottomCap.supports,
      supportWidthMm: bottomCap.supportWidth || 10,
      ventedArea: bottomCap.ventedArea,
      model: bottomCap.model,
    })
  }, [bottomCap, lampshade, geometry, meshParams, activeMesh])

  const smoothing = lampshade.smoothing ?? 1
  const flatShading = smoothing < 0.5

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
        flatShading,
      })
    }
    return new THREE.MeshStandardMaterial({ color, roughness, metalness, side: THREE.DoubleSide, flatShading })
  }, [viewMode, material, flatShading])

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

      {/* Handle (argola) - conditional */}
      {showHandle && (
        <group position={[0, h / 2, 0]}>
          {/* Top ring / collar */}
          <mesh position={[0, 0.005, 0]}>
            <torusGeometry args={[connectorR, 0.012, 12, 48]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Arc handle */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[connectorR * 1.1, 0.008, 8, 32, Math.PI]} />
            <meshStandardMaterial color="#2b2b2b" metalness={0.85} roughness={0.35} />
          </mesh>
        </group>
      )}

      {/* Bottom cap (Fundo da Cúpula) — INSIDE the shade → truly one piece.
          Bottom face of fundo aligns with shade's bottom edge (y=-h/2),
          top face is at y=-h/2 + thickness. Fundo's outer wall contacts
          the shade's inner wall for its full vertical extent.
          Manual transform (rotX/Y/Z + flips) applied as rigid-body
          mesh transform — emergency override when auto-align fails. */}
      {bottomCapGeo && (
        <mesh
          position={[0, -h / 2 + (bottomCap.thickness / 100), 0]}
          rotation={[
            ((bottomCap.rotationX || 0) * Math.PI) / 180,
            ((bottomCap.rotationY || 0) * Math.PI) / 180,
            ((bottomCap.rotationZ || 0) * Math.PI) / 180,
          ]}
          scale={[
            bottomCap.flipHorizontal ? -1 : 1,
            1,
            bottomCap.flipVertical ? -1 : 1,
          ]}
          geometry={bottomCapGeo}
          material={mat}
        />
      )}

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
  const showHandle = useStore((s) => s.showHandle)
  const bottomCap = useStore((s) => s.bottomCap)
  const activeTexture = useStore((s) => s.activeTexture)
  const textureParams = useStore((s) => s.textureParams)
  const setStats = useStore((s) => s.setStats)

  useEffect(() => {
    const h = lampshade.height
    const r = lampshade.bottomDiameter / 2
    const volume = Math.PI * r * r * h * 0.00006 * lampshade.wallThickness
    const weight = (volume * 1.24).toFixed(1)
    const polys = lampshade.segments * 120

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
          activeTexture={activeTexture}
          textureParams={textureParams}
          viewMode={viewMode}
          material={material}
          autoRotate={autoRotate}
          showHandle={showHandle}
          bottomCap={bottomCap}
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
      <div style={{
        position: 'absolute', top: 12, left: 12,
        display: 'flex', gap: 2, background: 'rgba(10,10,10,0.9)',
        border: '1px solid #2A2A2A', borderRadius: 3, padding: '3px 4px',
        backdropFilter: 'blur(8px)',
      }}>
        {['solid', 'wireframe', 'render', 'technical'].map((mode) => (
          <button
            key={mode}
            data-testid={`viewmode-${mode}`}
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

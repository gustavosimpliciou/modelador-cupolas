// ─────────────────────────────────────────────────────────────────
// Premium mesh library — 54 procedurally-generated relief patterns.
//
// Each pattern is a pure function:
//   fn(angle, heightNorm, params) → displacement (scene units)
//
// Displacement is added to the outer wall radius in lampshadeGeometry.js.
// Amplitude is intentionally kept in ~0.015..0.06 SU range (≈ 3–12 mm)
// so the fundo/bottom-cap auto-contour sampler keeps working perfectly.
//
// Design principles:
//  • Sharp, crisp features (power / step / floor shaping)
//  • Layered detail (base grid + accent)
//  • Height-modulated envelopes so patterns feel intentional
//  • Zero bitmap / UV / normal-maps → 100 % procedural, print-ready
// ─────────────────────────────────────────────────────────────────

export const MESH_CATEGORIES = [
  'ALL',
  'Diamond', 'Hexagonal', 'Voronoi', 'Spiral',
  'Vertical', 'Organic', 'Luxury', 'Minimal', 'Geometric',
  'Nature', 'Weave', 'Architectural',
]

const baseParams = (overrides = {}) => ({
  density: 1.0,
  rotation: 0,
  lineThickness: 1.0,
  ...overrides,
})

// ─── Helpers (shared math) ────────────────────────────────────────
const TWO_PI = Math.PI * 2
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const sat = (v) => clamp(v, 0, 1)
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}
const tri = (t) => 1 - Math.abs(((t % 1) + 1) % 1 * 2 - 1)      // 0..1 triangle wave
const sqr = (t) => (Math.sin(t) > 0 ? 1 : 0)                     // square wave
const punch = (v, k) => Math.sign(v) * Math.pow(Math.abs(v), k)
const hash11 = (n) => {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}
const hash22 = (x, y) => hash11(x * 127.1 + y * 311.7)
const vnoise = (x, y) => {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash22(xi, yi), b = hash22(xi + 1, yi)
  const c = hash22(xi, yi + 1), d = hash22(xi + 1, yi + 1)
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v
}
const fbm = (x, y, oct = 4) => {
  let f = 0, amp = 0.5, freq = 1
  for (let i = 0; i < oct; i++) {
    f += amp * vnoise(x * freq, y * freq)
    freq *= 2; amp *= 0.55
  }
  return f
}
// Worley (cellular) — returns [F1, F2] distances to 1st and 2nd nearest points
const worley = (x, y, scale) => {
  const gx = Math.floor(x * scale), gy = Math.floor(y * scale)
  let f1 = 99, f2 = 99
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = gx + dx, cy = gy + dy
      const px = cx + hash22(cx, cy)
      const py = cy + hash22(cy + 5, cx + 7)
      const d = Math.hypot(x * scale - px, y * scale - py)
      if (d < f1) { f2 = f1; f1 = d }
      else if (d < f2) f2 = d
    }
  }
  return [f1, f2]
}
// Hexagonal cell center distance — returns [distToCenter, cellId]
const hexCell = (x, y) => {
  const s = 1.7320508  // sqrt(3)
  // Convert to axial coordinates (odd-r offset)
  const q = (x * 2 / 3)
  const r = (-x / 3 + y / s)
  const rq = Math.round(q), rr = Math.round(r)
  const rs = Math.round(-q - r)
  let dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs + q + r)
  let cq = rq, cr = rr
  if (dq > dr && dq > ds) cq = -rr - rs
  else if (dr > ds) cr = -rq - rs
  // World coords of the cell center
  const cx = cq * 3 / 2
  const cy = (cq / 2 + cr) * s
  return Math.hypot(x - cx, y - cy)
}

// ─── Pattern functions ────────────────────────────────────────────
// All amplitudes are tuned so they read at 250 mm / 200 mm profile at
// segments=64. lineThickness is the master amplitude multiplier.
// density warps the base frequency of every family.

const patterns = {
  // ═══════════════ DIAMOND family (crisp faceted cuts) ═══════════════
  diamondClassic: (a, h, p) => {
    const f = p.density * 7
    // Rotated square lattice = |sin(a·f) · sin(h·f·π + a·f)|
    const s = Math.sin(a * f) * Math.sin(h * f * Math.PI + a * f * 0.5)
    return punch(s, 0.7) * 0.05 * p.lineThickness
  },
  diamondCrisscross: (a, h, p) => {
    const f = p.density * 8
    // Two intersecting diagonal ridge families → deep valleys, sharp peaks
    const d1 = Math.abs(Math.sin(a * f + h * f * Math.PI))
    const d2 = Math.abs(Math.sin(a * f - h * f * Math.PI))
    return Math.max(d1, d2) * 0.045 * p.lineThickness
  },
  diamondStar: (a, h, p) => {
    const f = p.density * 4
    // 6-point star produced by cos(6θ) on each cell
    const cellU = tri(a * f), cellV = tri(h * f * 1.5)
    const cx = cellU - 0.5, cy = cellV - 0.5
    const r = Math.hypot(cx, cy) * 2
    const ang = Math.atan2(cy, cx)
    const star = 0.5 + 0.5 * Math.cos(ang * 6)
    return (1 - smoothstep(star * 0.55, star * 0.55 + 0.15, r)) * 0.05 * p.lineThickness
  },
  diamondFaceted: (a, h, p) => {
    const f = p.density * 5
    // Quantised sine ↦ flat facet steps (5 levels)
    const q = Math.floor(Math.sin(a * f + h * f * Math.PI * 0.4) * 3) / 3
    return (q + 1) * 0.5 * 0.05 * p.lineThickness
  },
  diamondLattice: (a, h, p) => {
    const f = p.density * 6
    // Lattice edges via distance to nearest gridline
    const u = tri(a * f) - 0.5, v = tri(h * f * 1.5) - 0.5
    const edge = 1 - Math.max(Math.abs(u), Math.abs(v)) * 2
    return smoothstep(0.6, 0.9, edge) * 0.055 * p.lineThickness
  },
  diamondPrism: (a, h, p) => {
    const f = p.density * 4
    // Prism = triangular wave in 2D → chiselled diamonds
    const t1 = tri(a * f + h * f * 0.5)
    const t2 = tri(a * f - h * f * 0.5)
    return Math.min(t1, t2) * 0.05 * p.lineThickness
  },

  // ═══════════════ HEXAGONAL family (real hex tessellation) ═══════════════
  hexHoneycomb: (a, h, p) => {
    const f = p.density * 3
    // Real hex-cell distance function — each cell has a smooth dome
    const d = hexCell(a * f * 1.6, h * f * 2.4)
    return sat(1 - d * 1.5) * 0.05 * p.lineThickness
  },
  hexStar: (a, h, p) => {
    const f = p.density * 2.6
    const d = hexCell(a * f * 1.6, h * f * 2.4)
    // Ring around each hex center → 6-point stars via cos(6·polar)
    const cellX = a * f * 1.6, cellY = h * f * 2.4
    const ang = Math.atan2(cellY - Math.round(cellY), cellX - Math.round(cellX))
    return sat(1 - d * 1.2) * (0.5 + 0.5 * Math.cos(ang * 6)) * 0.05 * p.lineThickness
  },
  hexTriangle: (a, h, p) => {
    const f = p.density * 3.2
    // Triangular tiling: three 120° reeds combined
    const s = 1.7320508
    const t1 = Math.sin(a * f)
    const t2 = Math.sin(a * f * -0.5 + h * f * s * 0.5)
    const t3 = Math.sin(a * f * -0.5 - h * f * s * 0.5)
    return punch(Math.max(t1, t2, t3), 0.6) * 0.045 * p.lineThickness
  },
  hexWeave: (a, h, p) => {
    const f = p.density * 3.5
    // Hex woven with vertical & horizontal accent
    const d = hexCell(a * f * 1.6, h * f * 2.4)
    const grid = Math.abs(Math.sin(a * f * 4)) + Math.abs(Math.sin(h * f * 5))
    return (sat(1 - d * 1.7) * 0.7 + sat(1 - grid) * 0.3) * 0.05 * p.lineThickness
  },

  // ═══════════════ VORONOI family (real cellular noise) ═══════════════
  voronoiOrganic: (a, h, p) => {
    const f = p.density * 2.6
    const [f1] = worley(a, h * 0.9, f)
    return sat(1 - f1 * 1.5) * 0.05 * p.lineThickness
  },
  voronoiCells: (a, h, p) => {
    const f = p.density * 3
    const [f1, f2] = worley(a, h * 0.9, f)
    // F2 - F1 highlights the cell BORDER as raised ridge
    return sat(f2 - f1) * 0.06 * p.lineThickness
  },
  voronoiCracked: (a, h, p) => {
    const f = p.density * 4
    const [f1, f2] = worley(a, h, f)
    const crack = smoothstep(0.02, 0.08, f2 - f1)
    return (1 - crack) * 0.045 * p.lineThickness
  },
  voronoiScale: (a, h, p) => {
    const f = p.density * 3.5
    const [f1] = worley(a * 1.3, h * 0.6, f)
    // Half-dome per cell → looks like overlapping fish scales
    return Math.pow(sat(1 - f1 * 1.3), 0.4) * 0.055 * p.lineThickness
  },

  // ═══════════════ SPIRAL family (helical) ═══════════════
  spiralHelix: (a, h, p) => {
    const f = p.density * 6
    // Single strong helical rib
    const t = a * 2 + h * f
    return punch(Math.sin(t), 0.5) * 0.05 * p.lineThickness
  },
  spiralDouble: (a, h, p) => {
    const f = p.density * 5
    const s1 = Math.sin(a * 3 + h * f)
    const s2 = Math.sin(a * 3 - h * f)
    return punch(Math.max(s1, s2), 0.5) * 0.05 * p.lineThickness
  },
  spiralRibbon: (a, h, p) => {
    const f = p.density * 4
    // Wide flat ribbon (step function of sine)
    const v = Math.sin(a * 2 + h * f)
    return smoothstep(-0.3, 0.4, v) * 0.055 * p.lineThickness
  },
  spiralTornado: (a, h, p) => {
    const f = p.density * 4
    // Frequency ramps with height → increasingly tight spiral
    const t = a * 4 + h * (f + h * 6)
    return punch(Math.sin(t), 0.6) * 0.05 * p.lineThickness
  },
  spiralDNA: (a, h, p) => {
    const f = p.density * 5.5
    const s1 = Math.sin(a * 4 + h * f)
    const s2 = Math.sin(a * 4 + h * f + Math.PI)
    // Diamond-shape rungs between the two strands
    const rung = Math.abs(Math.sin(h * f * 4))
    return (Math.max(s1, s2) * 0.55 + rung * 0.25) * 0.05 * p.lineThickness
  },

  // ═══════════════ VERTICAL family (fluted / reeded / grooved) ═══════════════
  verticalFlutes: (a, h, p) => {
    // Classic architectural flute — sharp semi-circular grooves
    const v = Math.abs(Math.sin(a * p.density * 12))
    return Math.pow(v, 0.4) * 0.045 * p.lineThickness
  },
  verticalReeds: (a, h, p) => {
    // Half-round positive reeds (only crests, no valleys)
    const v = Math.sin(a * p.density * 10)
    return Math.max(0, v) * Math.pow(Math.max(0, v), 0.3) * 0.05 * p.lineThickness
  },
  verticalStripes: (a, h, p) => {
    // Hard square-wave stripes
    const v = Math.sin(a * p.density * 14)
    return smoothstep(-0.1, 0.15, v) * 0.04 * p.lineThickness
  },
  verticalGrooves: (a, h, p) => {
    // Deep grooves (negative wells) with flat plateaus between
    const v = Math.sin(a * p.density * 8)
    return (v > -0.3 ? 0.045 : 0) * p.lineThickness
  },
  verticalWaves: (a, h, p) => {
    // Flutes modulated by big horizontal sine → basket-like undulation
    const v = Math.sin(a * p.density * 8) * (0.7 + 0.3 * Math.cos(h * 5))
    return Math.max(0, v) * 0.05 * p.lineThickness
  },

  // ═══════════════ ORGANIC family (natural flowing forms) ═══════════════
  organicRipples: (a, h, p) => {
    // Concentric ripples emanating from a virtual center
    const cx = Math.cos(h * Math.PI) * 0.5
    const cy = Math.sin(h * Math.PI) * 0.5
    const d = Math.hypot(a - cx, h * 2 - cy)
    return Math.sin(d * p.density * 8) * 0.03 * p.lineThickness + 0.02 * p.lineThickness
  },
  organicWaves: (a, h, p) => {
    // Long ocean waves rolling top→bottom
    const w = Math.sin(h * p.density * 5 + Math.sin(a * 2) * 0.8)
    return (w + 1) * 0.5 * 0.045 * p.lineThickness
  },
  organicBlobs: (a, h, p) => {
    // Big organic blobs via low-frequency fbm thresholded
    const n = fbm(a * p.density * 1.4, h * p.density * 2, 3)
    return smoothstep(0.4, 0.75, n) * 0.055 * p.lineThickness
  },
  organicCoral: (a, h, p) => {
    // Branch-like ridges via fbm + directional bias
    const n = fbm(a * p.density * 3 + h * 2, h * p.density * 3, 4)
    return Math.pow(sat(n * 1.3 - 0.15), 0.6) * 0.05 * p.lineThickness
  },
  organicPetals: (a, h, p) => {
    // Flower petals arranged in radial rows
    const rows = Math.floor(h * p.density * 3) + 1
    const petal = Math.abs(Math.sin(a * rows * 4))
    return Math.pow(petal, 0.5) * (0.5 + 0.5 * Math.sin(h * p.density * 6 * Math.PI)) * 0.05 * p.lineThickness
  },

  // ═══════════════ LUXURY family (ornate decoratives) ═══════════════
  luxuryBrocade: (a, h, p) => {
    const f = p.density * 4
    // Fabric brocade — interlocking small ovals
    const u = a * f + Math.sin(h * f * 2) * 0.3
    const v = h * f * 1.5
    const cell = Math.abs(Math.sin(u)) * Math.abs(Math.sin(v))
    return Math.pow(cell, 0.4) * 0.045 * p.lineThickness
  },
  luxuryDamask: (a, h, p) => {
    const f = p.density * 3
    // Damask = large diamond frame + small ornament inside
    const outer = Math.abs(Math.sin(a * f) + Math.sin(h * f * 2))
    const inner = Math.abs(Math.sin(a * f * 3) * Math.sin(h * f * 4))
    return (outer * 0.35 + inner * 0.3) * 0.06 * p.lineThickness
  },
  luxuryFloral: (a, h, p) => {
    const f = p.density * 2.5
    // Floral rosette — 6-petal per cell
    const u = tri(a * f * 1.5) - 0.5, v = tri(h * f * 1.5) - 0.5
    const r = Math.hypot(u, v) * 2
    const ang = Math.atan2(v, u)
    const petals = 0.5 + 0.5 * Math.cos(ang * 6 + Math.PI)
    return sat(1 - r + petals * 0.3) * 0.05 * p.lineThickness
  },
  luxuryMedallion: (a, h, p) => {
    const f = p.density * 1.8
    // Ring-inside-ring pattern
    const u = tri(a * f) - 0.5, v = tri(h * f * 1.5) - 0.5
    const r = Math.hypot(u, v) * 2
    return (sat(1 - Math.abs(r - 0.35) * 4) + sat(1 - Math.abs(r - 0.7) * 4) * 0.6) * 0.05 * p.lineThickness
  },
  luxuryArtDeco: (a, h, p) => {
    const f = p.density * 4
    // Art Deco fan — chevrons that expand towards top
    const angle = a * f + h * 2
    const fan = Math.abs(Math.sin(angle)) * (1 - Math.abs(h - 0.5) * 1.5)
    return Math.pow(sat(fan), 0.5) * 0.05 * p.lineThickness
  },

  // ═══════════════ MINIMAL family (subtle) ═══════════════
  minimalLines: (a, h, p) => {
    // Very fine vertical hairlines
    const v = Math.abs(Math.sin(a * p.density * 20))
    return Math.pow(v, 0.7) * 0.018 * p.lineThickness
  },
  minimalDots: (a, h, p) => {
    const f = p.density * 5
    // Bump lattice — small hemispheres on a grid
    const u = tri(a * f) - 0.5, v = tri(h * f * 1.5) - 0.5
    const r = Math.hypot(u, v) * 2
    return sat(1 - r * 3) * 0.03 * p.lineThickness
  },
  minimalRings: (a, h, p) => {
    // Horizontal rings equally spaced
    const v = Math.abs(Math.sin(h * p.density * 12 * Math.PI))
    return Math.pow(v, 0.5) * 0.025 * p.lineThickness
  },
  minimalGrid: (a, h, p) => {
    const f = p.density * 6
    const u = tri(a * f), v = tri(h * f * 1.5)
    const edge = Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5))
    return smoothstep(0.42, 0.5, edge) * 0.018 * p.lineThickness
  },

  // ═══════════════ GEOMETRIC family ═══════════════
  geoChevron: (a, h, p) => {
    // Sharp V-shaped chevrons pointing up
    const t = a * p.density * 4 + Math.abs(h - 0.5) * p.density * 8
    return punch(Math.sin(t), 0.55) * 0.045 * p.lineThickness
  },
  geoTriangles: (a, h, p) => {
    const f = p.density * 4
    // Triangular tiles via triwave clamp
    const u = tri(a * f + h * 0.5)
    return smoothstep(0.3, 0.7, u) * 0.045 * p.lineThickness
  },
  geoZigzag: (a, h, p) => {
    // Sawtooth wrap zigzag
    const f = p.density * 5
    const t = tri(a * f + h * f * 0.5)
    return Math.pow(t, 0.8) * 0.045 * p.lineThickness
  },
  geoPleats: (a, h, p) => {
    // Sharp accordion pleats fading top/bottom
    const v = Math.abs(Math.sin(a * p.density * 10))
    const env = Math.sin(h * Math.PI)
    return Math.pow(v, 0.35) * env * 0.055 * p.lineThickness
  },
  geoOrigami: (a, h, p) => {
    const f = p.density * 3
    // Quantised triangular facets
    const t = tri(a * f * 2 + h * f)
    return Math.floor(t * 3) / 3 * 0.05 * p.lineThickness
  },
  geoCrystalline: (a, h, p) => {
    const f = p.density * 3
    // Sharp crystalline shards using worley F2-F1 ridges
    const [f1, f2] = worley(a * 1.4, h, f)
    const shard = smoothstep(0.02, 0.15, f2 - f1)
    return shard * 0.05 * p.lineThickness
  },

  // ═══════════════ NEW premium families (10 completely new patterns) ═══════════════

  // NATURE — Cactus ribs (thick vertical semi-round columns)
  cactusRibs: (a, h, p) => {
    const v = Math.sin(a * p.density * 6)
    // Semi-round columns → strong positive relief
    const rib = Math.max(0, v)
    return Math.pow(rib, 0.35) * 0.06 * p.lineThickness
  },
  // NATURE — Fish scales (overlapping arc tiles)
  fishScale: (a, h, p) => {
    const rows = Math.floor(h * p.density * 8)
    const offset = (rows & 1) * 0.5
    const u = tri(a * p.density * 10 + offset) - 0.5
    const v = (h * p.density * 8) - rows - 0.5
    // Half-dome only if in upper part of cell (creates overlap)
    const inside = v < 0.15
    if (!inside) return 0
    const d = Math.hypot(u, v + 0.3)
    return sat(1 - d * 2.2) * 0.055 * p.lineThickness
  },
  // NATURE — Bamboo (segmented horizontal bands with joints)
  bamboo: (a, h, p) => {
    // Vertical striations
    const strip = Math.abs(Math.sin(a * p.density * 8))
    // Horizontal joints every ~0.15h
    const joint = Math.pow(Math.abs(Math.sin(h * p.density * 6 * Math.PI)), 6)
    return (Math.pow(strip, 0.4) * 0.7 + joint * 1.5) * 0.045 * p.lineThickness
  },
  // NATURE — Fractal bark (tree bark cracks)
  bark: (a, h, p) => {
    // Elongated vertical fbm creates crack-like features
    const n = fbm(a * p.density * 2, h * p.density * 6, 5)
    const crack = smoothstep(0.35, 0.6, n) * (1 - smoothstep(0.6, 0.85, n))
    return crack * 0.06 * p.lineThickness
  },
  // NATURE — Fossil / ammonite shell spiral concentric
  fossil: (a, h, p) => {
    // Logarithmic spiral
    const t = a + h * 6
    const rings = Math.abs(Math.sin(t * p.density * 3))
    return Math.pow(rings, 0.5) * 0.045 * p.lineThickness
  },

  // WEAVE — Basket weave (alternating over/under strips)
  basketWeave: (a, h, p) => {
    const f = p.density * 6
    const uCell = Math.floor(a * f * 2)
    const vCell = Math.floor(h * f * 3)
    const swap = (uCell + vCell) & 1
    // In one direction on odd cells, the other on even
    const strip = swap
      ? Math.abs(Math.sin(a * f * 2 * Math.PI))
      : Math.abs(Math.sin(h * f * 3 * Math.PI))
    return Math.pow(strip, 0.5) * 0.05 * p.lineThickness
  },
  // WEAVE — Rope twist (braided helical cords)
  rope: (a, h, p) => {
    const strands = 3
    let m = 0
    for (let k = 0; k < strands; k++) {
      const t = a * strands + h * p.density * 8 + (k * TWO_PI / strands)
      m = Math.max(m, Math.sin(t))
    }
    return Math.pow(sat(m), 0.4) * 0.055 * p.lineThickness
  },
  // WEAVE — Chainmail (interlocking rings)
  chainmail: (a, h, p) => {
    const f = p.density * 5
    // Two offset grids of rings
    const cx1 = tri(a * f) - 0.5, cy1 = tri(h * f * 1.5) - 0.5
    const cx2 = tri(a * f + 0.5) - 0.5, cy2 = tri(h * f * 1.5 + 0.5) - 0.5
    const r1 = Math.hypot(cx1, cy1) * 2
    const r2 = Math.hypot(cx2, cy2) * 2
    const ring1 = sat(1 - Math.abs(r1 - 0.6) * 6)
    const ring2 = sat(1 - Math.abs(r2 - 0.6) * 6)
    return Math.max(ring1, ring2) * 0.05 * p.lineThickness
  },

  // ARCHITECTURAL — Wave emboss (sculptural bold sine waves)
  bigWave: (a, h, p) => {
    // Large sculptural horizontal waves
    const w = Math.sin(h * p.density * 4 + Math.sin(a * 3) * 1.2)
    return (w + 1) * 0.5 * 0.06 * p.lineThickness
  },
  // ARCHITECTURAL — Interference (concentric standing wave rings)
  interference: (a, h, p) => {
    const src1 = Math.hypot(a - Math.PI * 0.8, h * 3 - 0.6)
    const src2 = Math.hypot(a - Math.PI * 1.2, h * 3 - 2.4)
    const wave = Math.sin(src1 * p.density * 6) + Math.sin(src2 * p.density * 6)
    return sat(wave * 0.5 + 0.5) * 0.045 * p.lineThickness
  },
  // GEOMETRIC — Celtic knot (interlaced bands)
  celticKnot: (a, h, p) => {
    const f = p.density * 3
    const b1 = Math.abs(Math.sin(a * f + h * f * Math.PI))
    const b2 = Math.abs(Math.sin(a * f - h * f * Math.PI))
    // Interlacing = XOR-ish via alternating dominance
    const under = Math.floor(a * f + h * f) & 1
    const band = under ? b1 : b2
    return smoothstep(0.55, 0.85, band) * 0.055 * p.lineThickness
  },
  // LUXURY — Peacock (radial eye feather)
  peacock: (a, h, p) => {
    // Rows of "eyes"
    const cols = 6 * p.density
    const rows = 4 * p.density
    const u = tri(a * cols) - 0.5
    const v = tri(h * rows) - 0.5
    const r = Math.hypot(u, v) * 2
    const eye = sat(1 - r * 1.5)
    // Iris ring
    const iris = sat(1 - Math.abs(r - 0.35) * 6) * 0.4
    return (eye * 0.7 + iris) * 0.05 * p.lineThickness
  },
  // MINIMAL — Corrugated (industrial fine ribbing)
  corrugated: (a, h, p) => {
    const v = Math.sin(a * p.density * 24)
    return (v + 1) * 0.5 * 0.025 * p.lineThickness
  },
}

// ─── Mesh definitions ─────────────────────────────────────────────
// (All ids preserved from previous version; NEW entries appended.)

export const MESHES = [
  // ── DIAMOND ──
  { id: 'diamond-classic', name: 'Diamond Classic', category: 'Diamond', pattern: 'diamondClassic',
    params: baseParams({ density: 1.2 }), printDiff: 'Medium', printTime: '4h 30m', lightTransp: 62, filament: '14g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Rede clássica de losangos com facetas nítidas.' },
  { id: 'diamond-crisscross', name: 'Crisscross Diamond', category: 'Diamond', pattern: 'diamondCrisscross',
    params: baseParams({ density: 1.0 }), printDiff: 'Medium', printTime: '5h 10m', lightTransp: 55, filament: '16g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Grade de diamantes cruzados com vales profundos.' },
  { id: 'diamond-star', name: 'Star Diamond', category: 'Diamond', pattern: 'diamondStar',
    params: baseParams({ density: 0.9 }), printDiff: 'Hard', printTime: '6h 20m', lightTransp: 48, filament: '19g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Estrelas de seis pontas encaixadas em rede.' },
  { id: 'diamond-faceted', name: 'Faceted Diamond', category: 'Diamond', pattern: 'diamondFaceted',
    params: baseParams({ density: 1.4 }), printDiff: 'Hard', printTime: '5h 45m', lightTransp: 50, filament: '18g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Cortes escalonados como uma joia lapidada.' },
  { id: 'diamond-lattice', name: 'Lattice Diamond', category: 'Diamond', pattern: 'diamondLattice',
    params: baseParams({ density: 1.2 }), printDiff: 'Expert', printTime: '7h 15m', lightTransp: 44, filament: '22g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Malha de arestas erguidas com células rebaixadas.' },
  { id: 'diamond-prism', name: 'Prism Diamond', category: 'Diamond', pattern: 'diamondPrism',
    params: baseParams({ density: 0.9 }), printDiff: 'Medium', printTime: '4h 50m', lightTransp: 58, filament: '15g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Prismas diagonais em relevo escultórico.' },

  // ── HEXAGONAL ──
  { id: 'hex-honeycomb', name: 'Honeycomb', category: 'Hexagonal', pattern: 'hexHoneycomb',
    params: baseParams({ density: 1.0 }), printDiff: 'Easy', printTime: '3h 40m', lightTransp: 68, filament: '12g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Colmeia real com células hexagonais em domo.' },
  { id: 'hex-star', name: 'Hex Star', category: 'Hexagonal', pattern: 'hexStar',
    params: baseParams({ density: 0.9 }), printDiff: 'Medium', printTime: '4h 20m', lightTransp: 60, filament: '14g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Estrelas de seis pontas sobre grade hexagonal.' },
  { id: 'hex-triangle', name: 'Hex Triangle', category: 'Hexagonal', pattern: 'hexTriangle',
    params: baseParams({ density: 1.1 }), printDiff: 'Medium', printTime: '4h 45m', lightTransp: 56, filament: '15g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Tessellação triangular de três direções em 120°.' },
  { id: 'hex-weave', name: 'Hex Weave', category: 'Hexagonal', pattern: 'hexWeave',
    params: baseParams({ density: 1.1 }), printDiff: 'Hard', printTime: '5h 30m', lightTransp: 52, filament: '17g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Hexágonos trançados com grade fina acentuando bordas.' },

  // ── VORONOI ──
  { id: 'voronoi-organic', name: 'Voronoi Organic', category: 'Voronoi', pattern: 'voronoiOrganic',
    params: baseParams({ density: 1.0 }), printDiff: 'Hard', printTime: '6h 00m', lightTransp: 54, filament: '18g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Células orgânicas Voronoi com centros suaves.' },
  { id: 'voronoi-cells', name: 'Voronoi Cells', category: 'Voronoi', pattern: 'voronoiCells',
    params: baseParams({ density: 1.0 }), printDiff: 'Expert', printTime: '7h 30m', lightTransp: 46, filament: '21g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Bordas Voronoi elevadas em cristas nítidas.' },
  { id: 'voronoi-cracked', name: 'Cracked Voronoi', category: 'Voronoi', pattern: 'voronoiCracked',
    params: baseParams({ density: 1.3 }), printDiff: 'Expert', printTime: '8h 00m', lightTransp: 40, filament: '24g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Superfície fissurada com trincas Voronoi finas.' },
  { id: 'voronoi-scale', name: 'Dragon Scale', category: 'Voronoi', pattern: 'voronoiScale',
    params: baseParams({ density: 1.2 }), printDiff: 'Hard', printTime: '6h 45m', lightTransp: 48, filament: '20g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Escamas Voronoi sobrepostas como pele de réptil.' },

  // ── SPIRAL ──
  { id: 'spiral-helix', name: 'Helix Spiral', category: 'Spiral', pattern: 'spiralHelix',
    params: baseParams({ density: 1.0 }), printDiff: 'Easy', printTime: '3h 50m', lightTransp: 64, filament: '13g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Costela helicoidal contínua subindo a peça.' },
  { id: 'spiral-double', name: 'Double Helix', category: 'Spiral', pattern: 'spiralDouble',
    params: baseParams({ density: 0.9 }), printDiff: 'Medium', printTime: '4h 30m', lightTransp: 58, filament: '15g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Duas hélices se cruzando em X.' },
  { id: 'spiral-ribbon', name: 'Ribbon Spiral', category: 'Spiral', pattern: 'spiralRibbon',
    params: baseParams({ density: 1.0 }), printDiff: 'Medium', printTime: '5h 00m', lightTransp: 55, filament: '16g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Fita larga em espiral com bordas suaves.' },
  { id: 'spiral-tornado', name: 'Tornado', category: 'Spiral', pattern: 'spiralTornado',
    params: baseParams({ density: 1.2 }), printDiff: 'Hard', printTime: '6h 10m', lightTransp: 50, filament: '19g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Espiral com frequência crescente em direção ao topo.' },
  { id: 'spiral-dna', name: 'DNA Spiral', category: 'Spiral', pattern: 'spiralDNA',
    params: baseParams({ density: 1.2 }), printDiff: 'Hard', printTime: '6h 30m', lightTransp: 48, filament: '20g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Dupla hélice com degraus estilo DNA.' },

  // ── VERTICAL ──
  { id: 'vertical-flutes', name: 'Fluted', category: 'Vertical', pattern: 'verticalFlutes',
    params: baseParams({ density: 1.0 }), printDiff: 'Very Easy', printTime: '2h 50m', lightTransp: 72, filament: '10g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Estrias arquitetônicas semi-redondas verticais.' },
  { id: 'vertical-reeds', name: 'Reeded', category: 'Vertical', pattern: 'verticalReeds',
    params: baseParams({ density: 0.9 }), printDiff: 'Very Easy', printTime: '3h 00m', lightTransp: 70, filament: '11g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Junco em relevo positivo com topo arredondado.' },
  { id: 'vertical-stripes', name: 'Striped', category: 'Vertical', pattern: 'verticalStripes',
    params: baseParams({ density: 1.2 }), printDiff: 'Easy', printTime: '3h 15m', lightTransp: 66, filament: '12g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Listras verticais com transição nítida.' },
  { id: 'vertical-grooves', name: 'Grooved', category: 'Vertical', pattern: 'verticalGrooves',
    params: baseParams({ density: 0.8 }), printDiff: 'Easy', printTime: '3h 30m', lightTransp: 64, filament: '13g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Sulcos profundos entre platôs planos.' },
  { id: 'vertical-waves', name: 'Wave Stripes', category: 'Vertical', pattern: 'verticalWaves',
    params: baseParams({ density: 1.0 }), printDiff: 'Medium', printTime: '4h 10m', lightTransp: 60, filament: '14g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Estrias verticais moduladas por ondas horizontais.' },

  // ── ORGANIC ──
  { id: 'organic-ripples', name: 'Ripples', category: 'Organic', pattern: 'organicRipples',
    params: baseParams({ density: 1.0 }), printDiff: 'Medium', printTime: '4h 50m', lightTransp: 56, filament: '16g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Ondas concêntricas como gotas em água parada.' },
  { id: 'organic-waves', name: 'Ocean Waves', category: 'Organic', pattern: 'organicWaves',
    params: baseParams({ density: 0.9 }), printDiff: 'Medium', printTime: '5h 00m', lightTransp: 54, filament: '17g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Ondas do mar rolando lentamente na peça.' },
  { id: 'organic-blobs', name: 'Blob Organic', category: 'Organic', pattern: 'organicBlobs',
    params: baseParams({ density: 0.9 }), printDiff: 'Hard', printTime: '6h 00m', lightTransp: 50, filament: '18g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Manchas orgânicas irregulares em relevo pleno.' },
  { id: 'organic-coral', name: 'Coral', category: 'Organic', pattern: 'organicCoral',
    params: baseParams({ density: 1.1 }), printDiff: 'Expert', printTime: '7h 45m', lightTransp: 42, filament: '23g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Ramificações de coral em cristas irregulares.' },
  { id: 'organic-petals', name: 'Petals', category: 'Organic', pattern: 'organicPetals',
    params: baseParams({ density: 0.9 }), printDiff: 'Hard', printTime: '6h 20m', lightTransp: 48, filament: '19g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Fileiras de pétalas em relevo suave.' },

  // ── LUXURY ──
  { id: 'luxury-brocade', name: 'Brocade', category: 'Luxury', pattern: 'luxuryBrocade',
    params: baseParams({ density: 1.0, rotation: 30 }), printDiff: 'Hard', printTime: '6h 50m', lightTransp: 46, filament: '21g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Textura de brocado bordado, entrelaçamento fino.' },
  { id: 'luxury-damask', name: 'Damask', category: 'Luxury', pattern: 'luxuryDamask',
    params: baseParams({ density: 0.9 }), printDiff: 'Hard', printTime: '7h 00m', lightTransp: 44, filament: '22g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Damasco clássico com moldura em losango.' },
  { id: 'luxury-floral', name: 'Floral Luxury', category: 'Luxury', pattern: 'luxuryFloral',
    params: baseParams({ density: 0.9 }), printDiff: 'Expert', printTime: '8h 15m', lightTransp: 38, filament: '25g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Rosetas florais de seis pétalas em rede.' },
  { id: 'luxury-medallion', name: 'Medallion', category: 'Luxury', pattern: 'luxuryMedallion',
    params: baseParams({ density: 0.8 }), printDiff: 'Expert', printTime: '8h 30m', lightTransp: 36, filament: '26g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Medalhões com anéis concêntricos duplos.' },
  { id: 'luxury-artdeco', name: 'Art Deco', category: 'Luxury', pattern: 'luxuryArtDeco',
    params: baseParams({ density: 1.1 }), printDiff: 'Hard', printTime: '6h 40m', lightTransp: 48, filament: '20g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Leques Art Déco expandindo do centro.' },
  { id: 'luxury-peacock', name: 'Peacock', category: 'Luxury', pattern: 'peacock',
    params: baseParams({ density: 1.0 }), printDiff: 'Expert', printTime: '8h 45m', lightTransp: 40, filament: '25g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Olhos de pena de pavão dispostos em grade.' },

  // ── MINIMAL ──
  { id: 'minimal-lines', name: 'Fine Lines', category: 'Minimal', pattern: 'minimalLines',
    params: baseParams({ density: 1.0 }), printDiff: 'Very Easy', printTime: '2h 40m', lightTransp: 74, filament: '10g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Linhas ultra-finas verticais mal perceptíveis.' },
  { id: 'minimal-dots', name: 'Dot Grid', category: 'Minimal', pattern: 'minimalDots',
    params: baseParams({ density: 1.0 }), printDiff: 'Easy', printTime: '3h 20m', lightTransp: 68, filament: '12g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Grade regular de pontos hemisféricos.' },
  { id: 'minimal-rings', name: 'Rings', category: 'Minimal', pattern: 'minimalRings',
    params: baseParams({ density: 0.9 }), printDiff: 'Easy', printTime: '3h 10m', lightTransp: 70, filament: '11g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Anéis horizontais em intervalos regulares.' },
  { id: 'minimal-grid', name: 'Micro Grid', category: 'Minimal', pattern: 'minimalGrid',
    params: baseParams({ density: 1.0 }), printDiff: 'Easy', printTime: '3h 35m', lightTransp: 66, filament: '12g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Malha fina cruzada muito discreta.' },
  { id: 'minimal-corrugated', name: 'Corrugated', category: 'Minimal', pattern: 'corrugated',
    params: baseParams({ density: 1.0 }), printDiff: 'Very Easy', printTime: '2h 55m', lightTransp: 70, filament: '10g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Ondulado industrial fino, estilo aço corrugado.' },

  // ── GEOMETRIC ──
  { id: 'geo-chevron', name: 'Chevron', category: 'Geometric', pattern: 'geoChevron',
    params: baseParams({ density: 1.0 }), printDiff: 'Medium', printTime: '4h 40m', lightTransp: 58, filament: '15g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'V apontando para cima em bandas repetidas.' },
  { id: 'geo-triangles', name: 'Triangle Tile', category: 'Geometric', pattern: 'geoTriangles',
    params: baseParams({ density: 1.1 }), printDiff: 'Medium', printTime: '5h 05m', lightTransp: 54, filament: '16g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Tessellação triangular com facetas suaves.' },
  { id: 'geo-zigzag', name: 'Zigzag', category: 'Geometric', pattern: 'geoZigzag',
    params: baseParams({ density: 1.3 }), printDiff: 'Medium', printTime: '4h 55m', lightTransp: 56, filament: '15g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Ziguezague afiado envolvendo a peça.' },
  { id: 'geo-pleats', name: 'Pleats', category: 'Geometric', pattern: 'geoPleats',
    params: baseParams({ density: 1.0 }), printDiff: 'Easy', printTime: '3h 50m', lightTransp: 62, filament: '13g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Pregas sanfonadas que desvanecem topo e base.' },
  { id: 'geo-origami', name: 'Origami', category: 'Geometric', pattern: 'geoOrigami',
    params: baseParams({ density: 0.9 }), printDiff: 'Hard', printTime: '6h 15m', lightTransp: 50, filament: '19g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Facetas triangulares em degraus quantizados.' },
  { id: 'geo-crystalline', name: 'Crystalline', category: 'Geometric', pattern: 'geoCrystalline',
    params: baseParams({ density: 1.0 }), printDiff: 'Hard', printTime: '6h 00m', lightTransp: 52, filament: '18g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Cacos cristalinos com arestas Voronoi.' },
  { id: 'geo-celtic', name: 'Celtic Knot', category: 'Geometric', pattern: 'celticKnot',
    params: baseParams({ density: 1.0 }), printDiff: 'Hard', printTime: '6h 30m', lightTransp: 50, filament: '19g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Nó celta entrelaçado com bandas alternantes.' },

  // ═══════════════ NEW PREMIUM MODELS ═══════════════
  // NATURE
  { id: 'nature-cactus', name: 'Cactus Ribs', category: 'Nature', pattern: 'cactusRibs',
    params: baseParams({ density: 1.0 }), printDiff: 'Very Easy', printTime: '2h 45m', lightTransp: 72, filament: '10g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Costelas verticais robustas inspiradas em cactos.' },
  { id: 'nature-fishscale', name: 'Fish Scale', category: 'Nature', pattern: 'fishScale',
    params: baseParams({ density: 1.0 }), printDiff: 'Hard', printTime: '6h 40m', lightTransp: 50, filament: '19g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Escamas de peixe sobrepostas em fileiras defasadas.' },
  { id: 'nature-bamboo', name: 'Bamboo', category: 'Nature', pattern: 'bamboo',
    params: baseParams({ density: 1.0 }), printDiff: 'Easy', printTime: '3h 30m', lightTransp: 64, filament: '13g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Bambu com estrias verticais e nós horizontais.' },
  { id: 'nature-bark', name: 'Tree Bark', category: 'Nature', pattern: 'bark',
    params: baseParams({ density: 1.0 }), printDiff: 'Expert', printTime: '7h 50m', lightTransp: 40, filament: '24g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Casca de árvore com rachaduras fractais verticais.' },
  { id: 'nature-fossil', name: 'Ammonite Fossil', category: 'Nature', pattern: 'fossil',
    params: baseParams({ density: 1.0 }), printDiff: 'Medium', printTime: '4h 40m', lightTransp: 58, filament: '15g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Anéis logarítmicos como fóssil de amonita.' },

  // WEAVE
  { id: 'weave-basket', name: 'Basket Weave', category: 'Weave', pattern: 'basketWeave',
    params: baseParams({ density: 1.0 }), printDiff: 'Hard', printTime: '6h 15m', lightTransp: 48, filament: '19g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Trançado de cesta com tiras alternadas.' },
  { id: 'weave-rope', name: 'Rope Twist', category: 'Weave', pattern: 'rope',
    params: baseParams({ density: 1.0 }), printDiff: 'Medium', printTime: '4h 55m', lightTransp: 56, filament: '16g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Corda com três fios trançados em hélice.' },
  { id: 'weave-chainmail', name: 'Chainmail', category: 'Weave', pattern: 'chainmail',
    params: baseParams({ density: 1.1 }), printDiff: 'Expert', printTime: '8h 00m', lightTransp: 42, filament: '23g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Cota de malha com anéis entrelaçados.' },

  // ARCHITECTURAL
  { id: 'arch-bigwave', name: 'Big Wave', category: 'Architectural', pattern: 'bigWave',
    params: baseParams({ density: 0.8 }), printDiff: 'Medium', printTime: '4h 30m', lightTransp: 60, filament: '15g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Ondas esculturais amplas e ousadas.' },
  { id: 'arch-interference', name: 'Interference', category: 'Architectural', pattern: 'interference',
    params: baseParams({ density: 1.0 }), printDiff: 'Hard', printTime: '5h 45m', lightTransp: 54, filament: '18g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Ondas concêntricas interferentes de duas fontes.' },
]

export function getPattern(name) {
  return patterns[name] || null
}

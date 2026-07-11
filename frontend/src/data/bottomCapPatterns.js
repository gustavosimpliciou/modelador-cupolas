import * as THREE from 'three'

// ──────────────────────────────────────────────────────────────────
// BOTTOM CAP (Fundo da Cúpula) — SECTOR-BASED patterns
//
// Design: each pattern renders ONE LARGE cutout per sector between
// two adjacent supports (4 supports = 4 large vents). The result is
// a wheel with structural spokes and a central hub around the socket.
//
// Anatomy:
//   • rimR       — outer disc radius (=shade base inner radius)
//   • hubR       — hub ring outer radius (around socket)
//   • rSocket    — socket hole radius
//   • supports   — number of radial arms (2/3/4)
//   • ventedArea — controls how much space each vent takes inside sector
//
// The 6 pattern shapes are large primitives per sector:
//   01 Triângulos → pie-slice with pointed inner tip (curved outer edge)
//   02 Quadrados  → rounded-corner trapezoid filling sector
//   03 Gotas      → teardrop pointing outward
//   04 Hexágonos  → regular hexagon inscribed in sector
//   05 Losangos   → diamond spanning radial & tangential axes
//   06 Arabesco   → quatrefoil (4-lobed clover)
// ──────────────────────────────────────────────────────────────────

// Scene unit convention: 1 SU = 100 mm (matches lampshade geometry).
const SCENE_PER_MM = 1 / 100
const mm = (v) => v * SCENE_PER_MM

// ─── Utilities ──────────────────────────────────────────────────

function polarPt(r, a) {
  return [Math.cos(a) * r, Math.sin(a) * r]
}

function polyPath(points) {
  const p = new THREE.Path()
  points.forEach(([x, y], i) => {
    if (i === 0) p.moveTo(x, y)
    else p.lineTo(x, y)
  })
  p.closePath()
  return p
}

// Sample an arc of a circle from angle a0 → a1 with N samples (short way)
function arcPts(cx, cy, r, a0, a1, samples) {
  const pts = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const a = a0 + (a1 - a0) * t
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return pts
}

// Build a rounded-corner polygon from a list of straight-line corners
// by chamfering each corner with a small arc of radius `corner`.
// Corners must be in CCW order.
function roundedPoly(corners, cornerR, arcSamples = 4) {
  const n = corners.length
  const pts = []
  for (let i = 0; i < n; i++) {
    const prev = corners[(i - 1 + n) % n]
    const cur = corners[i]
    const next = corners[(i + 1) % n]

    const v1x = cur[0] - prev[0], v1y = cur[1] - prev[1]
    const l1 = Math.hypot(v1x, v1y)
    const v2x = next[0] - cur[0], v2y = next[1] - cur[1]
    const l2 = Math.hypot(v2x, v2y)

    const r = Math.min(cornerR, l1 * 0.45, l2 * 0.45)

    // Points where the fillet arc starts and ends
    const startX = cur[0] - (v1x / l1) * r
    const startY = cur[1] - (v1y / l1) * r
    const endX = cur[0] + (v2x / l2) * r
    const endY = cur[1] + (v2y / l2) * r

    pts.push([startX, startY])
    // Insert an arc from (start) → (end) around (cur). Approximate as
    // a quadratic-bezier by sampling a mid point on the bisector.
    for (let s = 1; s < arcSamples; s++) {
      const t = s / arcSamples
      // Simple midpoint arc via lerp toward cur (a rough fillet — good enough)
      const bezT = t
      const one = 1 - bezT
      const x = one * one * startX + 2 * one * bezT * cur[0] + bezT * bezT * endX
      const y = one * one * startY + 2 * one * bezT * cur[1] + bezT * bezT * endY
      pts.push([x, y])
    }
    pts.push([endX, endY])
  }
  return pts
}

// ─── Pattern builders — one large vent per sector ───────────────
//
// Each builder receives: { rIn, rOut, aMid, aHalfSpan } where:
//   rIn        — sector's inner radius (top of hub + margin)
//   rOut       — sector's outer radius (rim − margin)
//   aMid       — middle angle of sector
//   aHalfSpan  — half of angular width available for vent (already
//                accounts for support width margin)
//
// Returned points array is CCW; polyPath will close it.

function sectorTriangle({ rIn, rOut, aMid, aHalfSpan }) {
  // Pie-slice with pointed inner tip and curved outer edge
  const r = Math.min(0.02, (rOut - rIn) * 0.06) // fillet
  const aStart = aMid - aHalfSpan
  const aEnd = aMid + aHalfSpan
  // Corner points (CCW starting from inner tip)
  // Inner tip: single point at rIn along aMid
  const tip = polarPt(rIn, aMid)
  const outerL = polarPt(rOut, aStart)
  const outerR = polarPt(rOut, aEnd)
  // We want the outer edge to follow the arc. Build:
  //   tip → outerL → (arc) → outerR → tip
  const pts = []
  pts.push(tip)
  pts.push(outerL)
  pts.push(...arcPts(0, 0, rOut, aStart, aEnd, 14).slice(1, -1))
  pts.push(outerR)
  return roundedPoly(pts, r, 3)
}

function sectorSquare({ rIn, rOut, aMid, aHalfSpan }) {
  // Rounded-corner trapezoid: 2 inner corners, 2 outer corners, following arcs
  const aStart = aMid - aHalfSpan
  const aEnd = aMid + aHalfSpan
  const cInL = polarPt(rIn, aStart)
  const cInR = polarPt(rIn, aEnd)
  const cOutR = polarPt(rOut, aEnd)
  const cOutL = polarPt(rOut, aStart)
  const cornerR = Math.min(rOut * 0.08, (rOut - rIn) * 0.18)

  // Build with inner and outer arcs
  const pts = []
  // From inner-left going through outer-left (radial line) then along outer arc
  // to outer-right, then radial line to inner-right, then inner arc back.
  pts.push(cInL)
  pts.push(cOutL)
  pts.push(...arcPts(0, 0, rOut, aStart, aEnd, 12).slice(1, -1))
  pts.push(cOutR)
  pts.push(cInR)
  pts.push(...arcPts(0, 0, rIn, aEnd, aStart, 8).slice(1, -1))
  return roundedPoly(pts, cornerR, 3)
}

function sectorDrop({ rIn, rOut, aMid, aHalfSpan }) {
  // Teardrop: rounded bulb at outer, pointed inner tip
  const pts = []
  const steps = 24
  const bulbR = (rOut - rIn) * 0.42  // radial thickness of bulb
  const bulbCenterR = rIn + (rOut - rIn) * 0.55
  const bulbCx = Math.cos(aMid) * bulbCenterR
  const bulbCy = Math.sin(aMid) * bulbCenterR
  // Ellipse aligned with radial direction: major axis radial, minor tangential
  const radialSemi = (rOut - rIn) * 0.42
  const tangSemi = Math.min(aHalfSpan * bulbCenterR * 0.85, radialSemi * 0.85)
  // Inner tip position
  const tip = polarPt(rIn, aMid)
  // Build shape: start at tip, curve out along one side of bulb, around the top,
  // and back along the other side to the tip.
  const tipStart = 0.15  // parameter along bulb ellipse where the tip curves join
  // We'll parameterize the bulb ellipse angle θ ∈ [inner-join, 2π-inner-join]
  const joinAngle = Math.PI * 0.7  // 126° opening at inner side of bulb → tip
  pts.push(tip)
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const th = joinAngle + t * (2 * Math.PI - 2 * joinAngle)
    // Ellipse local: x radial, y tangential
    const lx = -Math.cos(th) * radialSemi  // negative so inner-side of bulb faces tip
    const ly = Math.sin(th) * tangSemi
    // Rotate to aMid direction
    const c = Math.cos(aMid), s = Math.sin(aMid)
    pts.push([bulbCx + lx * c - ly * s, bulbCy + lx * s + ly * c])
  }
  return roundedPoly(pts, (rOut - rIn) * 0.04, 2)
}

function sectorHex({ rIn, rOut, aMid, aHalfSpan }) {
  // Regular hexagon centered in sector
  const cx = Math.cos(aMid) * (rIn + rOut) / 2
  const cy = Math.sin(aMid) * (rIn + rOut) / 2
  // Hex radius: minimum of half-radial-span and half-tangential-span at center
  const midR = (rIn + rOut) / 2
  const maxR = Math.min((rOut - rIn) / 2, aHalfSpan * midR * 0.92)
  // Orient hex with a flat side facing radial center (rotate by aMid + 90°)
  const pts = []
  for (let i = 0; i < 6; i++) {
    const a = aMid + Math.PI / 2 + (i * Math.PI) / 3
    pts.push([cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR])
  }
  return roundedPoly(pts, maxR * 0.12, 3)
}

function sectorDiamond({ rIn, rOut, aMid, aHalfSpan }) {
  // Diamond with 4 vertices: inner, outer, left, right
  const midR = (rIn + rOut) / 2
  const cx = Math.cos(aMid) * midR
  const cy = Math.sin(aMid) * midR
  const halfRadial = (rOut - rIn) / 2
  const halfTang = aHalfSpan * midR * 0.9
  // Local coords: radial = along aMid, tangential = perpendicular
  const c = Math.cos(aMid), s = Math.sin(aMid)
  const rot = ([lx, ly]) => [cx + lx * c - ly * s, cy + lx * s + ly * c]
  const corners = [
    rot([halfRadial, 0]),   // outer
    rot([0, halfTang]),     // left
    rot([-halfRadial, 0]),  // inner
    rot([0, -halfTang]),    // right
  ]
  return roundedPoly(corners, Math.min(halfRadial, halfTang) * 0.22, 4)
}

function sectorArabesque({ rIn, rOut, aMid, aHalfSpan }) {
  // Elegant quatrefoil (4-lobed rosette) using a smooth parametric curve.
  // r(θ) = maxR · (0.55 + 0.45 · cos(4θ)²) gives 4 rounded lobes,
  // continuous everywhere → no discontinuities/blobs.
  const midR = (rIn + rOut) / 2
  const cx = Math.cos(aMid) * midR
  const cy = Math.sin(aMid) * midR
  const halfRadial = (rOut - rIn) / 2
  const halfTang = aHalfSpan * midR * 0.9
  const maxR = Math.min(halfRadial, halfTang)
  const pts = []
  const steps = 56
  const c = Math.cos(aMid), s = Math.sin(aMid)
  // Rotate by π/4 so lobes point toward radial center (nicer visual)
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const lobe = Math.cos(2 * t)
    const rr = maxR * (0.55 + 0.45 * lobe * lobe) // 0.55..1.00
    const lx = Math.cos(t + Math.PI / 4) * rr
    const ly = Math.sin(t + Math.PI / 4) * rr
    pts.push([cx + lx * c - ly * s, cy + lx * s + ly * c])
  }
  return roundedPoly(pts, maxR * 0.04, 2)
}

const SECTOR_BUILDERS = {
  triangles: sectorTriangle,
  squares: sectorSquare,
  drops: sectorDrop,
  hexagons: sectorHex,
  diamonds: sectorDiamond,
  arabesque: sectorArabesque,
}

// ─── Public API ─────────────────────────────────────────────────

export const BOTTOM_CAP_MODELS = [
  { id: 'triangles', name: 'Triângulos', desc: 'Grandes vazados triangulares' },
  { id: 'squares',   name: 'Quadrados',  desc: 'Cantos arredondados clean'    },
  { id: 'drops',     name: 'Gotas',      desc: 'Vazados orgânicos suaves'     },
  { id: 'hexagons',  name: 'Hexágonos',  desc: 'Colmeia — rigidez extra'      },
  { id: 'diamonds',  name: 'Losangos',   desc: 'Contemporâneo — muita luz'    },
  { id: 'arabesque', name: 'Arabesco',   desc: 'Quatrefoil — decorativo'      },
]

// ─── Full geometry builder ──────────────────────────────────────
//
// Builds the bottom-cap as a single ExtrudeGeometry whose Shape has:
//   • outer boundary (disc rim) at rOut
//   • socket hole in the center
//   • one large vent hole per sector between supports

export function buildBottomCapGeometry({
  outerDiameter = 200,   // mm — matches shade inner base
  outerBoundary = null,  // Optional: array of scene-unit radii sampled at
                         // N equally-spaced angles (starting at 0, CCW).
                         // If provided, overrides the circular outer edge
                         // → perfect match to any shade contour.
  supportOffset = 0,     // radians — rotation applied to vents+supports only.
                         // Rim stays glued to shade wall; internal pattern
                         // rotates to align with cupola mesh peaks.
  holeDiameter = 29,     // mm — socket hole
  thickness = 3,         // mm
  supports = 4,
  supportWidthMm = 10,
  ventedArea = 70,       // 40..80  — scales sector fill
  hubWidthMm = 12,       // width of central hub ring around socket
  model = 'triangles',
}) {
  const rOut = mm(outerDiameter / 2)
  const rSocket = mm(holeDiameter / 2 + 0.3) // + tolerance
  const rHub = rSocket + mm(hubWidthMm)      // outer edge of hub ring
  const rimWidth = mm(3)                     // minimum outer ring width
  const t = mm(thickness)

  // ── Base shape: outer boundary
  const shape = new THREE.Shape()
  if (outerBoundary && outerBoundary.length >= 8) {
    // Follow the sampled contour of the shade (radii in scene units, CCW)
    const N = outerBoundary.length
    for (let i = 0; i <= N; i++) {
      const idx = i % N
      const a = (idx / N) * Math.PI * 2
      const r = outerBoundary[idx]
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    shape.closePath()
  } else {
    // Plain circular disc
    const outerSteps = 128
    for (let i = 0; i <= outerSteps; i++) {
      const a = (i / outerSteps) * Math.PI * 2
      if (i === 0) shape.moveTo(Math.cos(a) * rOut, Math.sin(a) * rOut)
      else shape.lineTo(Math.cos(a) * rOut, Math.sin(a) * rOut)
    }
    shape.closePath()
  }

  // Central socket hole (CW winding)
  const socketHole = new THREE.Path()
  const skSteps = 48
  for (let i = 0; i <= skSteps; i++) {
    const a = -(i / skSteps) * Math.PI * 2
    if (i === 0) socketHole.moveTo(Math.cos(a) * rSocket, Math.sin(a) * rSocket)
    else socketHole.lineTo(Math.cos(a) * rSocket, Math.sin(a) * rSocket)
  }
  socketHole.closePath()
  shape.holes.push(socketHole)

  // ── Vent holes per sector
  //     Use the MIN radius of the outerBoundary as reference so vents never
  //     poke through the wall in "waves" (concave points).
  let refROut = rOut
  if (outerBoundary && outerBoundary.length >= 8) {
    refROut = Math.min(...outerBoundary)
  }
  const N = Math.max(2, Math.min(4, supports))
  const angPerSector = (2 * Math.PI) / N
  const meanR = (rHub + refROut) / 2
  const supportHalf = Math.atan2(mm(supportWidthMm) / 2, meanR)
  const angMargin = mm(2) / meanR
  const rMarginInner = mm(1.5)
  const rMarginOuter = Math.max(rimWidth, mm(2.5))
  const shrink = 1 - (100 - ventedArea) / 100 * 0.35
  const rIn = rHub + rMarginInner
  const rOutV = refROut - rMarginOuter
  const radialCenter = (rIn + rOutV) / 2
  const shrunkIn = radialCenter - (radialCenter - rIn) * shrink
  const shrunkOut = radialCenter + (rOutV - radialCenter) * shrink

  const builder = SECTOR_BUILDERS[model] || SECTOR_BUILDERS.triangles

  for (let i = 0; i < N; i++) {
    const aMid = i * angPerSector + angPerSector / 2 + supportOffset
    const aHalfSpan = angPerSector / 2 - supportHalf - angMargin
    if (aHalfSpan <= 0.05) continue
    const ptsCCW = builder({
      rIn: shrunkIn,
      rOut: shrunkOut,
      aMid,
      aHalfSpan,
    })
    const rev = new THREE.Path()
    for (let j = ptsCCW.length - 1; j >= 0; j--) {
      const [x, y] = ptsCCW[j]
      if (j === ptsCCW.length - 1) rev.moveTo(x, y)
      else rev.lineTo(x, y)
    }
    rev.closePath()
    shape.holes.push(rev)
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: t,
    bevelEnabled: false,
    curveSegments: 12,
    steps: 1,
  })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, -t, 0)
  geo.computeVertexNormals()
  return geo
}

// Each mesh has a unique `pattern` function (angle, heightNorm, params) => displacement
// These produce visually distinct surface deformations on the lampshade lathe geometry.

export const MESH_CATEGORIES = [
  'ALL', 'Diamond', 'Hexagonal', 'Voronoi', 'Spiral',
  'Vertical', 'Organic', 'Luxury', 'Minimal', 'Geometric',
]

const baseParams = (overrides = {}) => ({
  density: 1.0,
  rotation: 0,
  lineThickness: 1.0,
  ...overrides,
})

// ─── Pattern functions (each unique) ────────────────────────────────

const patterns = {
  // DIAMOND family — faceted geometric cuts
  diamondClassic: (a, h, p) => {
    const f = p.density * 8
    return Math.abs(Math.sin(a * f) * Math.sin(h * f * Math.PI)) * 0.05 * p.lineThickness
  },
  diamondCrisscross: (a, h, p) => {
    const f = p.density * 6
    return (Math.abs(Math.sin(a * f)) + Math.abs(Math.cos(a * f + h * f * Math.PI))) * 0.03 * p.lineThickness
  },
  diamondStar: (a, h, p) => {
    const f = p.density * 5
    const star = Math.abs(Math.sin(a * f * 2) * Math.cos(h * f * 3))
    return star * 0.045 * p.lineThickness
  },
  diamondFaceted: (a, h, p) => {
    const f = p.density * 4
    return Math.floor(Math.sin(a * f) * 3) / 3 * 0.04 * p.lineThickness
  },
  diamondLattice: (a, h, p) => {
    const f = p.density * 7
    const cell = Math.sin(a * f) * Math.sin(h * f * Math.PI * 2)
    return Math.sign(cell) * 0.035 * p.lineThickness
  },
  diamondPrism: (a, h, p) => {
    const f = p.density * 3
    return Math.abs(Math.sin(a * f + h * f * Math.PI * 2)) * 0.05 * p.lineThickness
  },

  // HEXAGONAL family — honeycomb-like structures
  hexHoneycomb: (a, h, p) => {
    const f = p.density * 4
    const u = a * f * 0.6
    const v = h * f * 0.6 * Math.PI
    return Math.abs(Math.cos(u) + Math.cos(v) - Math.cos(u + v)) * 0.025 * p.lineThickness
  },
  hexStar: (a, h, p) => {
    const f = p.density * 3
    const star = Math.abs(Math.cos(a * f * 6) * Math.sin(h * f * Math.PI))
    return star * 0.04 * p.lineThickness
  },
  hexTriangle: (a, h, p) => {
    const f = p.density * 5
    return Math.abs(Math.sin(a * f * 3) * Math.cos(h * f * 3)) * 0.035 * p.lineThickness
  },
  hexWeave: (a, h, p) => {
    const f = p.density * 6
    const weave = Math.sin(a * f) * Math.sin(h * f * Math.PI)
    return (weave > 0.3 ? 0.04 : 0) * p.lineThickness
  },

  // VORONOI family — organic cell-like patterns
  voronoiOrganic: (a, h, p) => {
    const f = p.density * 3
    return Math.sin(a * f * 1.3 + h * 8) * Math.cos(a * f * 0.7 - h * 6) * 0.04 * p.lineThickness
  },
  voronoiCells: (a, h, p) => {
    const f = p.density * 2.5
    const n = Math.sin(a * f * 2 + h * 10) * Math.cos(a * f * 1.5 - h * 7)
    return (n > 0.5 ? 0.05 : n * 0.02) * p.lineThickness
  },
  voronoiCracked: (a, h, p) => {
    const f = p.density * 4
    const crack = Math.sin(a * f * 3 + h * 15) + Math.cos(a * f * 2 - h * 12)
    return Math.abs(crack) * 0.02 * p.lineThickness
  },
  voronoiScale: (a, h, p) => {
    const f = p.density * 5
    return Math.abs(Math.sin(a * f + h * f * Math.PI * 2)) * 0.03 * p.lineThickness
  },

  // SPIRAL family — twisting helical patterns
  spiralHelix: (a, h, p) => {
    return Math.sin(a * 3 + h * p.density * 8) * 0.04 * p.lineThickness
  },
  spiralDouble: (a, h, p) => {
    return (Math.sin(a * 3 + h * p.density * 6) + Math.sin(a * 3 - h * p.density * 6)) * 0.025 * p.lineThickness
  },
  spiralRibbon: (a, h, p) => {
    const v = Math.sin(a * 2 + h * p.density * 10)
    return (v > 0 ? 0.05 : 0.01) * p.lineThickness
  },
  spiralTornado: (a, h, p) => {
    return Math.sin(a * 5 + h * p.density * 12 + h * Math.PI) * 0.035 * p.lineThickness
  },
  spiralDNA: (a, h, p) => {
    const s1 = Math.sin(a * 4 + h * p.density * 14)
    const s2 = Math.sin(a * 4 + h * p.density * 14 + Math.PI)
    return Math.max(s1, s2) * 0.03 * p.lineThickness
  },

  // VERTICAL family — fluted / reeded patterns
  verticalFlutes: (a, h, p) => {
    return Math.sin(a * p.density * 12) * 0.03 * p.lineThickness
  },
  verticalReeds: (a, h, p) => {
    const v = Math.sin(a * p.density * 10)
    return (v > 0 ? v : 0) * 0.04 * p.lineThickness
  },
  verticalStripes: (a, h, p) => {
    return Math.abs(Math.sin(a * p.density * 14)) * 0.025 * p.lineThickness
  },
  verticalGrooves: (a, h, p) => {
    const v = Math.sin(a * p.density * 8)
    return (v > 0.3 ? 0.04 : -0.01) * p.lineThickness
  },
  verticalWaves: (a, h, p) => {
    return Math.sin(a * p.density * 8) * Math.cos(h * 3) * 0.035 * p.lineThickness
  },

  // ORGANIC family — natural flowing forms
  organicRipples: (a, h, p) => {
    return Math.sin(a * p.density * 3 + h * 5) * Math.cos(a * 3 - h * 4) * 0.035 * p.lineThickness
  },
  organicWaves: (a, h, p) => {
    return Math.sin(h * p.density * 6 + a * 2) * 0.03 * p.lineThickness
  },
  organicBlobs: (a, h, p) => {
    const blob = Math.sin(a * p.density * 2 + h * 3) * Math.cos(a * 4 - h * 2)
    return Math.abs(blob) * 0.04 * p.lineThickness
  },
  organicCoral: (a, h, p) => {
    return (Math.sin(a * p.density * 5 + h * 8) + Math.cos(a * 3 - h * 6)) * 0.025 * p.lineThickness
  },
  organicPetals: (a, h, p) => {
    return Math.abs(Math.sin(a * p.density * 4) * Math.sin(h * p.density * 3 * Math.PI)) * 0.04 * p.lineThickness
  },

  // LUXURY family — ornate decorative patterns
  luxuryBrocade: (a, h, p) => {
    const f = p.density * 5
    return Math.sin(a * f + p.rotation) * Math.sin(h * f * 0.5 * Math.PI) * 0.03 * p.lineThickness
  },
  luxuryDamask: (a, h, p) => {
    const f = p.density * 4
    return Math.abs(Math.sin(a * f) * Math.cos(h * f * Math.PI)) * 0.035 * p.lineThickness
  },
  luxuryFloral: (a, h, p) => {
    const f = p.density * 3
    return Math.abs(Math.sin(a * f * 2) * Math.sin(h * f * 2 * Math.PI)) * 0.04 * p.lineThickness
  },
  luxuryMedallion: (a, h, p) => {
    const f = p.density * 2
    const dist = Math.sqrt(Math.sin(a * f) ** 2 + Math.sin(h * f * Math.PI) ** 2)
    return (1 - dist) * 0.04 * p.lineThickness
  },
  luxuryArtDeco: (a, h, p) => {
    const f = p.density * 3
    return Math.abs(Math.sin(a * f * 4) + Math.sin(h * f * 4 * Math.PI)) * 0.025 * p.lineThickness
  },

  // MINIMAL family — clean simple lines
  minimalLines: (a, h, p) => {
    return Math.sin(a * p.density * 4) * 0.015 * p.lineThickness
  },
  minimalDots: (a, h, p) => {
    const f = p.density * 6
    const dot = Math.sin(a * f) * Math.sin(h * f * Math.PI)
    return (dot > 0.7 ? 0.03 : 0) * p.lineThickness
  },
  minimalRings: (a, h, p) => {
    return Math.sin(h * p.density * 10 * Math.PI) * 0.02 * p.lineThickness
  },
  minimalGrid: (a, h, p) => {
    const f = p.density * 5
    return (Math.abs(Math.sin(a * f)) + Math.abs(Math.sin(h * f * Math.PI))) * 0.012 * p.lineThickness
  },

  // GEOMETRIC family — sharp mathematical patterns
  geoChevron: (a, h, p) => {
    const f = p.density * 4
    return Math.abs(Math.sin(a * f + h * f * Math.PI * 2)) * 0.04 * p.lineThickness
  },
  geoTriangles: (a, h, p) => {
    const f = p.density * 5
    return Math.abs(Math.sin(a * f) * Math.sin(h * f * Math.PI * 3)) * 0.035 * p.lineThickness
  },
  geoZigzag: (a, h, p) => {
    const f = p.density * 6
    const z = Math.sin(a * f) + Math.sin(h * f * Math.PI * 4)
    return Math.sign(z) * 0.025 * p.lineThickness
  },
  geoPleats: (a, h, p) => {
    const f = p.density * 8
    return Math.abs(Math.sin(a * f)) * Math.sin(h * Math.PI) * 0.04 * p.lineThickness
  },
  geoOrigami: (a, h, p) => {
    const f = p.density * 3
    return Math.floor(Math.sin(a * f * 2) * 2) / 2 * 0.04 * p.lineThickness
  },
  geoCrystalline: (a, h, p) => {
    const f = p.density * 4
    return Math.abs(Math.sin(a * f) + Math.cos(h * f * Math.PI * 2)) * 0.03 * p.lineThickness
  },
}

// ─── Mesh definitions ─────────────────────────────────────────────

export const MESHES = [
  // Diamond
  { id: 'diamond-classic', name: 'Diamond Classic', category: 'Diamond', pattern: 'diamondClassic',
    params: baseParams({ density: 1.2 }), printDiff: 'Medium', printTime: '4h 30m', lightTransp: 62, filament: '14g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Faceted diamond lattice with classic crisscross facets.' },
  { id: 'diamond-crisscross', name: 'Crisscross Diamond', category: 'Diamond', pattern: 'diamondCrisscross',
    params: baseParams({ density: 1.0 }), printDiff: 'Medium', printTime: '5h 10m', lightTransp: 55, filament: '16g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Overlapping diamond grid with deep valleys.' },
  { id: 'diamond-star', name: 'Star Diamond', category: 'Diamond', pattern: 'diamondStar',
    params: baseParams({ density: 0.8 }), printDiff: 'Hard', printTime: '6h 20m', lightTransp: 48, filament: '19g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Star-shaped diamond facets radiating vertically.' },
  { id: 'diamond-faceted', name: 'Faceted Diamond', category: 'Diamond', pattern: 'diamondFaceted',
    params: baseParams({ density: 1.5 }), printDiff: 'Hard', printTime: '5h 45m', lightTransp: 50, filament: '18g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Flat-stepped diamond facets with sharp ridges.' },
  { id: 'diamond-lattice', name: 'Lattice Diamond', category: 'Diamond', pattern: 'diamondLattice',
    params: baseParams({ density: 1.3 }), printDiff: 'Expert', printTime: '7h 15m', lightTransp: 44, filament: '22g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Inverted diamond cells with raised borders.' },
  { id: 'diamond-prism', name: 'Prism Diamond', category: 'Diamond', pattern: 'diamondPrism',
    params: baseParams({ density: 0.9 }), printDiff: 'Medium', printTime: '4h 50m', lightTransp: 58, filament: '15g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Diagonal prism cuts forming diamond shapes.' },

  // Hexagonal
  { id: 'hex-honeycomb', name: 'Honeycomb', category: 'Hexagonal', pattern: 'hexHoneycomb',
    params: baseParams({ density: 1.0 }), printDiff: 'Easy', printTime: '3h 40m', lightTransp: 68, filament: '12g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Classic honeycomb hexagonal cell pattern.' },
  { id: 'hex-star', name: 'Hex Star', category: 'Hexagonal', pattern: 'hexStar',
    params: baseParams({ density: 0.8 }), printDiff: 'Medium', printTime: '4h 20m', lightTransp: 60, filament: '14g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Six-pointed stars arranged in hex grid.' },
  { id: 'hex-triangle', name: 'Hex Triangle', category: 'Hexagonal', pattern: 'hexTriangle',
    params: baseParams({ density: 1.2 }), printDiff: 'Medium', printTime: '4h 45m', lightTransp: 56, filament: '15g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Triangular facets within hexagonal frames.' },
  { id: 'hex-weave', name: 'Hex Weave', category: 'Hexagonal', pattern: 'hexWeave',
    params: baseParams({ density: 1.1 }), printDiff: 'Hard', printTime: '5h 30m', lightTransp: 52, filament: '17g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Woven hexagonal pattern with raised edges.' },

  // Voronoi
  { id: 'voronoi-organic', name: 'Voronoi Organic', category: 'Voronoi', pattern: 'voronoiOrganic',
    params: baseParams({ density: 1.0 }), printDiff: 'Hard', printTime: '6h 00m', lightTransp: 54, filament: '18g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Organic Voronoi cells with smooth borders.' },
  { id: 'voronoi-cells', name: 'Voronoi Cells', category: 'Voronoi', pattern: 'voronoiCells',
    params: baseParams({ density: 0.9 }), printDiff: 'Expert', printTime: '7h 30m', lightTransp: 46, filament: '21g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Deep Voronoi cells with pronounced walls.' },
  { id: 'voronoi-cracked', name: 'Cracked Voronoi', category: 'Voronoi', pattern: 'voronoiCracked',
    params: baseParams({ density: 1.3 }), printDiff: 'Expert', printTime: '8h 00m', lightTransp: 40, filament: '24g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Cracked-earth texture with fine Voronoi fractures.' },
  { id: 'voronoi-scale', name: 'Dragon Scale', category: 'Voronoi', pattern: 'voronoiScale',
    params: baseParams({ density: 1.5 }), printDiff: 'Hard', printTime: '6h 45m', lightTransp: 48, filament: '20g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Overlapping scale-like Voronoi pattern.' },

  // Spiral
  { id: 'spiral-helix', name: 'Helix Spiral', category: 'Spiral', pattern: 'spiralHelix',
    params: baseParams({ density: 1.0 }), printDiff: 'Easy', printTime: '3h 50m', lightTransp: 64, filament: '13g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Single continuous helical groove spiraling upward.' },
  { id: 'spiral-double', name: 'Double Helix', category: 'Spiral', pattern: 'spiralDouble',
    params: baseParams({ density: 0.9 }), printDiff: 'Medium', printTime: '4h 30m', lightTransp: 58, filament: '15g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Two intertwining helical channels.' },
  { id: 'spiral-ribbon', name: 'Ribbon Spiral', category: 'Spiral', pattern: 'spiralRibbon',
    params: baseParams({ density: 1.1 }), printDiff: 'Medium', printTime: '5h 00m', lightTransp: 55, filament: '16g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Raised ribbon spiraling around the shade.' },
  { id: 'spiral-tornado', name: 'Tornado', category: 'Spiral', pattern: 'spiralTornado',
    params: baseParams({ density: 1.3 }), printDiff: 'Hard', printTime: '6h 10m', lightTransp: 50, filament: '19g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Aggressive twisting spiral with variable pitch.' },
  { id: 'spiral-dna', name: 'DNA Spiral', category: 'Spiral', pattern: 'spiralDNA',
    params: baseParams({ density: 1.4 }), printDiff: 'Hard', printTime: '6h 30m', lightTransp: 48, filament: '20g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Double-stranded DNA-like helical pattern.' },

  // Vertical
  { id: 'vertical-flutes', name: 'Fluted', category: 'Vertical', pattern: 'verticalFlutes',
    params: baseParams({ density: 1.0 }), printDiff: 'Very Easy', printTime: '2h 50m', lightTransp: 72, filament: '10g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Classic vertical flutes running the full height.' },
  { id: 'vertical-reeds', name: 'Reeded', category: 'Vertical', pattern: 'verticalReeds',
    params: baseParams({ density: 0.9 }), printDiff: 'Very Easy', printTime: '3h 00m', lightTransp: 70, filament: '11g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Raised reeds with rounded tops.' },
  { id: 'vertical-stripes', name: 'Striped', category: 'Vertical', pattern: 'verticalStripes',
    params: baseParams({ density: 1.2 }), printDiff: 'Easy', printTime: '3h 15m', lightTransp: 66, filament: '12g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Thin vertical stripes with sharp valleys.' },
  { id: 'vertical-grooves', name: 'Grooved', category: 'Vertical', pattern: 'verticalGrooves',
    params: baseParams({ density: 0.8 }), printDiff: 'Easy', printTime: '3h 30m', lightTransp: 64, filament: '13g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Deep grooves with flat tops between them.' },
  { id: 'vertical-waves', name: 'Wave Stripes', category: 'Vertical', pattern: 'verticalWaves',
    params: baseParams({ density: 1.0 }), printDiff: 'Medium', printTime: '4h 10m', lightTransp: 60, filament: '14g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Vertical flutes modulated by horizontal waves.' },

  // Organic
  { id: 'organic-ripples', name: 'Ripples', category: 'Organic', pattern: 'organicRipples',
    params: baseParams({ density: 1.0 }), printDiff: 'Medium', printTime: '4h 50m', lightTransp: 56, filament: '16g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Flowing ripple pattern like water surface.' },
  { id: 'organic-waves', name: 'Ocean Waves', category: 'Organic', pattern: 'organicWaves',
    params: baseParams({ density: 0.8 }), printDiff: 'Medium', printTime: '5h 00m', lightTransp: 54, filament: '17g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Gentle horizontal waves across the surface.' },
  { id: 'organic-blobs', name: 'Blob Organic', category: 'Organic', pattern: 'organicBlobs',
    params: baseParams({ density: 0.9 }), printDiff: 'Hard', printTime: '6h 00m', lightTransp: 50, filament: '18g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Amorphous blob shapes with smooth transitions.' },
  { id: 'organic-coral', name: 'Coral', category: 'Organic', pattern: 'organicCoral',
    params: baseParams({ density: 1.2 }), printDiff: 'Expert', printTime: '7h 45m', lightTransp: 42, filament: '23g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Coral reef-like branching texture.' },
  { id: 'organic-petals', name: 'Petals', category: 'Organic', pattern: 'organicPetals',
    params: baseParams({ density: 0.7 }), printDiff: 'Hard', printTime: '6h 20m', lightTransp: 48, filament: '19g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Flower petal shapes arranged in rows.' },

  // Luxury
  { id: 'luxury-brocade', name: 'Brocade', category: 'Luxury', pattern: 'luxuryBrocade',
    params: baseParams({ density: 1.0, rotation: 45 }), printDiff: 'Hard', printTime: '6h 50m', lightTransp: 46, filament: '21g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Rich brocade fabric-inspired relief pattern.' },
  { id: 'luxury-damask', name: 'Damask', category: 'Luxury', pattern: 'luxuryDamask',
    params: baseParams({ density: 0.9 }), printDiff: 'Hard', printTime: '7h 00m', lightTransp: 44, filament: '22g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Elegant damask wallpaper-style pattern.' },
  { id: 'luxury-floral', name: 'Floral Luxury', category: 'Luxury', pattern: 'luxuryFloral',
    params: baseParams({ density: 0.7 }), printDiff: 'Expert', printTime: '8h 15m', lightTransp: 38, filament: '25g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Ornate floral motifs in repeating bands.' },
  { id: 'luxury-medallion', name: 'Medallion', category: 'Luxury', pattern: 'luxuryMedallion',
    params: baseParams({ density: 0.6 }), printDiff: 'Expert', printTime: '8h 30m', lightTransp: 36, filament: '26g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Circular medallion centered pattern with radiating borders.' },
  { id: 'luxury-artdeco', name: 'Art Deco', category: 'Luxury', pattern: 'luxuryArtDeco',
    params: baseParams({ density: 1.1 }), printDiff: 'Hard', printTime: '6h 40m', lightTransp: 48, filament: '20g',
    vaseModeCompat: false, stdPrintCompat: true, description: '1920s Art Deco geometric fan pattern.' },

  // Minimal
  { id: 'minimal-lines', name: 'Fine Lines', category: 'Minimal', pattern: 'minimalLines',
    params: baseParams({ density: 1.0 }), printDiff: 'Very Easy', printTime: '2h 40m', lightTransp: 74, filament: '10g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Subtle vertical lines barely disturbing the surface.' },
  { id: 'minimal-dots', name: 'Dot Grid', category: 'Minimal', pattern: 'minimalDots',
    params: baseParams({ density: 1.0 }), printDiff: 'Easy', printTime: '3h 20m', lightTransp: 68, filament: '12g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Minimal dot grid pattern with sparse raised points.' },
  { id: 'minimal-rings', name: 'Rings', category: 'Minimal', pattern: 'minimalRings',
    params: baseParams({ density: 0.8 }), printDiff: 'Easy', printTime: '3h 10m', lightTransp: 70, filament: '11g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Horizontal rings at regular intervals.' },
  { id: 'minimal-grid', name: 'Micro Grid', category: 'Minimal', pattern: 'minimalGrid',
    params: baseParams({ density: 1.0 }), printDiff: 'Easy', printTime: '3h 35m', lightTransp: 66, filament: '12g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Fine crosshatch grid barely visible on surface.' },

  // Geometric
  { id: 'geo-chevron', name: 'Chevron', category: 'Geometric', pattern: 'geoChevron',
    params: baseParams({ density: 1.0 }), printDiff: 'Medium', printTime: '4h 40m', lightTransp: 58, filament: '15g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Chevron arrow pattern pointing upward.' },
  { id: 'geo-triangles', name: 'Triangle Wave', category: 'Geometric', pattern: 'geoTriangles',
    params: baseParams({ density: 1.1 }), printDiff: 'Medium', printTime: '5h 05m', lightTransp: 54, filament: '16g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Triangle wave pattern in vertical bands.' },
  { id: 'geo-zigzag', name: 'Zigzag', category: 'Geometric', pattern: 'geoZigzag',
    params: baseParams({ density: 1.3 }), printDiff: 'Medium', printTime: '4h 55m', lightTransp: 56, filament: '15g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Sharp zigzag ridges wrapping the shade.' },
  { id: 'geo-pleats', name: 'Pleats', category: 'Geometric', pattern: 'geoPleats',
    params: baseParams({ density: 1.0 }), printDiff: 'Easy', printTime: '3h 50m', lightTransp: 62, filament: '13g',
    vaseModeCompat: true, stdPrintCompat: true, description: 'Accordion pleats fading at top and bottom.' },
  { id: 'geo-origami', name: 'Origami', category: 'Geometric', pattern: 'geoOrigami',
    params: baseParams({ density: 0.9 }), printDiff: 'Hard', printTime: '6h 15m', lightTransp: 50, filament: '19g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Folded paper origami facets with sharp creases.' },
  { id: 'geo-crystalline', name: 'Crystalline', category: 'Geometric', pattern: 'geoCrystalline',
    params: baseParams({ density: 1.0 }), printDiff: 'Hard', printTime: '6h 00m', lightTransp: 52, filament: '18g',
    vaseModeCompat: false, stdPrintCompat: true, description: 'Crystal-like facets with angular reflections.' },
]

export function getPattern(name) {
  return patterns[name] || null
}

import { create } from 'zustand'

const LANG_KEY = 'nativos.language'
const initialLang = (() => {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_KEY) : null
    if (v === 'pt' || v === 'en' || v === 'es') return v
  } catch (e) { void e }
  return 'pt'
})()

export const useStore = create((set, get) => ({
  // ─── i18n ────────────────────────────────────────────────────────
  language: initialLang,
  setLanguage: (lang) => {
    try { localStorage.setItem(LANG_KEY, lang) } catch (e) { void e }
    set({ language: lang })
  },

  // ─── Lampshade geometry ──────────────────────────────────────────
  lampshade: {
    profile: 'cone',
    height: 250,
    topDiameter: 200,
    middleDiameter: 200,
    bottomDiameter: 200,
    wallThickness: 1.2,
    bellCurve: 0.5,
    segments: 64,
    smoothing: 1,
    flareAngle: 15,
    fitterType: 'E27',
  },

  setLampshade: (patch) =>
    set((s) => ({ lampshade: { ...s.lampshade, ...patch } })),

  // ─── Handle (argola) ─────────────────────────────────────────────
  showHandle: false,
  setShowHandle: (v) => set({ showHandle: v }),

  // ─── Bottom cap (Fundo da Cúpula) ────────────────────────────────
  bottomCap: {
    enabled: false,
    model: 'triangles',        // triangles | squares | drops | hexagons | diamonds | arabesque
    socketType: 'E27',         // E27 | E14 | custom
    holeDiameter: 29,          // mm
    thickness: 3,              // mm
    supports: 4,               // 2 | 3 | 4
    ventedArea: 70,            // %
    supportWidth: 10,          // mm
    // ── Bottom Alignment / Transform ──
    // Manual fine-tune of fundo orientation. Applied AS A THREE.JS
    // TRANSFORM on the fundo mesh only — the shade geometry is
    // untouched. rotationY is layered on TOP of the auto-align.
    rotationX: 0,              // 0-360° — flip base into any tilt
    rotationY: 0,              // 0-360° — spin around vertical axis
    rotationZ: 0,              // 0-360° — flip base into any tilt
    flipHorizontal: false,     // mirror across vertical plane
    flipVertical: true,        // mirror across horizontal plane (default ON)
    autoAlign: true,           // auto-detect cupola orientation and align fundo
  },

  setBottomCap: (patch) =>
    set((s) => ({ bottomCap: { ...s.bottomCap, ...patch } })),

  resetBottomTransform: () =>
    set((s) => ({ bottomCap: {
      ...s.bottomCap,
      rotationX: 0, rotationY: 0, rotationZ: 0,
      flipHorizontal: false, flipVertical: false,
    } })),

  // ─── Active mesh ──────────────────────────────────────────────────
  activeMesh: null,
  setActiveMesh: (mesh) => set({ activeMesh: mesh }),

  // ─── Active surface texture (emboss / baixo relevo) ───────────────
  activeTexture: null,
  setActiveTexture: (tex) =>
    set((s) => ({
      activeTexture: tex,
      textureParams: tex
        ? {
            intensity: tex.defaults.intensity,
            scale: tex.defaults.scale,
            rotation: 0,
            direction: tex.defaults.direction,
            repetition: tex.defaults.repetition,
            smooth: tex.defaults.smooth,
            offset: 0,
          }
        : s.textureParams,
    })),

  textureParams: {
    intensity: 0.8,     // mm (0..3)
    scale: 1.0,         // 0.2..3
    rotation: 0,        // 0..360°
    direction: 'vertical',
    repetition: 20,     // 2..120
    smooth: 0.5,        // 0..1
    offset: 0,          // 0..360°
  },
  setTextureParams: (patch) =>
    set((s) => ({ textureParams: { ...s.textureParams, ...patch } })),
  resetTextureParams: () =>
    set((s) => ({
      textureParams: s.activeTexture
        ? {
            intensity: s.activeTexture.defaults.intensity,
            scale: s.activeTexture.defaults.scale,
            rotation: 0,
            direction: s.activeTexture.defaults.direction,
            repetition: s.activeTexture.defaults.repetition,
            smooth: s.activeTexture.defaults.smooth,
            offset: 0,
          }
        : s.textureParams,
    })),

  // ─── Mesh params ──────────────────────────────────────────────────
  meshParams: {
    density: 1.0,
    rotation: 0,
    lineThickness: 1.2,
    amplitude: 1.5,
    frequency: 1.0,
    noise: 0,
    scale: 1.0,
    openingWidth: 5.0,
    depth: 1.0,
    tilt: 0,
    randomization: 0,
    symmetry: 1,
    gradient: 0,
    curvature: 0,
  },

  setMeshParams: (patch) =>
    set((s) => ({ meshParams: { ...s.meshParams, ...patch } })),

  resetMeshParams: () =>
    set({
      meshParams: {
        density: 1.0, rotation: 0, lineThickness: 1.2, amplitude: 1.5,
        frequency: 1.0, noise: 0, scale: 1.0, openingWidth: 5.0,
        depth: 1.0, tilt: 0, randomization: 0, symmetry: 1, gradient: 0, curvature: 0,
      },
    }),

  // ─── Viewport ─────────────────────────────────────────────────────
  viewMode: 'solid',
  setViewMode: (mode) => set({ viewMode: mode }),

  showGrid: true,
  setShowGrid: (v) => set({ showGrid: v }),

  orbitEnabled: true,
  setOrbitEnabled: (v) => set({ orbitEnabled: v }),

  autoRotate: true,
  setAutoRotate: (v) => set({ autoRotate: v }),

  // ─── Right panel ──────────────────────────────────────────────────
  rightPanel: 'meshes',
  setRightPanel: (tab) => set({ rightPanel: tab }),

  // ─── Mesh library ─────────────────────────────────────────────────
  meshSearchQuery: '',
  setMeshSearchQuery: (q) => set({ meshSearchQuery: q }),

  meshCategoryFilter: 'ALL',
  setMeshCategoryFilter: (c) => set({ meshCategoryFilter: c }),

  favorites: new Set(),
  toggleFavorite: (id) =>
    set((s) => {
      const favs = new Set(s.favorites)
      if (favs.has(id)) favs.delete(id)
      else favs.add(id)
      return { favorites: favs }
    }),

  // ─── Material ─────────────────────────────────────────────────────
  material: { id: 'pla', name: 'PLA', color: '#e8e0d8', roughness: 0.4, metalness: 0 },
  setMaterial: (mat) => set({ material: mat }),

  // ─── Stats ───────────────────────────────────────────────────────
  stats: {
    fps: 60,
    polygons: '0',
    faces: '0',
    printTime: '0h 0m',
    weight: '0g',
    volume: '0cm³',
  },
  setStats: (patch) => set((s) => ({ stats: { ...s.stats, ...patch } })),

  // ─── Export settings ──────────────────────────────────────────────
  exportFormat: 'STL',
  setExportFormat: (f) => set({ exportFormat: f }),

  exportQuality: 'standard',
  setExportQuality: (q) => set({ exportQuality: q }),

  // ─── Modifiers ────────────────────────────────────────────────────
  modifiers: {
    baseThickness: 2.0,
    topRing: true,
    bottomRing: false,
    ventilationHoles: 0,
    reinforcement: 0,
    threadInsert: 'none',
  },
  setModifiers: (patch) =>
    set((s) => ({ modifiers: { ...s.modifiers, ...patch } })),

  // ─── Menu ──────────────────────────────────────────────────────────
  openMenu: null,
  setOpenMenu: (m) => set({ openMenu: m }),
}))

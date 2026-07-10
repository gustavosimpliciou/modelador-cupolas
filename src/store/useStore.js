import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // ─── Lampshade geometry ──────────────────────────────────────────
  lampshade: {
    profile: 'cone',
    height: 250,
    topDiameter: 80,
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

  // ─── Active mesh ──────────────────────────────────────────────────
  activeMesh: null,
  setActiveMesh: (mesh) => set({ activeMesh: mesh }),

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

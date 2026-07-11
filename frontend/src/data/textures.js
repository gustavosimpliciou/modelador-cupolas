// ─────────────────────────────────────────────────────────────────
// Biblioteca de Texturas Paramétricas (baixo-relevo / emboss)
//
// Cada textura é uma função pura procedural:
//   fn(angle, heightNorm, params) -> displacement ∈ [0..1]
//
// O displacement é NORMALIZADO em [0..1] e depois multiplicado pela
// intensidade em mm (convertida para unidades de cena) em
// lampshadeGeometry.js. Assim a intensidade real é sempre em mm.
//
// Parâmetros passados por lampshadeGeometry.js:
//   scale      — multiplicador da frequência do padrão (pequeno/médio/grande)
//   repetition — nº de repetições ao redor da peça (angular)
//   rotationRad, offsetRad — rotação e deslocamento angular do padrão
//   direction  — 'vertical'|'horizontal'|'diagonal'|'radial'|'helicoidal'
//   smooth     — 0..1 suavização (0 = degraus duros, 1 = suave)
// ─────────────────────────────────────────────────────────────────

// Utilidade: aplica direção convertendo (a, h) → coord principal (u) e secundária (v)
function dirCoord(a, h, direction) {
  switch (direction) {
    case 'horizontal': return { u: h, v: a }
    case 'diagonal':   return { u: a + h * 2, v: a - h * 2 }
    case 'radial':     return { u: Math.hypot(a - Math.PI, h - 0.5) * 2, v: Math.atan2(h - 0.5, a - Math.PI) }
    case 'helicoidal': return { u: a + h * 4, v: h }
    case 'vertical':
    default:           return { u: a, v: h }
  }
}

// Pseudo-noise procedural (sem bitmap, matemático puro)
function pnoise2(x, y) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return s - Math.floor(s)
}
function smoothNoise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = pnoise2(xi, yi), b = pnoise2(xi + 1, yi)
  const c = pnoise2(xi, yi + 1), d = pnoise2(xi + 1, yi + 1)
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v
}
function fbm(x, y, oct = 4) {
  let f = 0, amp = 0.5, freq = 1
  for (let i = 0; i < oct; i++) {
    f += amp * smoothNoise2(x * freq, y * freq)
    freq *= 2; amp *= 0.5
  }
  return f
}

// Saturate em [0..1]
const sat = (v) => Math.max(0, Math.min(1, v))
// Onda triangular suavizável
const tri = (t) => 1 - Math.abs(((t % 1) + 1) % 1 * 2 - 1)

// ─── Definições das 10 texturas ────────────────────────────────────

const textures = {
  // 01 — LINHO: ranhuras verticais extremamente finas (tecido)
  linho: (a, h, p) => {
    const { u } = dirCoord(a, h, p.direction || 'vertical')
    const rep = (p.repetition || 60) * p.scale
    const w = Math.sin(u * rep + p.offsetRad + p.rotationRad)
    const soft = p.smooth ?? 0.6
    // Ranhura afinada: |sin|^k → picos estreitos
    const k = 1 + (1 - soft) * 3
    return sat(Math.pow(Math.abs(w), k))
  },

  // 02 — DIAMANTE 3D: facetas em baixo relevo, angular moderno
  diamante3d: (a, h, p) => {
    const { u, v } = dirCoord(a, h, p.direction || 'vertical')
    const rep = (p.repetition || 8) * p.scale
    const s = Math.sin(u * rep + p.offsetRad + p.rotationRad)
    const c = Math.cos(v * rep * Math.PI * 0.6)
    // Faceta absoluta produz ápices; potencia controla acuidade
    const soft = p.smooth ?? 0.4
    const k = 1 + (1 - soft) * 2
    return sat(Math.pow(Math.abs(s * c), k) + 0.15 * (1 - Math.abs(s + c) * 0.5))
  },

  // 03 — ONDULADO: ondas horizontais suaves, movimento contínuo
  ondulado: (a, h, p) => {
    const { u } = dirCoord(a, h, p.direction || 'horizontal')
    const rep = (p.repetition || 6) * p.scale
    const w = Math.sin(u * rep * Math.PI + p.offsetRad + p.rotationRad)
    // Ondas suaves com envelope quase senoidal (0..1)
    return sat((w + 1) * 0.5)
  },

  // 04 — ESPIRAL: ranhuras helicoidais envolvendo a peça
  espiral: (a, h, p) => {
    const rep = (p.repetition || 8) * p.scale
    // Combinação angular + vertical → helicoide
    const t = a * rep + h * rep * 3 + p.offsetRad + p.rotationRad
    const w = Math.sin(t)
    const soft = p.smooth ?? 0.5
    const k = 1 + (1 - soft) * 2
    return sat(Math.pow(Math.max(0, w), k))
  },

  // 05 — LINHAS FINAS: micro ranhuras paralelas, extremamente uniformes
  linhasFinas: (a, h, p) => {
    const { u } = dirCoord(a, h, p.direction || 'horizontal')
    const rep = (p.repetition || 80) * p.scale
    const w = Math.sin(u * rep + p.offsetRad + p.rotationRad)
    const soft = p.smooth ?? 0.3
    const k = 1 + (1 - soft) * 4
    return sat(Math.pow(Math.abs(w), k)) * 0.85
  },

  // 06 — FAVO DE MEL: hexágonos em baixo relevo (sem perfurações)
  favoDeMel: (a, h, p) => {
    const rep = (p.repetition || 10) * p.scale
    const ang = a + p.rotationRad + p.offsetRad
    // Grade hexagonal via 3 direções a 60°
    const s = Math.sin
    const g = Math.abs(s(ang * rep) + s((ang + Math.PI * 2 / 3) * rep + h * rep * 2))
            + Math.abs(s((ang - Math.PI * 2 / 3) * rep + h * rep * 2))
    const soft = p.smooth ?? 0.5
    // Suaviza para hex arredondado
    const v = 1 - Math.min(1, g * (0.3 + soft * 0.4))
    return sat(v)
  },

  // 07 — ORIGAMI: dobras geométricas, facetas triangulares
  origami: (a, h, p) => {
    const { u, v } = dirCoord(a, h, p.direction || 'diagonal')
    const rep = (p.repetition || 6) * p.scale
    // Triângulos formados por triwave em duas direções
    const t1 = tri(u * rep + p.rotationRad + p.offsetRad)
    const t2 = tri((v * rep) * 2 + p.rotationRad)
    // Combina: mínimo cria facetas dobradas
    return sat(1 - Math.min(t1, t2))
  },

  // 08 — MOSAICO: quadrados pequenos organizados
  mosaico: (a, h, p) => {
    const { u, v } = dirCoord(a, h, p.direction || 'vertical')
    const rep = (p.repetition || 24) * p.scale
    const ang = u + p.rotationRad + p.offsetRad
    // Grade regular: |cos| ganha crista nas bordas
    const gx = Math.abs(Math.cos(ang * rep * 0.5))
    const gy = Math.abs(Math.cos(v * rep * Math.PI * 0.4))
    // Rebaixa apenas as bordas → efeito de azulejo em relevo
    const edge = Math.min(gx, gy)
    const soft = p.smooth ?? 0.4
    const k = 1 + (1 - soft) * 3
    return sat(1 - Math.pow(edge, k))
  },

  // 09 — MADEIRA: veios orgânicos procedurais
  madeira: (a, h, p) => {
    const { u, v } = dirCoord(a, h, p.direction || 'vertical')
    const rep = (p.repetition || 3) * p.scale
    // Veios via seno perturbado por fbm
    const noise = fbm(u * rep * 2 + p.rotationRad, v * rep * 8, 4)
    const rings = Math.sin(u * rep * 6 + noise * 6 + p.offsetRad)
    const soft = p.smooth ?? 0.6
    const k = 1 + (1 - soft) * 3
    // Veios finos e escuros → picos estreitos
    return sat(0.15 + Math.pow(Math.abs(rings), k) * 0.85)
  },

  // 10 — CONCRETO: micro irregularidades suaves (fbm de baixa amplitude)
  concreto: (a, h, p) => {
    const rep = (p.repetition || 4) * p.scale
    const ang = a + p.rotationRad + p.offsetRad
    const n = fbm(ang * rep * 3, h * rep * 6, 3)
    // Sem excesso de ruído: comprime para 0..1 suave centrado em ~0.5
    return sat(0.35 + (n - 0.5) * 0.9)
  },
}

// ─── Metadata / definição das texturas ─────────────────────────────

export const TEXTURES = [
  { id: 'linho',         name: 'Linho',        pattern: 'linho',
    description: 'Ranhuras verticais extremamente finas — visual elegante e minimalista.',
    defaults: { intensity: 0.6, scale: 1.0, repetition: 60, direction: 'vertical',   smooth: 0.6 } },
  { id: 'diamante3d',    name: 'Diamante 3D',  pattern: 'diamante3d',
    description: 'Geometria facetada em baixo relevo, sofisticado e moderno.',
    defaults: { intensity: 1.4, scale: 1.0, repetition: 8,  direction: 'vertical',   smooth: 0.4 } },
  { id: 'ondulado',      name: 'Ondulado',     pattern: 'ondulado',
    description: 'Ondas suaves horizontais que transmitem movimento e leveza.',
    defaults: { intensity: 1.0, scale: 1.0, repetition: 6,  direction: 'horizontal', smooth: 0.8 } },
  { id: 'espiral',       name: 'Espiral',      pattern: 'espiral',
    description: 'Ranhuras helicoidais que envolvem a cúpula em torção elegante.',
    defaults: { intensity: 1.0, scale: 1.0, repetition: 8,  direction: 'helicoidal', smooth: 0.5 } },
  { id: 'linhasFinas',   name: 'Linhas Finas', pattern: 'linhasFinas',
    description: 'Micro ranhuras paralelas uniformes com visual premium e minimalista.',
    defaults: { intensity: 0.4, scale: 1.0, repetition: 80, direction: 'horizontal', smooth: 0.3 } },
  { id: 'favoDeMel',     name: 'Favo de Mel',  pattern: 'favoDeMel',
    description: 'Hexágonos em baixo relevo, natureza e modernidade sem perfurações.',
    defaults: { intensity: 1.2, scale: 1.0, repetition: 10, direction: 'vertical',   smooth: 0.5 } },
  { id: 'origami',       name: 'Origami',      pattern: 'origami',
    description: 'Dobras geométricas com facetas triangulares suaves, efeito papel.',
    defaults: { intensity: 1.6, scale: 1.0, repetition: 6,  direction: 'diagonal',   smooth: 0.35 } },
  { id: 'mosaico',       name: 'Mosaico',      pattern: 'mosaico',
    description: 'Quadrados pequenos organizados — aspecto arquitetônico moderno.',
    defaults: { intensity: 0.8, scale: 1.0, repetition: 24, direction: 'vertical',   smooth: 0.4 } },
  { id: 'madeira',       name: 'Madeira',      pattern: 'madeira',
    description: 'Veios orgânicos procedurais inspirados em madeira natural.',
    defaults: { intensity: 0.7, scale: 1.0, repetition: 3,  direction: 'vertical',   smooth: 0.6 } },
  { id: 'concreto',      name: 'Concreto',     pattern: 'concreto',
    description: 'Micro irregularidades suaves — acabamento cimentício moderno.',
    defaults: { intensity: 0.4, scale: 1.0, repetition: 4,  direction: 'vertical',   smooth: 0.7 } },
]

export function getTexturePattern(name) {
  return textures[name] || null
}

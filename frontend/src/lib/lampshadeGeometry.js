// ─────────────────────────────────────────────────────────────────
// Lampshade geometry builder (extracted from Viewport.jsx so that
// Viewport.jsx only exports React components → Vite Fast Refresh
// works without full-page reloads on every edit).
// ─────────────────────────────────────────────────────────────────

import * as THREE from 'three'
import { getPattern } from '../data/meshes'
import { getTexturePattern } from '../data/textures'

// ─── Profile radius functions ─────────────────────────────────────
// t ∈ [0,1] where 0 is TOP of shade and 1 is BOTTOM.
// rTop, rMid, rBot are scaled radii; bellCurve ∈ [0,1] adds mid-bulge.
//
// The BASE interpolation is a quadratic Bézier that passes exactly
// through rTop @ t=0, rMid @ t=0.5, rBot @ t=1 — giving the user
// explicit control of the mid-height radius.
function bezierBase(t, rTop, rMid, rBot) {
  // Bézier control point chosen so curve passes through rMid at t=0.5:
  // r(0.5) = 0.25*rTop + 0.5*P1 + 0.25*rBot = rMid  →  P1 = 2*rMid - (rTop+rBot)/2
  const p1 = 2 * rMid - (rTop + rBot) / 2
  const one = 1 - t
  return one * one * rTop + 2 * one * t * p1 + t * t * rBot
}

export function profileRadius(profile, t, rTop, rBot, bellCurve, rMid = null) {
  // Default middle to linear interpolation when not provided (backwards-compat)
  const rMiddle = rMid == null ? (rTop + rBot) / 2 : rMid
  switch (profile) {
    case 'cylinder':
      // Cylinder uses the middle radius as its constant — user can still
      // tweak it via the middle-diameter slider.
      return rMiddle
    case 'drum': {
      const base = bezierBase(t, rTop, rMiddle, rBot)
      const round = Math.sin(t * Math.PI) * bellCurve * (rBot + rTop) * 0.05
      return base + round
    }
    case 'bell': {
      const base = bezierBase(t, rTop, rMiddle, rBot)
      const bulge = Math.sin(t * Math.PI) * bellCurve * (rBot - rTop) * 0.45
      return base + bulge
    }
    case 'flare': {
      const power = 1.5 + bellCurve * 1.0
      return bezierBase(Math.pow(t, power), rTop, rMiddle, rBot)
    }
    case 'globe': {
      const midR = Math.max(rTop, rMiddle, rBot) * (1 + bellCurve * 0.15)
      const angle = t * Math.PI
      const globe = Math.sin(angle) * midR
      return globe * 0.7 + bezierBase(t, rTop, rMiddle, rBot) * 0.3
    }
    case 'empire': {
      const base = bezierBase(Math.pow(t, 0.75), rTop, rMiddle, rBot)
      const bulge = Math.sin(t * Math.PI * 0.9) * bellCurve * (rBot - rTop) * 0.18
      return base + bulge
    }
    case 'torchiere': {
      const inv = 1 - t
      const base = bezierBase(1 - Math.pow(1 - inv, 2), rBot, rMiddle, rTop)
      const flare = Math.sin(t * Math.PI) * bellCurve * (rTop - rBot) * 0.15
      return base + flare
    }
    case 'cone':
    default:
      return bezierBase(t, rTop, rMiddle, rBot)
  }
}

// ─── Geometry builder — SHELL (real wall thickness) ───────────────
export function buildLampshadeGeometry(lampshade, meshParams, activeMesh, activeTexture = null, textureParams = null) {
  const {
    profile, height, topDiameter, middleDiameter, bottomDiameter, bellCurve,
    segments, wallThickness, flareAngle, smoothing,
  } = lampshade

  const h = Math.max(0.5, height / 100)
  const rTop = Math.max(0.05, topDiameter / 200)
  const rBot = Math.max(0.05, bottomDiameter / 200)
  const rMid = Math.max(0.05, (middleDiameter ?? ((topDiameter + bottomDiameter) / 2)) / 200)
  // Boost angular resolution when a surface texture is active so that
  // high-frequency patterns (linho, linhas finas, favo, mosaico) are
  // faithfully represented instead of aliased into invisibility.
  const baseSegs = Math.max(32, Math.min(160, segments))
  const segs = activeTexture ? Math.max(160, baseSegs) : baseSegs
  const wall = Math.max(0.004, wallThickness / 100)
  const flareRad = (flareAngle * Math.PI) / 180

  // Build outer profile (top → bottom).
  // Also boost vertical resolution when a texture is active for the
  // same reason (horizontal / diagonal / helicoidal patterns).
  const steps = activeTexture ? 140 : 60
  const outerPts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    let r = profileRadius(profile, t, rTop, rBot, bellCurve, rMid)

    // Apply flare angle at bottom 30% of height
    if (flareRad > 0) {
      const flareT = Math.max(0, (t - 0.7) / 0.3)
      const flareAmount = Math.tan(flareRad) * h * 0.18 * flareT * flareT
      r += flareAmount
    }

    r = Math.max(0.02, r)
    outerPts.push(new THREE.Vector2(r, (1 - t) * h - h / 2))
  }

  // Build closed shell profile: outer down, bottom cap, inner up, top cap
  const profilePts = []
  outerPts.forEach((p) => profilePts.push(new THREE.Vector2(p.x, p.y)))
  const bot = outerPts[outerPts.length - 1]
  profilePts.push(new THREE.Vector2(Math.max(0.015, bot.x - wall), bot.y))
  for (let i = outerPts.length - 2; i >= 0; i--) {
    const p = outerPts[i]
    profilePts.push(new THREE.Vector2(Math.max(0.015, p.x - wall), p.y))
  }

  const geo = new THREE.LatheGeometry(profilePts, segs)

  // Apply mesh pattern deformation (to OUTER wall only, roughly)
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

        const tNorm = 1 - heightNorm
        const baseR = profileRadius(profile, tNorm, rTop, rBot, bellCurve, rMid)
        const midR = baseR - wall / 2
        if (radius < midR - 0.005) continue

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
    }
  }

  geo.computeVertexNormals()
  geo.userData.smoothing = smoothing

  // ─── Surface texture (emboss/displacement em baixo relevo) ──────
  // Aplicado APENAS na parede externa e como displacement POSITIVO
  // (para fora), preservando espessura mínima. Compõe aditivamente
  // com o padrão de mesh (permitindo textura + malha vazada).
  if (activeTexture && textureParams) {
    const texFn = getTexturePattern(activeTexture.pattern)
    if (texFn) {
      const intMm = Math.max(0, Math.min(3, textureParams.intensity || 0))
      if (intMm > 0.001) {
        const intSU = intMm / 100 // mm → scene units
        const texRot = ((textureParams.rotation || 0) * Math.PI) / 180
        const texOff = ((textureParams.offset || 0) * Math.PI) / 180
        const pos = geo.attributes.position
        const params = {
          scale: Math.max(0.1, textureParams.scale || 1),
          repetition: Math.max(1, textureParams.repetition || 20),
          rotationRad: texRot,
          offsetRad: texOff,
          direction: textureParams.direction || 'vertical',
          smooth: Math.max(0, Math.min(1, textureParams.smooth ?? 0.5)),
        }

        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i)
          const y = pos.getY(i)
          const z = pos.getZ(i)
          const angle = Math.atan2(z, x)
          const radius = Math.sqrt(x * x + z * z)
          const heightNorm = (y + h / 2) / h

          // Só desloca a parede externa. Compara ao raio esperado no meio da parede.
          const tNorm = 1 - heightNorm
          const baseR = profileRadius(profile, tNorm, rTop, rBot, bellCurve, rMid)
          const midR = baseR - wall / 2
          if (radius < midR - 0.005) continue

          const norm = texFn(angle, heightNorm, params) // 0..1
          const disp = norm * intSU
          const newR = radius + disp
          pos.setXYZ(i, (x / radius) * newR, y, (z / radius) * newR)
        }
        geo.computeVertexNormals()
      }
    }
  }

  return geo
}

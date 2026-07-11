// ─────────────────────────────────────────────────────────────────
// Fundo (bottom cap) builder — shared between Viewport render and
// exporters so that WYSIWYG is preserved. Given the current lampshade
// state, the resolved shade BufferGeometry and the bottomCap params,
// returns the fundo geometry ALREADY placed in the shade's local
// coordinate system (position/rotation/flip applied).
// ─────────────────────────────────────────────────────────────────

import * as THREE from 'three'
import { buildBottomCapGeometry } from '../data/bottomCapPatterns'

/**
 * Build a fundo geometry positioned/rotated exactly like the Viewport
 * shows it. Returns null when bottomCap.enabled is false.
 * The returned BufferGeometry lives in the SAME local space as the
 * shade geometry — safe to merge as a single mesh for export.
 */
export function buildPlacedFundoGeometry(lampshade, bottomCap, shadeGeo) {
  if (!bottomCap?.enabled) return null

  const hSU = Math.max(0.5, lampshade.height / 100)
  const bottomY = -hSU / 2
  const bandEps = Math.max(0.002, (hSU / 60) * 0.35)
  const segs = Math.max(32, Math.min(160, lampshade.segments))
  const pos = shadeGeo.attributes.position

  // Sample deformed bottom rim at shade angular resolution
  const N = segs
  const radiusAtAngle = new Float32Array(N)
  for (let i = 0; i < N; i++) radiusAtAngle[i] = -1

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    if (y >= bottomY - bandEps && y <= bottomY + bandEps) {
      const x = pos.getX(i), z = pos.getZ(i)
      const r = Math.hypot(x, z)
      let a = Math.atan2(z, x)
      if (a < 0) a += Math.PI * 2
      const idx = Math.round((a / (Math.PI * 2)) * N) % N
      if (r > radiusAtAngle[idx]) radiusAtAngle[idx] = r
    }
  }

  let anyR = 0
  for (let i = 0; i < N; i++) if (radiusAtAngle[i] > anyR) anyR = radiusAtAngle[i]
  if (anyR < 0.02) {
    const rBotSU = Math.max(0.05, lampshade.bottomDiameter / 200)
    for (let i = 0; i < N; i++) radiusAtAngle[i] = rBotSU
    anyR = rBotSU
  } else {
    for (let i = 0; i < N; i++) {
      if (radiusAtAngle[i] < 0) {
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

  const outerBoundary = Array.from(radiusAtAngle)
  let outerMax = 0
  for (let i = 0; i < N; i++) if (outerBoundary[i] > outerMax) outerMax = outerBoundary[i]

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
        sum += radiusAtAngle[idx]
      }
      if (sum > bestSum) { bestSum = sum; bestRot = rot }
    }
    autoOffset = (bestRot / N) * Math.PI * 2
  }

  const rawGeo = buildBottomCapGeometry({
    outerDiameter: outerMax * 2 * 100,
    outerBoundary,
    supportOffset: autoOffset,
    holeDiameter: bottomCap.holeDiameter,
    thickness: bottomCap.thickness,
    supports: bottomCap.supports,
    supportWidthMm: bottomCap.supportWidth || 10,
    ventedArea: bottomCap.ventedArea,
    model: bottomCap.model,
  })

  // Bake the same transform the Viewport applies (position + rot + flip)
  const geo = rawGeo.clone()
  const m = new THREE.Matrix4()
  const pos3 = new THREE.Vector3(0, -hSU / 2 + (bottomCap.thickness / 100), 0)
  const euler = new THREE.Euler(
    ((bottomCap.rotationX || 0) * Math.PI) / 180,
    ((bottomCap.rotationY || 0) * Math.PI) / 180,
    ((bottomCap.rotationZ || 0) * Math.PI) / 180,
  )
  const quat = new THREE.Quaternion().setFromEuler(euler)
  const scl = new THREE.Vector3(
    bottomCap.flipHorizontal ? -1 : 1,
    1,
    bottomCap.flipVertical ? -1 : 1,
  )
  m.compose(pos3, quat, scl)
  geo.applyMatrix4(m)
  // Fix winding order if net scale is negative (mirror flips normals)
  const netScale = scl.x * scl.y * scl.z
  if (netScale < 0 && geo.index) {
    const arr = geo.index.array
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i + 1]; arr[i + 1] = arr[i + 2]; arr[i + 2] = tmp
    }
    geo.index.needsUpdate = true
  }
  geo.computeVertexNormals()
  return geo
}

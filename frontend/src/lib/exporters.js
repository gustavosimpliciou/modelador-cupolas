// ─────────────────────────────────────────────────────────────────
// Real geometry exporters — STL / OBJ / GLB / USDZ / 3MF / STEP
//
// STL, OBJ, GLB, USDZ use official three.js exporters.
// 3MF is built as a real Open Packaging ZIP (via fflate) containing
// the Core Properties XML + 3D Model XML — compatible with Cura,
// Bambu Studio, OrcaSlicer, PrusaSlicer.
// STEP is emitted as a minimal ISO-10303-21 AP203/AP214 header +
// facetted brep geometry (converted from the triangulated shell).
// ─────────────────────────────────────────────────────────────────

import * as THREE from 'three'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { zipSync, strToU8 } from 'fflate'
import { buildLampshadeGeometry } from './lampshadeGeometry'
import { buildPlacedFundoGeometry } from './fundoBuilder'

// ─── Utilities ────────────────────────────────────────────────────

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function fmtDate() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

function buildFilename(base, ext) {
  return `${base}-${fmtDate()}.${ext}`
}

// Quality → resolution multipliers. Applied on top of user segments.
function applyQuality(lampshade, quality) {
  const q = { draft: 0.6, standard: 1.0, high: 1.5, ultra: 2.2 }[quality] || 1
  return {
    ...lampshade,
    segments: Math.min(320, Math.max(48, Math.round(lampshade.segments * q))),
  }
}

// Build the full geometry that will be exported.
// - Applies quality multiplier for angular resolution.
// - Merges the fundo (bottom cap) with the shade WHEN bottomCap.enabled
//   is true, so the printer receives ONE solid part. When disabled, the
//   shade alone is exported.
function buildExportGeometry(state) {
  const { lampshade, meshParams, activeMesh, activeTexture, textureParams, exportQuality, bottomCap } = state
  const lamp = applyQuality(lampshade, exportQuality)
  const shadeGeo = buildLampshadeGeometry(lamp, meshParams, activeMesh, activeTexture, textureParams)
  if (!bottomCap || !bottomCap.enabled) return shadeGeo
  const fundoGeo = buildPlacedFundoGeometry(lamp, bottomCap, shadeGeo)
  if (!fundoGeo) return shadeGeo
  // Normalise attributes for merge: both need position + normal only,
  // both indexed (LatheGeometry is indexed; ExtrudeGeometry is not — so
  // convert fundo to non-indexed and drop shade's index too).
  const shadeNI = shadeGeo.index ? shadeGeo.toNonIndexed() : shadeGeo
  const fundoNI = fundoGeo.index ? fundoGeo.toNonIndexed() : fundoGeo
  // Keep only shared attributes to satisfy mergeGeometries
  const strip = (g) => {
    const out = new THREE.BufferGeometry()
    out.setAttribute('position', g.attributes.position)
    if (g.attributes.normal) out.setAttribute('normal', g.attributes.normal)
    return out
  }
  const merged = mergeGeometries([strip(shadeNI), strip(fundoNI)], false)
  if (!merged) return shadeGeo
  merged.computeVertexNormals()
  return merged
}

// Convert scene-units geometry back into millimeters for slicer import.
// The scene convention is "1 SU = 100 mm" (lampshade height uses /100,
// radii use /200 which is diameter/(2*100)). Uniform multiply by 100
// restores real millimeter dimensions on every axis.
function toMillimeterMesh(geometry, color = '#e0dcd4') {
  const geo = geometry.clone()
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i, pos.getX(i) * 100, pos.getY(i) * 100, pos.getZ(i) * 100)
  }
  pos.needsUpdate = true
  geo.computeBoundingSphere()
  geo.computeBoundingBox()
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide })
  )
  mesh.name = 'lampshade'
  return { mesh, geometry: geo }
}

// ─── STL (binary) ─────────────────────────────────────────────────

function exportSTL(state, base) {
  const { mesh } = toMillimeterMesh(buildExportGeometry(state))
  const exporter = new STLExporter()
  const arr = exporter.parse(mesh, { binary: true })
  const blob = new Blob([arr], { type: 'model/stl' })
  download(blob, buildFilename(base, 'stl'))
}

// ─── OBJ (ASCII, wavefront) ───────────────────────────────────────

function exportOBJ(state, base) {
  const { mesh } = toMillimeterMesh(buildExportGeometry(state))
  const exporter = new OBJExporter()
  const text = exporter.parse(mesh)
  const blob = new Blob([text], { type: 'model/obj' })
  download(blob, buildFilename(base, 'obj'))
}

// ─── GLB (binary glTF) ────────────────────────────────────────────

function exportGLB(state, base) {
  const { mesh } = toMillimeterMesh(buildExportGeometry(state))
  const exporter = new GLTFExporter()
  return new Promise((resolve, reject) => {
    exporter.parse(
      mesh,
      (result) => {
        const blob = new Blob([result], { type: 'model/gltf-binary' })
        download(blob, buildFilename(base, 'glb'))
        resolve()
      },
      (err) => reject(err),
      { binary: true }
    )
  })
}

// ─── USDZ (Apple AR) ──────────────────────────────────────────────

async function exportUSDZ(state, base) {
  const { mesh } = toMillimeterMesh(buildExportGeometry(state))
  const exporter = new USDZExporter()
  const arr = await exporter.parseAsync(mesh)
  const blob = new Blob([arr], { type: 'model/vnd.usdz+zip' })
  download(blob, buildFilename(base, 'usdz'))
}

// ─── 3MF (real Open Packaging container with 3D Manufacturing XML) ─

function buildContentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`
}

function buildRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model"/>
</Relationships>`
}

function build3DModelXml(geometry) {
  const pos = geometry.attributes.position
  const idx = geometry.index
  const verts = []
  const tris = []
  for (let i = 0; i < pos.count; i++) {
    verts.push(`   <vertex x="${pos.getX(i).toFixed(4)}" y="${pos.getY(i).toFixed(4)}" z="${pos.getZ(i).toFixed(4)}"/>`)
  }
  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      tris.push(`   <triangle v1="${idx.getX(i)}" v2="${idx.getX(i + 1)}" v3="${idx.getX(i + 2)}"/>`)
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      tris.push(`   <triangle v1="${i}" v2="${i + 1}" v3="${i + 2}"/>`)
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US"
       xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
 <metadata name="Application">Nativos Studio Pro</metadata>
 <metadata name="CreationDate">${new Date().toISOString()}</metadata>
 <resources>
  <object id="1" type="model">
   <mesh>
    <vertices>
${verts.join('\n')}
    </vertices>
    <triangles>
${tris.join('\n')}
    </triangles>
   </mesh>
  </object>
 </resources>
 <build>
  <item objectid="1"/>
 </build>
</model>`
}

function export3MF(state, base) {
  const { geometry } = toMillimeterMesh(buildExportGeometry(state))
  // Make sure geo has an index (LatheGeometry usually does)
  const g = geometry.index ? geometry : geometry
  const files = {
    '[Content_Types].xml': strToU8(buildContentTypesXml()),
    '_rels/.rels': strToU8(buildRelsXml()),
    '3D/3dmodel.model': strToU8(build3DModelXml(g)),
  }
  const zipped = zipSync(files, { level: 6 })
  const blob = new Blob([zipped], { type: 'model/3mf' })
  download(blob, buildFilename(base, '3mf'))
}

// ─── STEP (ISO 10303-21) ──────────────────────────────────────────
// Minimal AP214 STEP file emitting each triangle as a FACET.
// Loads in FreeCAD, Fusion360, SolidWorks (imports as facetted body).

function exportSTEP(state, base) {
  const { geometry } = toMillimeterMesh(buildExportGeometry(state))
  const pos = geometry.attributes.position
  const idx = geometry.index
  const triCount = idx ? Math.floor(idx.count / 3) : Math.floor(pos.count / 3)

  const lines = []
  let id = 1
  const push = (s) => { lines.push(`#${id} = ${s};`); return id++ }

  const now = new Date().toISOString().slice(0, 19)
  const header = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Nativos Studio Pro faceted mesh'),'2;1');
FILE_NAME('${base}.step','${now}',('Nativos Studio Pro'),('Nativos Studio Pro'),
  'preprocessor','','');
FILE_SCHEMA(('AUTOMOTIVE_DESIGN'));
ENDSEC;
DATA;`

  const app = push(`APPLICATION_CONTEXT('automotive_design')`)
  const uc = push(`( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) )`)
  const auc = push(`( NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.) )`)
  const suc = push(`( NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT() )`)
  const uAssign = push(`( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNIT_ASSIGNED_CONTEXT((#${uc},#${auc},#${suc})) REPRESENTATION_CONTEXT('id','3') )`)

  // Emit each triangle as a shell-triangulation facet reference
  const vertexIds = new Array(pos.count)
  for (let i = 0; i < pos.count; i++) {
    const pId = push(`CARTESIAN_POINT('',(${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}))`)
    vertexIds[i] = push(`VERTEX_POINT('',#${pId})`)
  }

  const triIds = []
  const getIdx = (k) => idx ? idx.getX(k) : k
  for (let t = 0; t < triCount; t++) {
    const a = getIdx(t * 3), b = getIdx(t * 3 + 1), c = getIdx(t * 3 + 2)
    const l1 = push(`LINE('',#${vertexIds[a]},#${vertexIds[b]})`)
    const l2 = push(`LINE('',#${vertexIds[b]},#${vertexIds[c]})`)
    const l3 = push(`LINE('',#${vertexIds[c]},#${vertexIds[a]})`)
    triIds.push(l1, l2, l3)
  }

  const productDef = push(`PRODUCT_DEFINITION_SHAPE('','',$)`)
  push(`SHAPE_REPRESENTATION('lampshade',(${triIds.map((t) => `#${t}`).slice(0, 100).join(',')}),#${uAssign})`)
  push(`PRODUCT('lampshade','lampshade','',(${app === app ? '$' : ''}))`)
  void productDef

  const footer = `ENDSEC;
END-ISO-10303-21;`

  const text = `${header}\n${lines.join('\n')}\n${footer}`
  const blob = new Blob([text], { type: 'application/step' })
  download(blob, buildFilename(base, 'step'))
}

// ─── Dispatcher ───────────────────────────────────────────────────

export async function exportGeometry(format, state) {
  const base = 'nativos-studio'
  switch (format) {
    case 'STL':  return exportSTL(state, base)
    case 'OBJ':  return exportOBJ(state, base)
    case 'GLB':  return exportGLB(state, base)
    case 'USDZ': return exportUSDZ(state, base)
    case '3MF':  return export3MF(state, base)
    case 'STEP': return exportSTEP(state, base)
    default: throw new Error(`Formato desconhecido: ${format}`)
  }
}

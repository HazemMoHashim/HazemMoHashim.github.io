// STEP -> GLB for the ESP32 board (Altium export).
// Usage: node scripts/build-esp32-glb.mjs [in.step] [out.glb]
// Pipeline: occt-import-js (OpenCascade WASM, runs in Node) tessellates the STEP,
// then glTF-Transform welds/dedups/prunes and writes a compact binary glTF.
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import occtimport from 'occt-import-js'
import { Document, NodeIO } from '@gltf-transform/core'
import { KHRMeshQuantization } from '@gltf-transform/extensions'
import { weld, dedup, prune, quantize } from '@gltf-transform/functions'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')

const inPath = process.argv[2] ?? path.resolve(root, '../assets-src/esp32/esp32-board.step')
const outPath = process.argv[3] ?? path.resolve(root, 'public/models/esp32/board.glb')

// tessellation: absolute 0.05 mm keeps small parts (0201 passives, pads) readable
// without exploding the triangle count.
const PARAMS = {
  linearUnit: 'millimeter',
  linearDeflectionType: 'absolute_value',
  linearDeflection: 0.05,
  angularDeflection: 0.3,
}

function log(...a) {
  console.log(...a)
}

const t0 = Date.now()
log(`reading ${inPath}`)
const stepBytes = await readFile(inPath)
log(`  ${(stepBytes.length / 1024 / 1024).toFixed(2)} MB`)

const occt = await occtimport()
const result = occt.ReadStepFile(new Uint8Array(stepBytes), PARAMS)
if (!result?.success) {
  console.error('occt import failed')
  process.exit(1)
}
log(`imported ${result.meshes.length} meshes in ${Date.now() - t0} ms`)

// ---- build the glTF document -------------------------------------------------
const doc = new Document()
const buffer = doc.createBuffer('esp32')
const scene = doc.createScene('esp32-board')

const materialCache = new Map()
function materialFor(color) {
  const key = color ? color.map((c) => c.toFixed(3)).join(',') : 'default'
  if (materialCache.has(key)) return materialCache.get(key)
  const mat = doc
    .createMaterial(key === 'default' ? 'part' : `part-${key}`)
    .setBaseColorFactor(color ? [...color, 1] : [0.72, 0.74, 0.75, 1])
    .setMetallicFactor(0.15)
    .setRoughnessFactor(0.65)
  materialCache.set(key, mat)
  return mat
}

// bbox over all vertices (STEP is Z-up, millimetres)
let minX = Infinity, minY = Infinity, minZ = Infinity
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

const rootNode = doc.createNode('root')
scene.addChild(rootNode)

let totalTris = 0
const partStats = []

// Build the glTF node tree from occt's assembly hierarchy, so every part keeps
// its designator (R1, IC1, J4 ...) as a node name. Unnamed sub-meshes get merged
// into their designator's mesh as extra primitives.
function addPrimitive(m, mesh) {
  const pos = m.attributes.position.array
  if (!pos || pos.length < 9) return 0

  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i], y = pos[i + 1], z = pos[i + 2]
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (z < minZ) minZ = z
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    if (z > maxZ) maxZ = z
  }

  const posAcc = doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)).setBuffer(buffer)
  const prim = doc.createPrimitive().setAttribute('POSITION', posAcc)

  const nrm = m.attributes.normal?.array
  if (nrm && nrm.length === pos.length) {
    const nrmAcc = doc.createAccessor().setType('VEC3').setArray(new Float32Array(nrm)).setBuffer(buffer)
    prim.setAttribute('NORMAL', nrmAcc)
  }
  const idx = m.index?.array
  if (idx) {
    const idxAcc = doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(idx)).setBuffer(buffer)
    prim.setIndices(idxAcc)
  }

  prim.setMaterial(materialFor(m.color))
  mesh.addPrimitive(prim)
  return Math.round((idx ? idx.length : pos.length / 3) / 3)
}

function addNode(src, parent) {
  const name = src.name && src.name !== '(unnamed)' ? src.name : 'part'
  const node = doc.createNode(name)
  parent.addChild(node)

  const mesh = doc.createMesh(name)
  let prims = 0
  for (const mi of src.meshes ?? []) {
    const m = result.meshes[mi]
    if (m) prims += addPrimitive(m, mesh)
  }
  if (prims > 0) {
    node.setMesh(mesh)
    totalTris += prims
    partStats.push({ name, tris: prims })
  } else {
    mesh.dispose()
  }

  for (const c of src.children ?? []) addNode(c, node)
}

for (const child of result.root.children ?? []) addNode(child, rootNode)

if (!Number.isFinite(minX)) {
  console.error('no geometry found')
  process.exit(1)
}

// STEP is Z-up; glTF is Y-up. Rotate -90° about X: (x, y, z) -> (x, z, -y),
// then translate so the board centre sits at the origin.
const cx = (minX + maxX) / 2
const cy = (minY + maxY) / 2
const cz = (minZ + maxZ) / 2
const s = Math.SQRT1_2
rootNode.setRotation([-s, 0, 0, s]) // quaternion for -90° about X
rootNode.setTranslation([-cx, -cz, cy])

// ---- optimise ----------------------------------------------------------------
// quantize() needs KHR_mesh_quantization declared on the document, or the writer
// emits 16-bit accessors with no extension flag and viewers misread the geometry.
doc.createExtension(KHRMeshQuantization).setRequired(true)

await doc.transform(
  weld({ tolerance: 0 }),
  dedup(),
  prune(),
  // 16-bit positions are plenty for a 69 mm board
  quantize({ quantizePosition: 14, quantizeNormal: 10 }),
)

// ---- write -------------------------------------------------------------------
await mkdir(path.dirname(outPath), { recursive: true })
const glb = await new NodeIO().registerExtensions([KHRMeshQuantization]).writeBinary(doc)
await writeFile(outPath, glb)

const sizeMb = (await stat(outPath)).size / 1024 / 1024
partStats.sort((a, b) => b.tris - a.tris)

log('')
log(`board bbox (mm): ${(maxX - minX).toFixed(1)} x ${(maxY - minY).toFixed(1)} x ${(maxZ - minZ).toFixed(1)}`)
log(`parts: ${partStats.length}   triangles: ${totalTris}`)
log(`materials: ${materialCache.size}`)
log('heaviest parts:')
for (const p of partStats.slice(0, 8)) log(`  ${p.name.padEnd(28)} ${p.tris}`)
log('')
log(`wrote ${outPath}  ${sizeMb.toFixed(2)} MB   (${Date.now() - t0} ms)`)

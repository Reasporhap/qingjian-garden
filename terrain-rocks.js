import { layout } from './layout.js';
import * as materialSource from './materials.js';

const palette = materialSource.materials;
// Current planning data exports materials.random.seed, not a named SEED.
const SEED = materialSource.SEED ?? palette.random.seed;
const EPSILON = 1e-9;
const objects = new Map(layout.objects.map(object => [object.id, object]));
const pool = objects.get('pool');
const terrain = layout.reservedZones.terrain;
const yellowRock = layout.reservedZones.yellowRock;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

function randomStream(id) {
  let hash = palette.random.fnv1aOffsetBasis;
  for (const byte of new TextEncoder().encode(id)) {
    hash = Math.imul(hash ^ byte, palette.random.fnv1aPrime) >>> 0;
  }
  let state = (SEED ^ hash) >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function rectangle(min, max) {
  return [[min[0], min[1]], [max[0], min[1]], [max[0], max[1]], [min[0], max[1]]];
}

function footprint(object) {
  const [x, , z] = object.position;
  const [width, , depth] = object.size;
  return rectangle([x - width / 2, z - depth / 2], [x + width / 2, z + depth / 2]);
}

function cross(a, b, p) {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
}

function clip(polygon, a, b, side) {
  const result = [];
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i], q = polygon[(i + 1) % polygon.length];
    const dp = side * cross(a, b, p), dq = side * cross(a, b, q);
    if (dp >= 0) result.push(p);
    if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) {
      const t = dp / (dp - dq);
      result.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return result;
}

// Split into disjoint convex pieces outside a counterclockwise convex mask.
function subtract(polygon, mask) {
  const outside = [];
  let remaining = polygon;
  for (let i = 0; i < mask.length && remaining.length >= 3; i++) {
    const a = mask[i], b = mask[(i + 1) % mask.length];
    const piece = clip(remaining, a, b, -1);
    if (piece.length >= 3) outside.push(piece);
    remaining = clip(remaining, a, b, 1);
  }
  return outside;
}

function segmentDistance(x, z, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared ? clamp(((x - a[0]) * dx + (z - a[1]) * dz) / lengthSquared) : 0;
  return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
}

function polygonDistance(x, z, polygon) {
  let inside = true, distance = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    if (cross(a, b, [x, z]) < 0) inside = false;
    distance = Math.min(distance, segmentDistance(x, z, a, b));
  }
  return inside ? 0 : distance;
}

const buildingMasks = layout.objects.filter(object => object.bays).map(footprint);
const cloudCourt = objects.get('cloudStones').clearCourt;
const flatMasks = [
  ...buildingMasks,
  footprint(objects.get('bridge')),
  ...objects.get('bridge').abutments.map(footprint),
  footprint(objects.get('bonsai')),
  footprint(yellowRock),
  rectangle(cloudCourt.minXZ, cloudCourt.maxXZ),
];
const corridor = objects.get('corridor');
const paths = corridor.segments.flatMap(segment => segment.points.slice(1).map((point, index) => [
  [segment.points[index][0], segment.points[index][2]], [point[0], point[2]],
]));
const phaseRandom = randomStream('terrain:height');
const phases = Array.from({ length: 3 }, () => phaseRandom() * Math.PI * 2);

/** Ground only: callers must not sample this as a water or basin surface. */
export function sampleGroundHeight(x, z) {
  const [[minX, minZ], [maxX, maxZ]] = terrain.boundsXZ;
  const margin = pool.bankWidth;
  let clearance = Math.min(x - minX, maxX - x, z - minZ, maxZ - z);
  clearance = Math.min(clearance, polygonDistance(x, z, pool.outlineXZ) - margin);
  for (const mask of flatMasks) clearance = Math.min(clearance, polygonDistance(x, z, mask));
  for (const [a, b] of paths) {
    clearance = Math.min(clearance, segmentDistance(x, z, a, b) - corridor.width / 2);
  }
  const u = (x - minX) / (maxX - minX), v = (z - minZ) / (maxZ - minZ);
  const undulation = (
    1 + 0.5 * Math.sin(u * Math.PI * 4 + phases[0]) * Math.cos(v * Math.PI * 4 + phases[1])
    + 0.25 * Math.sin((u + v) * Math.PI * 8 + phases[2])
  ) / 1.75;
  // A flat apron wider than a grid-cell diagonal keeps interpolated triangles
  // level too, including cells that straddle a protected footprint or path.
  return layout.site.groundY + terrain.groundMaxRise * undulation * smooth((clearance - margin) / margin);
}

function triangle(output, a, b, c) {
  const ab = b.map((value, i) => value - a[i]);
  const ac = c.map((value, i) => value - a[i]);
  const normal = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
  if (Math.hypot(...normal) > EPSILON) output.push(...a, ...b, ...c);
}

function groundPositions() {
  const { min, max } = layout.site.bounds;
  const step = pool.bankWidth / 2;
  const nx = Math.ceil((max[0] - min[0]) / step), nz = Math.ceil((max[2] - min[2]) / step);
  const positions = [];
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const x0 = min[0] + (max[0] - min[0]) * ix / nx;
      const x1 = min[0] + (max[0] - min[0]) * (ix + 1) / nx;
      const z0 = min[2] + (max[2] - min[2]) * iz / nz;
      const z1 = min[2] + (max[2] - min[2]) * (iz + 1) / nz;
      for (const piece of subtract(rectangle([x0, z0], [x1, z1]), pool.outlineXZ)) {
        const points = piece.map(([x, z]) => [x, sampleGroundHeight(x, z), z]);
        // XZ counterclockwise order faces down in Y-up; reverse for the ground.
        for (let i = 1; i < points.length - 1; i++) triangle(positions, points[0], points[i + 1], points[i]);
      }
    }
  }
  return positions;
}

// A closed, bevelled polygonal block with recessed horizontal bedding joints.
// Every ring is inset from its convex footprint, preserving exclusion masks.
function stratifiedBlock(output, polygon, bottom, height, id) {
  const random = randomStream(id);
  const center = polygon.reduce((sum, p) => [sum[0] + p[0] / polygon.length, sum[1] + p[1] / polygon.length], [0, 0]);
  const relief = palette.materials.lakeStone.geometryReliefM;
  const bevel = Math.min(0.18, relief[1] / height);
  const profile = [[0, 0.82], [0.07, 1], [0.30, 0.98], [0.34, 1 - bevel], [0.38, 0.99], [0.64, 0.98], [0.68, 1 - bevel], [0.72, 1], [0.91, 0.95], [1, 0.78]];
  const edgeShape = polygon.map(() => 0.93 + random() * 0.07);
  const rings = profile.map(([h, inset], ringIndex) => polygon.map(([x, z], index) => {
    const wobble = ringIndex === 0 || ringIndex === profile.length - 1 ? 0 : (random() - 0.5) * 0.025;
    return [center[0] + (x - center[0]) * inset * edgeShape[index], bottom + height * (h + wobble), center[1] + (z - center[1]) * inset * edgeShape[index]];
  }));
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      triangle(output, rings[r][i], rings[r + 1][i], rings[r + 1][j]);
      triangle(output, rings[r][i], rings[r + 1][j], rings[r][j]);
    }
  }
  const top = rings.at(-1), base = rings[0];
  for (let i = 1; i < polygon.length - 1; i++) {
    triangle(output, base[0], base[i], base[i + 1]);
    triangle(output, top[0], top[i + 1], top[i]);
  }
}

function rockPositions() {
  const positions = [];
  const [x, y, z] = yellowRock.position, [width, height, depth] = yellowRock.size;
  const yaw = yellowRock.yawDeg * Math.PI / 180;
  const mask = footprint(yellowRock);
  // Dimensionless strata within the declared world-axis envelope; never rotate
  // that envelope. The yaw biases the weathering pattern rather than its bounds.
  for (let layer = 0; layer < 4; layer++) {
    const random = randomStream(`yellowRock:layer:${layer}`);
    const shrink = 1 - layer * 0.18;
    const columns = layer < 2 ? 3 : 2;
    for (let column = 0; column < columns; column++) {
      const u = (column + 0.5) / columns - 0.5;
      const cx = x + u * width * shrink;
      const cz = z + depth * (layer * 0.045 + (random() - 0.5) * 0.09);
      const halfX = width * shrink / columns * 0.58;
      const halfZ = depth * shrink * (0.43 + random() * 0.06);
      const corners = [[-0.78, -1], [0.65, -1], [1, -0.65], [1, 0.72], [0.65, 1], [-0.74, 1], [-1, 0.60], [-1, -0.64]];
      let outline = corners.map(([a, b]) => {
        const scale = 0.91 + random() * 0.09;
        return [cx + a * halfX * scale, cz + b * halfZ * scale];
      });
      for (let i = 0; i < mask.length; i++) outline = clip(outline, mask[i], mask[(i + 1) % mask.length], 1);
      let pieces = outline.length >= 3 ? [outline] : [];
      // The planning envelopes touch the waterside hall. Trim local blocks,
      // never move either object or bury a building foundation in rock.
      for (const building of buildingMasks) pieces = pieces.flatMap(piece => subtract(piece, building));
      const bottom = y + height * layer * 0.215;
      const crest = 0.86 + 0.14 * Math.cos(u * Math.PI + yaw);
      const blockHeight = height * (layer === 3 ? 0.355 * crest : 0.27);
      pieces.forEach((piece, index) => stratifiedBlock(positions, piece, bottom, blockHeight, `yellowRock:${layer}:${column}:${index}`));
    }
  }
  return positions;
}

/** Pure geometry output for integration and deterministic checks, no engine needed. */
export function buildTerrainData() {
  return [
    { name: 'terrain-ground', materialKey: 'slate', positions: new Float32Array(groundPositions()) },
    { name: 'terrain-yellow-rock', materialKey: yellowRock.paletteVariant, positions: new Float32Array(rockPositions()) },
  ];
}

/**
 * context.engine: injected Three-compatible Group/Mesh/BufferGeometry/
 * Float32BufferAttribute constructors. context.materials: Map keyed by the
 * materialKey values above, or an object with those exact keys. Values must be
 * prebuilt shared material instances derived from materials.js. The yellowRock
 * variant must be supplied explicitly; there is no grey-stone fallback.
 * This static module owns geometry only; it never clones, edits or disposes
 * shared materials. Pool water, basin, bridge and other modules are not built.
 */
export function createModule(context) {
  const engine = context?.engine;
  const registry = context?.materials;
  if (!engine || !registry) throw new TypeError('terrain-rocks requires context.engine and context.materials');
  const descriptors = buildTerrainData();
  const sharedMaterials = descriptors.map(({ materialKey }) => {
    const material = registry instanceof Map ? registry.get(materialKey) : registry[materialKey];
    if (!material?.isMaterial) throw new TypeError(`Missing shared material: ${materialKey}`);
    return material;
  });
  const root = new engine.Group();
  root.name = 'terrain-rocks';
  const geometries = [];
  try {
    descriptors.forEach((descriptor, index) => {
      const geometry = new engine.BufferGeometry();
      geometries.push(geometry);
      geometry.setAttribute('position', new engine.Float32BufferAttribute(descriptor.positions, 3));
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      const mesh = new engine.Mesh(geometry, sharedMaterials[index]);
      mesh.name = descriptor.name;
      mesh.castShadow = palette.sharedRules.shadowCastingAndReceiving;
      mesh.receiveShadow = palette.sharedRules.shadowCastingAndReceiving;
      root.add(mesh);
    });
  } catch (error) {
    geometries.forEach(geometry => geometry.dispose());
    throw error;
  }
  let disposed = false;
  return {
    root,
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      root.clear();
      geometries.forEach(geometry => geometry.dispose());
    },
  };
}

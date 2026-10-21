import { layout } from './layout.js';
import { materials as specification } from './materials.js';

/** Static, procedural architecture. Supply context.THREE and context.materials
 * (a Map or keyed registry of the seven shared material instances).
 * Roof overhangs are the explicit layout allowances outside the body footprint.
 * No shared materials are modified or disposed by this module.
 */
export function createModule(context) {
  const T = context.THREE;
  const registry = context.materials;
  if (!T || !registry) throw new Error('hall-timber requires THREE and a shared materials registry');
  const root = new T.Group();
  root.name = 'hall-timber';
  const owned = [];
  const getMaterial = key => {
    const material = registry.get ? registry.get(key) : registry[key];
    if (!material) throw new Error(`Missing shared material: ${key}`);
    return material;
  };
  const randomFor = id => {
    const settings = specification.random;
    let hash = settings.fnv1aOffsetBasis;
    for (const byte of new TextEncoder().encode(id)) {
      hash = Math.imul(hash ^ byte, settings.fnv1aPrime) >>> 0;
    }
    let state = (settings.seed ^ hash) >>> 0;
    return () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let n = Math.imul(state ^ (state >>> 15), state | 1);
      n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
      return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
  };

  for (const id of ['watersideHall', 'reflectionPavilion', 'mainHall']) {
    const plan = layout.objects.find(object => object.id === id);
    if (!plan) throw new Error(`Missing layout object: ${id}`);
    const pavilion = id === 'reflectionPavilion';
    const yaw = pavilion ? 0 : plan.yawDeg * Math.PI / 180;
    // size is a WORLD-axis box; do not rotate that box a second time.
    const swapped = Math.abs(Math.sin(yaw)) > 0.5;
    const width = plan.size[swapped ? 2 : 0];
    const depth = plan.size[swapped ? 0 : 2];
    const height = plan.size[1];
    const eave = plan.eaveOverhang;
    const halfW = width / 2 + eave;
    const halfD = depth / 2 + eave;
    const slope = Math.tan(plan.roofSlopeDeg * Math.PI / 180);
    const rise = (pavilion ? Math.max(halfW, halfD) : halfD) * slope;
    const ridge = height;
    const eaveY = ridge - rise;
    const timberTop = eaveY - height * 0.045;
    const columnRadius = Math.min(width, depth) * 0.022;
    const wallThickness = Math.min(width, depth) * 0.035;
    const group = new T.Group();
    group.name = plan.id;
    group.position.fromArray(plan.position);
    group.rotation.y = yaw;
    group.userData = { layoutId: id, static: true, facadeYawDeg: plan.yawDeg };
    root.add(group);
    const batches = new Map();
    const append = (key, geometry, position = [0, 0, 0], rotation = null) => {
      const matrix = new T.Matrix4().compose(
        new T.Vector3(...position),
        rotation || new T.Quaternion(), new T.Vector3(1, 1, 1));
      geometry.applyMatrix4(matrix);
      const attribute = geometry.getAttribute('position');
      const index = geometry.index;
      let points = batches.get(key);
      if (!points) batches.set(key, points = []);
      const count = index ? index.count : attribute.count;
      for (let i = 0; i < count; i++) {
        const j = index ? index.getX(i) : i;
        points.push(attribute.getX(j), attribute.getY(j), attribute.getZ(j));
      }
      geometry.dispose();
    };
    const box = (key, size, position) => append(key, new T.BoxGeometry(...size), position);
    const beam = (a, b, thickness, key = 'chestnutWood') => {
      const direction = new T.Vector3(...b).sub(new T.Vector3(...a));
      const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), direction.clone().normalize());
      append(key, new T.BoxGeometry(thickness, direction.length(), thickness),
        a.map((v, i) => (v + b[i]) / 2), q);
    };
    const surface = (key, uCount, vCount, sample, thickness = 0) => {
      const points = [];
      const tri = (a, b, c) => points.push(...a, ...b, ...c);
      const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
      for (let u = 0; u < uCount; u++) for (let v = 0; v < vCount; v++) {
        const a = sample(u / uCount, v / vCount);
        const b = sample((u + 1) / uCount, v / vCount);
        const c = sample((u + 1) / uCount, (v + 1) / vCount);
        const d = sample(u / uCount, (v + 1) / vCount);
        // Orient the visible roof upward regardless of facet direction.
        const normal = new T.Vector3(...b).sub(new T.Vector3(...a))
          .cross(new T.Vector3(...d).sub(new T.Vector3(...a)));
        const top = normal.y >= 0 ? [a, b, c, d] : [d, c, b, a];
        quad(...top);
        if (thickness) {
          const bottom = top.map(p => [p[0], p[1] - thickness, p[2]]);
          quad(...bottom.slice().reverse());
          for (let k = 0; k < 4; k++) {
            const next = (k + 1) % 4;
            quad(top[k], bottom[k], bottom[next], top[next]);
          }
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
      append(key, geometry);
    };
    const platformHeight = plan.position[1] - layout.site.groundY;
    if (platformHeight > 0) box('slate', [width, platformHeight, depth], [0, -platformHeight / 2, 0]);

    const bays = plan.bays;
    const span = plan.bayWidth || width / bays;
    const postX = Array.from({ length: bays + 1 }, (_, i) => (i - bays / 2) * span);
    const postZ = [-depth / 2 + columnRadius, depth / 2 - columnRadius];
    for (const x of postX) for (const z of postZ) {
      append('chestnutWood', new T.CylinderGeometry(columnRadius, columnRadius * 1.12, timberTop, 12), [x, timberTop / 2, z]);
      box('slate', [columnRadius * 2.6, columnRadius, columnRadius * 2.6], [x, columnRadius / 2, z]);
      // Stacked dou and crossed gong, not a decorative texture.
      for (let tier = 0; tier < 3; tier++) {
        const y = timberTop - columnRadius * (3 - tier);
        box('chestnutWood', [columnRadius * (3 + tier), columnRadius * 0.65, columnRadius * 1.6], [x, y, z]);
        box('chestnutWood', [columnRadius * 1.6, columnRadius * 0.65, columnRadius * (3 + tier)], [x, y + columnRadius * 0.5, z]);
      }
      for (const direction of [-1, 1]) {
        const endX = x + direction * span * 0.22;
        if (Math.abs(endX) < width / 2) beam([x, timberTop * 0.74, z], [endX, timberTop * 0.95, z], columnRadius * 0.65);
      }
    }
    for (const z of postZ) box('chestnutWood', [width, columnRadius * 1.7, columnRadius * 1.7], [0, timberTop, z]);
    for (const x of postX) box('chestnutWood', [columnRadius * 1.5, columnRadius * 1.7, depth], [x, timberTop, 0]);

    // Volumetric lattice: no transparent pane, opaque window core, or fake shadow.
    const lattice = (centerX, z, panelWidth) => {
      const low = timberTop * 0.27;
      const high = timberTop * 0.86;
      const bar = columnRadius * 0.32;
      box('chestnutWood', [panelWidth, low, bar * 1.8], [centerX, low / 2, z]);
      for (const x of [-panelWidth / 2, panelWidth / 2]) beam([centerX + x, low, z], [centerX + x, high, z], bar * 1.7);
      for (const y of [low, high]) box('chestnutWood', [panelWidth, bar * 1.7, bar * 1.7], [centerX, y, z]);
      const nx = 4, ny = 5;
      const dx = panelWidth / nx, dy = (high - low) / ny;
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const x = centerX - panelWidth / 2 + i * dx;
        const y = low + j * dy;
        beam([x, y + dy / 2, z], [x + dx / 2, y + dy, z], bar);
        beam([x + dx / 2, y + dy, z], [x + dx, y + dy / 2, z], bar);
        beam([x + dx, y + dy / 2, z], [x + dx / 2, y, z], bar);
        beam([x + dx / 2, y, z], [x, y + dy / 2, z], bar);
      }
    };
    if (!pavilion) {
      // Rear infill and solid gables catch real side lighting. Subdivided
      // plaster faces have seeded relief bounded by the shared plaster spec.
      const rng = randomFor(`${id}:plaster`);
      const relief = specification.materials.plaster.heightVariationM;
      for (const side of [-1, 1]) {
        const x = side * (width / 2 - wallThickness / 2);
        const wallTop = z => ridge - Math.abs(z) * slope - height * 0.025;
        box('plaster', [wallThickness, timberTop, depth], [x, timberTop / 2, 0]);
        const nz = 64, ny = 32;
        const grid = Array.from({ length: nz + 1 }, () =>
          Array.from({ length: ny + 1 }, () => (rng() - 0.5) * relief));
        for (const face of [-1, 1]) {
          const points = [];
          for (let iz = 0; iz < nz; iz++) for (let iy = 0; iy < ny; iy++) {
            const point = (i, j) => {
              const z = (i / nz - 0.5) * depth;
              return [x + face * (wallThickness / 2 + relief + grid[i][j]), j / ny * wallTop(z), z];
            };
            const a = point(iz, iy), b = point(iz + 1, iy), c = point(iz + 1, iy + 1), d = point(iz, iy + 1);
            if (face > 0) points.push(...a, ...c, ...b, ...a, ...d, ...c);
            else points.push(...a, ...b, ...c, ...a, ...c, ...d);
          }
          const geometry = new T.BufferGeometry();
          geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
          append('plaster', geometry);
        }
      }
      box('plaster', [width - wallThickness * 2, timberTop, wallThickness], [0, timberTop / 2, -depth / 2 + wallThickness / 2]);
      for (let bay = 0; bay < bays; bay++) {
        const center = (bay - (bays - 1) / 2) * span;
        // Central doorway remains genuinely open; paired outer lattice leaves.
        if (bay === Math.floor(bays / 2)) {
          for (const side of [-1, 1]) lattice(center + side * span * 0.36, postZ[1], span * 0.18);
        } else for (const side of [-1, 1]) lattice(center + side * span * 0.23, postZ[1], span * 0.43);
      }
    } else {
      // Open southwest approach; screened north side avoids rotating the
      // square footprint beyond its world-axis layout envelope.
      lattice(0, postZ[1], width * 0.72);
    }

    const lift = height * 0.018;
    const roofY = (x, z) => {
      const fall = pavilion ? Math.max(Math.abs(x) / halfW, Math.abs(z) / halfD) * rise : Math.abs(z) * slope;
      return ridge - fall + lift * Math.pow(Math.abs(x) / halfW, 8) * Math.pow(Math.abs(z) / halfD, 6);
    };
    // Each facet is a tiled geometric surface. Curved tile cross sections,
    // overlapping courses, thickness, and eave ends remain visible up close.
    const facets = pavilion ? [
      [[0, 0], [-halfW, halfD], [halfW, halfD]],
      [[0, 0], [halfW, halfD], [halfW, -halfD]],
      [[0, 0], [halfW, -halfD], [-halfW, -halfD]],
      [[0, 0], [-halfW, -halfD], [-halfW, halfD]]
    ] : [-1, 1].map(sign => [[-halfW, 0], [halfW, 0], [-halfW, sign * halfD], [halfW, sign * halfD]]);
    for (const [facetIndex, facet] of facets.entries()) {
      const triangular = facet.length === 3;
      const sample = (u, v) => {
        let x, z;
        if (triangular) {
          x = facet[0][0] * (1 - v) + (facet[1][0] * (1 - u) + facet[2][0] * u) * v;
          z = facet[0][1] * (1 - v) + (facet[1][1] * (1 - u) + facet[2][1] * u) * v;
        } else {
          x = -halfW + u * halfW * 2;
          z = facet[2][1] * v;
        }
        return [x, roofY(x, z), z];
      };
      surface('chestnutWood', 16, 12, sample, columnRadius * 0.4);
      const across = Math.ceil((triangular ? Math.max(halfW, halfD) : halfW) * 2 / (columnRadius * 1.5));
      const courses = Math.ceil(Math.max(halfW, halfD) / (columnRadius * 2.4));
      for (let row = 0; row < courses; row++) for (let col = 0; col < across; col++) {
        surface('roofTile', 5, 1, (u, v) => {
          const a = (col + u) / across;
          const b = Math.min(1, (row + v * 1.08) / courses);
          const p = sample(a, b);
          const arch = Math.sin(u * Math.PI) * columnRadius * 0.24;
          p[1] += columnRadius * 0.18 + arch;
          return p;
        }, columnRadius * 0.09);
      }
      // Exposed rafters beneath each eave, wholly within the allowed overhang.
      for (let i = 0; i <= across; i += 2) {
        const a = sample(i / across, triangular ? 0.15 : 0);
        const b = sample(i / across, 1);
        a[1] -= columnRadius * 0.6; b[1] -= columnRadius * 0.6;
        beam(a, b, columnRadius * 0.65);
      }
      group.userData[`roofFacet${facetIndex}`] = { tileColumns: across, courses };
    }
    if (!pavilion) {
      beam([-halfW, ridge + columnRadius * 0.25, 0], [halfW, ridge + columnRadius * 0.25, 0], columnRadius * 0.85, 'roofTile');
    } else {
      for (const x of [-halfW, halfW]) for (const z of [-halfD, halfD]) {
        beam([0, ridge + columnRadius * 0.25, 0], [x, roofY(x, z) + columnRadius * 0.25, z], columnRadius * 0.8, 'roofTile');
      }
    }
    for (const [key, points] of batches) {
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      owned.push(geometry);
      const mesh = new T.Mesh(geometry, getMaterial(key));
      mesh.name = `${id}:${key}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }
  return {
    root,
    dispose() {
      for (const geometry of owned) geometry.dispose();
      root.clear();
    }
  };
}

export default createModule;

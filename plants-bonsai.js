import { layout } from './layout.js';
import * as palette from './materials.js';

// Engine and existing material instances are supplied by the integrator.
export function createModule(context) {
  const T = context.THREE || context.engine;
  const registry = context.materials;
  if (!T || !registry) throw new Error('plants-bonsai requires THREE and a shared material registry');
  const material = name => {
    const value = typeof registry.get === 'function' ? registry.get(name) : registry[name];
    if (!value) throw new Error(`Missing shared material: ${name}`);
    return value;
  };
  const wood = material('chestnutWood');
  const green = material('foliage');
  const stone = material('lakeStone');
  const slate = material('slate');
  const seed = palette.SEED ?? palette.materials.random.seed;
  const root = new T.Group();
  root.name = 'plants-bonsai';
  const owned = new Set();
  const geometry = g => { owned.add(g); return g; };
  const twigGeometry = geometry(new T.CylinderGeometry(1, 1, 1, 7));
  const crownGeometry = geometry(new T.IcosahedronGeometry(1, 1));
  const leafGeometry = geometry(new T.SphereGeometry(1, 5, 3));
  const boxGeometry = geometry(new T.BoxGeometry(1, 1, 1));
  const up = new T.Vector3(0, 1, 0);
  const stream = id => {
    let h = palette.materials.random.fnv1aOffsetBasis;
    for (const byte of new TextEncoder().encode(id)) h = Math.imul(h ^ byte, palette.materials.random.fnv1aPrime);
    let state = (seed ^ h) >>> 0;
    return () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let n = state;
      n = Math.imul(n ^ n >>> 15, n | 1);
      n ^= n + Math.imul(n ^ n >>> 7, n | 61);
      return ((n ^ n >>> 14) >>> 0) / 4294967296;
    };
  };
  function mesh(g, m, p, scale, parent = root) {
    const result = new T.Mesh(g, m);
    result.position.set(...p);
    result.scale.set(...scale);
    result.castShadow = result.receiveShadow = true;
    parent.add(result);
    return result;
  }
  function branch(a, b, radius, taper = 0.65) {
    const direction = new T.Vector3(...b).sub(new T.Vector3(...a));
    const g = geometry(new T.CylinderGeometry(radius * taper, radius, direction.length(), 7));
    const part = mesh(g, wood, a.map((v, i) => (v + b[i]) / 2), [1, 1, 1]);
    part.quaternion.setFromUnitVectors(up, direction.normalize());
    return part;
  }
  // Broken crown islands preserve visible branching and negative space from above.
  function tree(center, radius, height, id, bonsai = false) {
    const r = stream(id);
    const [x, y, z] = center;
    const bend = radius * 0.12;
    const elbow = [x + bend, y + height * 0.34, z - bend * 0.5];
    const top = [x - bend * 0.6, y + height * 0.76, z + bend * 0.4];
    branch(center, elbow, height * (bonsai ? 0.048 : 0.025));
    branch(elbow, top, height * (bonsai ? 0.034 : 0.018));
    const count = bonsai ? 5 : 7;
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399963229728653 + r() * 0.35;
      const reach = radius * (0.36 + r() * 0.27);
      const level = height * (0.53 + (i / count) * 0.29);
      const end = [x + Math.cos(angle) * reach, y + level, z + Math.sin(angle) * reach];
      const start = [elbow[0], y + level * 0.73, elbow[2]];
      branch(start, end, height * 0.012, 0.35);
      const spread = radius * (0.23 + r() * 0.10);
      mesh(crownGeometry, green, end, [spread, Math.min(height * 0.12, spread * 0.65), spread * 0.88]);
      for (let j = 0; j < 12; j++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * spread;
        const p = [end[0] + Math.cos(a) * d, end[1] + (r() - 0.5) * spread * 0.65, end[2] + Math.sin(a) * d * 0.85];
        const leaf = mesh(leafGeometry, green, p, [spread * 0.22, spread * 0.07, spread * 0.10]);
        leaf.rotation.set(r(), a, r());
      }
    }
  }
  function groundcover(center, radius, id) {
    const r = stream(id);
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * radius * 0.86;
      const p = [center[0] + Math.cos(a) * d, center[1], center[2] + Math.sin(a) * d];
      for (let j = 0; j < 3; j++) {
        const s = radius * (0.05 + r() * 0.04);
        const leaf = mesh(leafGeometry, green, [p[0], p[1] + s, p[2]], [s * 0.45, s * 1.8, s * 0.3]);
        leaf.rotation.set((r() - 0.5) * 0.8, r() * Math.PI, (r() - 0.5) * 0.8);
      }
    }
  }
  function bamboo(center, radius, id) {
    const r = stream(id);
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2;
      const d = radius * Math.sqrt(r()) * 0.36;
      const x = center[0] + Math.cos(a) * d;
      const z = center[2] + Math.sin(a) * d;
      const height = radius * (1.1 + r() * 0.65);
      const culm = radius * 0.018;
      mesh(twigGeometry, green, [x, center[1] + height / 2, z], [culm, height, culm]);
      for (let j = 1; j < 7; j++) {
        const y = center[1] + height * j / 7;
        mesh(twigGeometry, wood, [x, y, z], [culm * 1.16, culm * 0.6, culm * 1.16]);
        if (j < 3) continue;
        const angle = a + j * 2.4;
        for (let k = 0; k < 4; k++) {
          const f = (k + 1) / 5;
          const reach = radius * 0.34 * f;
          const leaf = mesh(leafGeometry, green, [x + Math.cos(angle) * reach, y + radius * 0.10 * f, z + Math.sin(angle) * reach], [radius * 0.13, radius * 0.018, radius * 0.035]);
          leaf.rotation.y = -angle;
          leaf.rotation.z = (k % 2 ? -1 : 1) * 0.35;
        }
      }
    }
  }
  layout.reservedZones.planting.trees.forEach((zone, i) => {
    tree(zone.center, zone.canopyRadius, Math.min(zone.height, layout.site.maxCanopyY - zone.center[1]), `tree:${i}`);
    groundcover(zone.center, zone.canopyRadius * 0.65, `tree-ground:${i}`);
  });
  layout.reservedZones.planting.shrubs.forEach((zone, i) => {
    const r = stream(`shrub:${i}`);
    groundcover(zone.center, zone.radius, `shrub-ground:${i}`);
    for (let j = 0; j < 5; j++) {
      const a = j * 2.4 + r() * 0.4;
      const d = zone.radius * (0.25 + r() * 0.25);
      mesh(crownGeometry, green, [zone.center[0] + Math.cos(a) * d, zone.center[1] + zone.radius * 0.22, zone.center[2] + Math.sin(a) * d], [zone.radius * 0.28, zone.radius * 0.25, zone.radius * 0.25]);
    }
    // Bamboo shares the declared shrub envelope; no new world placement.
    bamboo(zone.center, zone.radius, `bamboo:${i}`);
  });
  const table = layout.objects.find(object => object.id === 'bonsai');
  if (!table) throw new Error('Missing bonsai layout');
  const [w, h, d] = table.size;
  const [x, y, z] = table.position;
  mesh(boxGeometry, slate, [x, y + h * 0.92, z], [w, h * 0.16, d]);
  for (const side of [-1, 1]) {
    mesh(boxGeometry, stone, [x + side * w * 0.34, y + h * 0.42, z], [w * 0.12, h * 0.84, d * 0.72]);
  }
  for (let i = 0; i < table.potCount; i++) {
    const px = x + ((i + 0.5) / table.potCount - 0.5) * w;
    const radius = Math.min(w / table.potCount * 0.38, d * 0.37);
    const potHeight = table.plantMaxHeight * 0.16;
    // Revolved wall has an actual open mouth and inner surface, with a closed base.
    const profile = [[0, 0], [radius * 0.67, 0], [radius, potHeight], [radius * 0.86, potHeight], [radius * 0.56, potHeight * 0.18], [0, potHeight * 0.18]];
    const pot = geometry(new T.LatheGeometry(profile.map(([a, b]) => new T.Vector2(a, b)), 16));
    mesh(pot, slate, [px, y + h, z], [1, 1, 1]);
    mesh(twigGeometry, stone, [px, y + h + potHeight * 0.65, z], [radius * 0.67, potHeight * 0.12, radius * 0.67]);
    tree([px, y + h + potHeight * 0.71, z], radius * 0.92, table.plantMaxHeight - potHeight, `bonsai:${i}`, true);
  }
  root.userData.seed = seed;
  root.userData.staticVegetation = true;
  let disposed = false;
  return {
    root,
    // Static geometry is deliberately independent of frame order and elapsed time.
    update() {},
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      for (const g of owned) g.dispose();
      root.clear();
    },
  };
}

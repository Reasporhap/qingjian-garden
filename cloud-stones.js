import { layout } from './layout.js';
import { materials as specification } from './materials.js';

// No engine import: the integrator supplies THREE and its shared material registry.
// Vertex colours are optional; moving inner-wall geometry also changes real shading
// with an ordinary shared lakeStone material, without a shader/material override.
export function createModule(context) {
  const THREE = context.THREE ?? context.engine;
  const registry = context.materials ?? context.materialRegistry;
  const stone = registry?.get ? registry.get('lakeStone') : registry?.lakeStone;
  if (!THREE?.BufferGeometry || !stone?.isMaterial) {
    throw new Error('cloudStones requires context.THREE and shared lakeStone material');
  }
  const spec = layout.objects.find(object => object.id === 'cloudStones');
  if (!spec || spec.throughHoles.length < 2) throw new Error('Missing cloudStones layout');
  const [width, height, depth] = spec.size;
  const origin = spec.position;
  const holes = spec.throughHoles.map(h => ({
    center: h.center.map((v, i) => v - origin[i]), radii: h.radii,
  }));
  let hash = specification.random.fnv1aOffsetBasis >>> 0;
  for (const byte of new TextEncoder().encode('cloudStones:skin')) {
    hash = Math.imul(hash ^ byte, specification.random.fnv1aPrime) >>> 0;
  }
  let state = (specification.random.seed ^ hash) >>> 0;
  function random() {
    let n = state = (state + 0x6D2B79F5) >>> 0;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  }
  const phase = Array.from({ length: 6 }, () => random() * Math.PI * 2);
  const relief = specification.materials.lakeStone.geometryReliefM;
  const tau = Math.PI * 2;
  // Dimensionless local construction proportions, never replacement world positions.
  const peaks = [
    [-0.31, 0.33, 0.20, 0.33, 0.32],
    [-0.065, 0.50, 0.23, 0.50, 0.41],
    [0.30, 0.38, 0.19, 0.38, 0.33],
    [0, 0.075, 0.49, 0.075, 0.43],
  ];
  function tunnel(p, h) {
    const z = (p[2] - h.center[2]) / h.radii[2];
    const a = Math.atan2((p[1] - h.center[1]) / h.radii[1],
      (p[0] - h.center[0]) / h.radii[0]);
    const wrinkle = 1 + 0.075 * Math.sin(5 * a + phase[0] + z)
      + 0.045 * Math.sin(9 * a - 2 * z + phase[1]);
    return Math.hypot((p[0] - h.center[0]) / h.radii[0],
      (p[1] - h.center[1]) / h.radii[1]) - wrinkle;
  }
  function field(p) {
    let body = Infinity;
    for (const [cx, cy, rx, ry, rz] of peaks) {
      const e = Math.hypot((p[0] / width - cx) / rx,
        (p[1] / height - cy) / ry, p[2] / depth / rz) - 1;
      body = Math.min(body, e);
    }
    const folds = Math.sin(p[1] / height * 31 + p[0] / width * 17 + phase[2])
      * Math.sin(p[2] / depth * 19 + phase[3]);
    body += folds * relief[1] / height * 0.65;
    // Difference with infinite, irregular cylinders: no end caps across either hole.
    for (const hole of holes) body = Math.max(body, -tunnel(p, hole));
    return Math.max(body, -p[1] / height, p[1] / height - 1,
      Math.abs(p[0]) / width - 0.5, Math.abs(p[2]) / depth - 0.5);
  }
  const divisions = [72, 56, 40];
  const point = (x, y, z) => [width * (x / divisions[0] - 0.5),
    height * (y / divisions[1]), depth * (z / divisions[2] - 0.5)];
  const stride = divisions[0] + 1;
  const layer = stride * (divisions[1] + 1);
  const index = (x, y, z) => z * layer + y * stride + x;
  const values = new Float32Array(layer * (divisions[2] + 1));
  for (let z = 0; z <= divisions[2]; z++)
    for (let y = 0; y <= divisions[1]; y++)
      for (let x = 0; x <= divisions[0]; x++) values[index(x, y, z)] = field(point(x, y, z));
  const corners = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],
    [0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  const tetrahedra = [[0,1,2,6],[0,2,3,6],[0,3,7,6],
    [0,7,4,6],[0,4,5,6],[0,5,1,6]];
  const positions = [];
  function triangle(a, b, c) {
    const u = b.map((v,i) => v-a[i]), v = c.map((n,i) => n-a[i]);
    const normal = [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const center = a.map((n,i) => (n+b[i]+c[i])/3);
    const length = Math.hypot(...normal);
    if (length < 1e-12) return;
    const epsilon = Math.min(...spec.size) * 1e-5;
    const outward = center.map((n,i) => n+normal[i]/length*epsilon);
    if (field(outward) < field(center)) [b,c] = [c,b];
    positions.push(...a,...b,...c);
  }
  for (let z=0; z<divisions[2]; z++) for (let y=0; y<divisions[1]; y++)
    for (let x=0; x<divisions[0]; x++) {
      const ps = corners.map(([dx,dy,dz]) => point(x+dx,y+dy,z+dz));
      const vs = corners.map(([dx,dy,dz]) => values[index(x+dx,y+dy,z+dz)]);
      for (const tetra of tetrahedra) {
        const inside = tetra.filter(i => vs[i]<0), outside = tetra.filter(i => vs[i]>=0);
        if (!inside.length || !outside.length) continue;
        const cross = (a,b) => ps[a].map((n,i) => n+(ps[b][i]-n)*vs[a]/(vs[a]-vs[b]));
        if (inside.length===1) triangle(...outside.map(b => cross(inside[0],b)));
        else if (outside.length===1) triangle(...inside.map(a => cross(a,outside[0])));
        else {
          const [a,b] = inside, [c,d] = outside;
          const ac=cross(a,c), ad=cross(a,d), bc=cross(b,c), bd=cross(b,d);
          triangle(ac,ad,bc); triangle(ad,bd,bc);
        }
      }
    }
  const geometry = new THREE.BufferGeometry();
  const rest = new Float32Array(positions);
  const attribute = new THREE.BufferAttribute(new Float32Array(rest),3);
  geometry.setAttribute('position',attribute);
  const root = new THREE.Group();
  root.name = 'cloudStones';
  root.position.set(...origin); // Hole centers are already converted from world space.
  const mesh = new THREE.Mesh(geometry,stone);
  mesh.name = 'cloudStones:perforated-three-peaks';
  mesh.castShadow = mesh.receiveShadow = true;
  root.add(mesh);
  const optics = specification.auxiliaryOptics.movingLight;
  // Analytic, texture-free receiver response for the integrator's water optics.
  function sampleLight(worldPosition,t) {
    const p = worldPosition.map((v,i) => v-origin[i]);
    const phaseT = tau * t / optics.periodS;
    const band = Math.sin(p[1]/height*27 + p[2]/depth*11 - phaseT + phase[4]);
    return optics.strength * Math.pow(0.5+0.5*band,3);
  }
  function update(t) {
    if (!Number.isFinite(t)) throw new TypeError('cloudStones.update requires finite absolute seconds');
    const phaseT = tau * t / optics.periodS;
    for (let i=0; i<rest.length; i+=3) {
      const p = [rest[i],rest[i+1],rest[i+2]];
      let closest = holes[0];
      for (const h of holes) if (Math.abs(tunnel(p,h)) < Math.abs(tunnel(p,closest))) closest=h;
      const wall = Math.exp(-Math.pow(tunnel(p,closest)/0.16,2));
      const angle = Math.atan2((p[1]-closest.center[1])/closest.radii[1],
        (p[0]-closest.center[0])/closest.radii[0]);
      // Small travelling flutes change surface normals and physical shadowing.
      // They never cross the central aperture; no accumulating frame state.
      const displacement = relief[0]*wall*Math.sin(7*angle+p[2]/depth*24-phaseT+phase[5]);
      attribute.array[i] = p[0]+Math.cos(angle)*displacement;
      attribute.array[i+1] = p[1]+Math.sin(angle)*displacement;
      attribute.array[i+2] = p[2];
    }
    attribute.needsUpdate=true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
  update(0);
  root.userData.cloudStones = { throughHoles: spec.throughHoles,
    movingLightPeriodS: optics.periodS, sampleLight };
  return { root, update, sampleLight, opticalResponse: { sampleLight,
    periodS: optics.periodS, receiver: mesh }, dispose() {
    root.remove(mesh);
    geometry.dispose(); // Shared registry materials belong to the integrator.
  } };
}

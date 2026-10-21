import { layout } from './layout.js';
import { materials as specification } from './materials.js';

const TAU = Math.PI * 2;
const SEED = specification.random.seed;

// Independent UTF-8 FNV-1a / mulberry32 streams; construction order is irrelevant.
function stream(id) {
  let h = specification.random.fnv1aOffsetBasis;
  for (const b of new TextEncoder().encode(id)) {
    h = Math.imul(h ^ b, specification.random.fnv1aPrime) >>> 0;
  }
  let state = (SEED ^ h) >>> 0;
  return () => {
    let n = state = (state + 0x6D2B79F5) >>> 0;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * context.THREE: renderer-supplied engine, never imported here.
 * context.materials: registry with get(key), or an object indexed by key.
 * Required keys: water, foliage, bud, plaster, chestnutWood.
 * water and bud are shared auxiliary optics instances supplied by the integrator.
 * This module neither creates, mutates, clones nor disposes shared materials.
 */
export function createModule(context) {
  const T = context.THREE;
  if (!T) throw new Error('water-life requires context.THREE');
  const registry = context.materials;
  function material(key) {
    const value = typeof registry?.get === 'function' ? registry.get(key) : registry?.[key];
    if (!value?.isMaterial) throw new Error(`water-life: missing shared material '${key}'`);
    return value;
  }
  const palette = Object.fromEntries(
    ['water', 'foliage', 'bud', 'plaster', 'chestnutWood'].map(k => [k, material(k)])
  );
  const root = new T.Group();
  root.name = 'water-life';
  const ownedGeometry = new Set();
  const zone = layout.reservedZones.waterLife;
  const pool = layout.objects.find(o => o.id === 'pool');
  const waterY = layout.site.waterY;
  const optics = specification.auxiliaryOptics;
  const amplitude = optics.water.waveHeightM;
  const omega = TAU / optics.water.wavePeriodS;
  const depth = waterY - layout.site.poolBottomY;

  function mesh(geometry, mat, parent = root, name = '') {
    ownedGeometry.add(geometry);
    const result = new T.Mesh(geometry, mat);
    result.name = name;
    result.castShadow = mat !== palette.water;
    result.receiveShadow = true;
    parent.add(result);
    return result;
  }
  function geometry(positions, indices) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    if (indices) g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }
  // Two analytic waves, exactly periodic in absolute time; no accumulated phase.
  function wave(x, z, t) {
    return amplitude * (0.64 * Math.sin(x * 1.7 + z * 0.8 - omega * t)
      + 0.36 * Math.sin(x * -1.1 + z * 2.3 + omega * t));
  }
  const contour = pool.outlineXZ.map(([x, z]) => new T.Vector2(x, z));
  const waterPositions = [];
  function subdivide(a, b, c, remaining) {
    if (!remaining) {
      // Reverse XZ winding so the front side faces upward.
      for (const p of [a, c, b]) waterPositions.push(p.x, waterY, p.y);
      return;
    }
    const ab = a.clone().add(b).multiplyScalar(0.5);
    const bc = b.clone().add(c).multiplyScalar(0.5);
    const ca = c.clone().add(a).multiplyScalar(0.5);
    subdivide(a, ab, ca, remaining - 1);
    subdivide(ab, b, bc, remaining - 1);
    subdivide(ca, bc, c, remaining - 1);
    subdivide(ab, bc, ca, remaining - 1);
  }
  // ShapeUtils preserves the exact concave pool boundary; no bounding-box sheet.
  for (const face of T.ShapeUtils.triangulateShape(contour, [])) {
    const [a, b, c] = face.map(i => contour[i]);
    const cross = (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    subdivide(a, cross > 0 ? b : c, cross > 0 ? c : b, 5);
  }
  const water = mesh(geometry(waterPositions), palette.water, root, 'pool-surface');
  water.castShadow = false;
  water.geometry.getAttribute('position').setUsage(T.DynamicDrawUsage);
  water.geometry.computeBoundingSphere();
  water.geometry.boundingSphere.radius += amplitude;

  // Closed thin parametric shells retain visible edges with ordinary front-side materials.
  function shell(sample, rows, columns, thickness) {
    const p = [], ix = [];
    const sideSize = (rows + 1) * (columns + 1);
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i <= rows; i++) for (let j = 0; j <= columns; j++) {
        const v = sample(i / rows, j / columns);
        p.push(v[0], v[1] - side * thickness, v[2]);
      }
    }
    function quad(a,b,c,d) { ix.push(a,b,d,b,c,d); }
    for (let i=0;i<rows;i++) for(let j=0;j<columns;j++) {
      const a=i*(columns+1)+j, b=a+columns+1;
      quad(a,a+1,b+1,b);
      quad(a+sideSize,b+sideSize,b+1+sideSize,a+1+sideSize);
    }
    const rim=[];
    for(let i=0;i<=rows;i++) rim.push(i*(columns+1));
    for(let j=1;j<=columns;j++) rim.push(rows*(columns+1)+j);
    for(let i=rows-1;i>=0;i--) rim.push(i*(columns+1)+columns);
    for(let j=columns-1;j>0;j--) rim.push(j);
    for(let i=0;i<rim.length;i++) {
      const a=rim[i], b=rim[(i+1)%rim.length];
      quad(a,a+sideSize,b+sideSize,b);
    }
    return geometry(p, ix);
  }
  function tube(points, radius, mat, parent, name) {
    return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(
      points.map(p => new T.Vector3(...p))), 20, radius, 6, false), mat, parent, name);
  }
  const floating = [];
  for (const [bedIndex, bed] of zone.lotusBeds.entries()) {
    const random = stream(`water-life/bed/${bedIndex}`);
    for (let i=0;i<9;i++) {
      const a = TAU * (i / 9 + random() * 0.04);
      const radial = bed.radius * (0.40 + random() * 0.37);
      const radius = bed.radius * (0.15 + random() * 0.065);
      const leaf = new T.Group();
      leaf.name = `lotus-leaf-${bedIndex}-${i}`;
      leaf.position.set(bed.center[0]+Math.cos(a)*radial,waterY+amplitude*1.3,
        bed.center[2]+Math.sin(a)*radial);
      leaf.rotation.y = a;
      root.add(leaf);
      // A real radial slit, scalloped margin and shallow bowl, rather than a disk decal.
      mesh(shell((u,v) => {
        const angle = 0.12 + v*(TAU-0.24);
        const r=radius*u*(1+0.025*Math.sin(angle*11));
        return [r*Math.cos(angle), radius*(0.035*u*u+0.012*Math.sin(angle*9)*u*u),r*Math.sin(angle)];
      },12,72,radius*0.014), palette.foliage,leaf,'notched-lily-pad');
      for(let vein=0;vein<9;vein++) {
        const angle=0.18+(TAU-0.36)*vein/9;
        tube([0.12,0.5,0.92].map(u=>[radius*u*Math.cos(angle),
          radius*(0.035*u*u+0.014),radius*u*Math.sin(angle)]),
        radius*0.005,palette.foliage,leaf,'raised-radial-vein');
      }
      floating.push({leaf, base:leaf.position.y, phase:random()*TAU});
    }
    // Slender emergent leaves stay inside each aquatic planting envelope.
    for(let i=0;i<5;i++) {
      const a=random()*TAU, r=bed.radius*0.82;
      const blade=mesh(shell((u,v)=>{
        const w=bed.radius*0.018*Math.sin(Math.PI*u)*(2*v-1);
        return [w+Math.sin(a)*u*u*bed.radius*0.12,
          u*bed.radius*0.36,Math.cos(a)*u*u*bed.radius*0.12];
      },18,4,bed.radius*0.003),palette.foliage,root,'aquatic-blade');
      blade.position.set(bed.center[0]+Math.cos(a)*r,waterY,bed.center[2]+Math.sin(a)*r);
    }
  }

  // Hero bud is static, exactly at the shared shot-2 target: no bobbing during the hold.
  const bud = new T.Group();
  bud.name = 'hero-lotus-bud';
  bud.position.fromArray(zone.budPosition);
  root.add(bud);
  const budHeight = (zone.budPosition[1]-waterY)*0.86;
  const budWidth = budHeight*0.33;
  tube([[0,layout.site.poolBottomY-zone.budPosition[1],0],
    [-budWidth*0.2,-budHeight,0],[0,-budHeight*0.48,0]],
  budWidth*0.105,palette.foliage,bud,'bud-pedicel');
  // Tightly imbricated pointed petals: fine longitudinal ribs and physically closed rims.
  for(let layer=0;layer<3;layer++) {
    const count=layer===0?7:5;
    for(let i=0;i<count;i++) {
      const angle=TAU*(i/count+layer*0.071);
      const petal=mesh(shell((u,v)=>{
        const across=(v-0.5)*2;
        const profile=Math.pow(Math.sin(Math.PI*u),0.78);
        const radius=budWidth*(1-layer*0.19)*profile;
        const theta=angle+across*(0.55-layer*0.05)*Math.sin(Math.PI*u);
        const rib=budWidth*0.012*Math.cos(across*Math.PI*6)*Math.sin(Math.PI*u);
        return [(radius+rib)*Math.cos(theta),
          budHeight*(u-0.5)*(1-layer*0.065), (radius+rib)*Math.sin(theta)];
      },48,20,budWidth*0.018),palette.bud,bud,`bud-petal-${layer}-${i}`);
      petal.castShadow=true;
    }
  }
  for(let i=0;i<5;i++) {
    const angle=TAU*i/5;
    mesh(shell((u,v)=>{
      const width=budWidth*0.48*Math.sin(Math.PI*u)*(2*v-1);
      const r=budWidth*(0.17+0.95*Math.sin(Math.PI*u*0.83));
      return [r*Math.cos(angle)-width*Math.sin(angle),
        budHeight*(-0.56+u*0.65),r*Math.sin(angle)+width*Math.cos(angle)];
    },28,10,budWidth*0.02),palette.foliage,bud,'pointed-sepal');
  }

  const bounds=zone.fishSwimmingBounds;
  const middle=bounds.min.map((n,i)=>(n+bounds.max[i])*0.5);
  const half=bounds.min.map((n,i)=>(bounds.max[i]-n)*0.5);
  const fish=[];
  for(let i=0;i<optics.fish.maxCount;i++) {
    const random=stream(`water-life/fish/${i}`);
    const animal=new T.Group(); animal.name=`fish-${i}`; root.add(animal);
    const length=depth*(0.19+random()*0.12);
    const body=mesh(new T.SphereGeometry(1,24,14),i%3===0?palette.bud:palette.plaster,animal,'fish-body');
    body.scale.set(length*0.19,length*0.15,length*0.5);
    const tail=new T.Group();tail.position.z=-length*0.45;animal.add(tail);
    mesh(shell((u,v)=>[length*(v-0.5)*0.58*u,
      length*0.018*Math.sin(Math.PI*u),-length*u*(0.20+0.10*Math.abs(2*v-1))],8,8,length*0.012),
    palette.bud,tail,'fork-tail');
    for(const side of [-1,1]) {
      const eye=mesh(new T.SphereGeometry(length*0.022,8,6),palette.chestnutWood,animal,'eye');
      eye.position.set(side*length*0.155,length*0.045,length*0.31);
      mesh(shell((u,v)=>[side*length*(0.12+0.25*u),
        -length*0.04*u,-length*0.2*u*(v+0.3)],5,5,length*0.008),
      palette.bud,animal,'pectoral-fin');
    }
    fish.push({animal,tail,phase:random()*TAU,speed:0.13+random()*0.1,
      rx:half[0]*(0.38+random()*0.43),rz:half[2]*(0.4+random()*0.39),
      y:middle[1]+(random()-0.5)*half[1]*0.9,length});
  }
  function sampleFish(record,t) {
    const a=record.phase+t*record.speed;
    return {position:[middle[0]+record.rx*Math.cos(a),
      record.y+half[1]*0.10*Math.sin(a*2),middle[2]+record.rz*Math.sin(a)],
    heading:Math.atan2(-record.rx*Math.sin(a),record.rz*Math.cos(a)),
    tail:0.32*Math.sin(t*record.speed*30+record.phase)};
  }
  function update(t) {
    if(!Number.isFinite(t)) throw new TypeError('water-life.update requires finite absolute seconds');
    const positions=water.geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++) {
      positions.setY(i,waterY+wave(positions.getX(i),positions.getZ(i),t));
    }
    positions.needsUpdate=true;
    water.geometry.computeVertexNormals();
    for(const f of floating) {
      f.leaf.position.y=f.base+wave(f.leaf.position.x,f.leaf.position.z,t)*0.22;
      f.leaf.rotation.x=0.008*Math.sin(omega*t+f.phase);
      f.leaf.rotation.z=0.008*Math.cos(omega*t+f.phase);
    }
    for(const f of fish) {
      const sample=sampleFish(f,t);
      f.animal.position.fromArray(sample.position);
      f.animal.rotation.y=sample.heading;
      f.tail.rotation.y=sample.tail;
    }
  }
  // Declarative integration contract only: no lights, scene mutation or fake projected patches.
  const opticalResponse={
    type:'analytic-water-reflection',boundsXZ:pool.outlineXZ.map(p=>[...p]),
    waterY,ior:optics.water.ior,roughness:optics.water.roughness,
    opacity:optics.water.opacity,sunDirection:[...specification.sun.directionToSun],
    periodS:optics.movingLight.periodS,strength:optics.movingLight.strength,
    heightAt:(x,z,t)=>waterY+wave(x,z,t),
    modulationAt:(x,z,t)=>1+optics.movingLight.strength*
      Math.sin(x*1.7+z*0.8-TAU*t/optics.movingLight.periodS)*
      Math.cos(x*-1.1+z*2.3+TAU*t/optics.movingLight.periodS)
  };
  update(0);
  return {root,update,opticalResponse,dispose(){
    for(const g of ownedGeometry) g.dispose();
    ownedGeometry.clear();
    root.removeFromParent();
  }};
}

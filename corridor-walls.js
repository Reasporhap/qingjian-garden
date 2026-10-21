import { layout } from './layout.js';
import { materials as specification } from './materials.js';

// Engine and existing material instances belong to the integrator.
export function createModule(context) {
  const T = context.THREE;
  const registry = context.materials;
  if (!T || !registry) throw new Error('corridor-walls requires context.THREE and context.materials');
  const root = new T.Group();
  root.name = 'corridor-walls';
  const geometries = new Set();
  const material = key => {
    const value = registry instanceof Map ? registry.get(key) : registry[key];
    if (!value || !specification.materials[key]) throw new Error(`Missing shared material: ${key}`);
    return value;
  };
  function mesh(geometry, key, name, parent = root) {
    geometries.add(geometry);
    const node = new T.Mesh(geometry, material(key));
    node.name = name;
    node.castShadow = node.receiveShadow = true;
    parent.add(node);
    return node;
  }
  function box(size, position, key, name, parent = root) {
    const node = mesh(new T.BoxGeometry(...size), key, name, parent);
    node.position.set(...position);
    return node;
  }
  function beam(a, b, width, depth, key, name, parent = root) {
    const start = new T.Vector3(...a), end = new T.Vector3(...b);
    const node = mesh(new T.BoxGeometry(width, start.distanceTo(end), depth), key, name, parent);
    node.position.copy(start).add(end).multiplyScalar(0.5);
    node.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), end.sub(start).normalize());
    return node;
  }
  function rectangle(shape, x0, y0, x1, y1) {
    shape.moveTo(x0, y0); shape.lineTo(x1, y0); shape.lineTo(x1, y1);
    shape.lineTo(x0, y1); shape.closePath();
  }
  const wall = layout.objects.find(o => o.id === 'wall');
  const corridor = layout.objects.find(o => o.id === 'corridor');
  const gate = wall.moonGate;
  for (const segment of wall.segments) {
    const [ax, ay, az] = segment.from, [bx, , bz] = segment.to;
    const dx = bx - ax, dz = bz - az, length = Math.hypot(dx, dz);
    const group = new T.Group(); group.name = segment.id;
    group.position.set(ax, ay, az); group.rotation.y = -Math.atan2(dz, dx);
    root.add(group);
    const shape = new T.Shape(); rectangle(shape, 0, 0, length, segment.height);
    const windows = wall.windows.filter(w => {
      const along = ((w.center[0] - ax) * dx + (w.center[2] - az) * dz) / length;
      const across = ((w.center[0] - ax) * dz - (w.center[2] - az) * dx) / length;
      return Math.abs(across) < segment.thickness / 2 && along > 0 && along < length;
    });
    for (const window of windows) {
      const u = ((window.center[0] - ax) * dx + (window.center[2] - az) * dz) / length;
      const v = window.center[1] - ay;
      const w = Math.abs(dx) > Math.abs(dz) ? window.size[0] : window.size[2];
      const h = window.size[1], bar = window.barWidth;
      const hole = new T.Path(); rectangle(hole, u-w/2, v-h/2, u+w/2, v+h/2); shape.holes.push(hole);
      const frame = new T.Group(); frame.name = window.id; group.add(frame);
      // No pane or backing surface: every cell is open through the complete wall.
      const localBeam = (a,b,label) => beam([u+a[0],v+a[1],0], [u+b[0],v+b[1],0],bar,window.size[0], 'chestnutWood',label,frame);
      localBeam([-w/2,-h/2],[w/2,-h/2],'sill'); localBeam([-w/2,h/2],[w/2,h/2],'lintel');
      localBeam([-w/2,-h/2],[-w/2,h/2],'jamb'); localBeam([w/2,-h/2],[w/2,h/2],'jamb');
      const spacing = (window.clearSpacingRange[0] + window.clearSpacingRange[1]) / 2 + bar;
      const columns = Math.ceil(w / spacing), rows = Math.ceil(h / spacing);
      // Alternating polyline joints give an open, sparse ice-crack lattice.
      for (let i=1;i<columns;i++) {
        let previous = [-w/2+w*i/columns,-h/2];
        for (let j=1;j<=rows;j++) {
          const point = [-w/2+w*i/columns+(j===rows?0:((i+j)%2?1:-1)*bar/2),-h/2+h*j/rows];
          localBeam(previous,point,'ice-crack'); previous=point;
        }
      }
      for (let j=1;j<rows;j++) {
        let previous=[-w/2,-h/2+h*j/rows];
        for (let i=1;i<=columns;i++) {
          const point=[-w/2+w*i/columns,-h/2+h*j/rows+(i===columns?0:((i+j)%2?1:-1)*bar/2)];
          localBeam(previous,point,'ice-crack'); previous=point;
        }
      }
      const r = spacing / 2;
      const diamond=[[0,r],[r,0],[0,-r],[-r,0],[0,r]];
      for(let i=0;i<4;i++) localBeam(diamond[i],diamond[i+1],'diamond');
      frame.userData.minimumVoidRatio = window.voidRatioMin;
    }
    const gateAcross = ((gate.center[0]-ax)*dz-(gate.center[2]-az)*dx)/length;
    if (Math.abs(gateAcross)<segment.thickness/2) {
      const u=((gate.center[0]-ax)*dx+(gate.center[2]-az)*dz)/length;
      if(u>0 && u<length) {
        const hole=new T.Path(); hole.absarc(u,gate.center[1]-ay,gate.diameter/2,0,Math.PI*2,true); shape.holes.push(hole);
        const ring=new T.Shape(); ring.absarc(u,gate.center[1]-ay,gate.diameter/2+segment.thickness/3,0,Math.PI*2,false);
        const inner=new T.Path(); inner.absarc(u,gate.center[1]-ay,gate.diameter/2,0,Math.PI*2,true); ring.holes.push(inner);
        // Clip the ring below ground, preserving the floor-tangent clear opening.
        const rim=mesh(new T.ExtrudeGeometry(ring,{depth:segment.thickness,bevelEnabled:false,curveSegments:96}),'slate','moon-gate-rim',group);
        rim.position.z=-segment.thickness/2;
      }
    }
    const masonry=mesh(new T.ExtrudeGeometry(shape,{depth:segment.thickness,bevelEnabled:false,curveSegments:96}),'plaster',`${segment.id}-perforated`,group);
    masonry.position.z=-segment.thickness/2;
    box([length,segment.thickness/3,segment.thickness*1.5],[length/2,segment.height+segment.thickness/6,0],'roofTile','wall-cap',group);
  }
  const receiver=wall.shadowReceiver;
  box(receiver.size,[receiver.position[0],receiver.position[1]+receiver.size[1]/2,receiver.position[2]],'plaster',receiver.id);

  // Each path leg uses its own local basis; no parent world offset is reapplied.
  const roofHalf=corridor.width/2+corridor.eaveOverhang;
  const rise=roofHalf*Math.tan(corridor.roofSlopeDeg*Math.PI/180);
  const roofThickness=corridor.width/40;
  for(const path of corridor.segments) for(let i=1;i<path.points.length;i++) {
    const a=path.points[i-1],b=path.points[i],length=Math.hypot(b[0]-a[0],b[2]-a[2]);
    const leg=new T.Group(); leg.name=`corridor-${path.id}-${i}`;
    leg.position.set(...a); leg.rotation.y=-Math.atan2(b[2]-a[2],b[0]-a[0]); root.add(leg);
    const eave=corridor.size[1]-rise;
    box([length,corridor.width/12,corridor.width],[length/2,-corridor.width/24,0],'slate','walkway',leg);
    const bays=Math.ceil(length/(corridor.width*1.5));
    for(let j=0;j<=bays;j++) for(const side of [-1,1]) {
      const x=length*j/bays,z=side*(corridor.width/2-corridor.width/18);
      box([corridor.width/10,eave,corridor.width/10],[x,eave/2,z],'chestnutWood','column',leg);
      box([corridor.width/7,corridor.width/12,corridor.width/7],[x,corridor.width/24,z],'lakeStone','column-foot',leg);
    }
    for(const side of [-1,1]) {
      box([length,corridor.width/10,corridor.width/10],[length/2,eave-corridor.width/20,side*corridor.width/2],'chestnutWood','eave-beam',leg);
      const slope=side*corridor.roofSlopeDeg*Math.PI/180;
      const panel=box([length,roofThickness,Math.hypot(roofHalf,rise)],[length/2,eave+rise/2,side*roofHalf/2],'roofTile','roof-slope',leg);
      panel.rotation.x=slope;
      const count=Math.ceil(length/(corridor.width/9));
      for(let k=0;k<=count;k++) {
        const tile=mesh(new T.CylinderGeometry(roofThickness,roofThickness,Math.hypot(roofHalf,rise),8,1,false,0,Math.PI),'roofTile','rounded-tile',leg);
        tile.position.set(length*k/count,eave+rise/2+roofThickness,side*roofHalf/2);
        tile.rotation.x=Math.PI/2+slope;
      }
    }
    beam([0,eave+rise,0],[length,eave+rise,0],roofThickness*2,roofThickness*2,'roofTile','ridge',leg);
  }

  // Hand-authored normalized stroke polylines, never fonts or image masks.
  const glyphs={
    '清':[[[.05,.8],[.16,.7]],[[.02,.54],[.13,.46]],[[.04,.1],[.18,.34]],[[.3,.81],[.9,.81]],[[.36,.65],[.84,.65]],[[.27,.5],[.95,.5]],[[.6,.95],[.6,.5]],[[.36,.08],[.36,.4],[.85,.4],[.85,.08],[.72,.08]],[[.36,.29],[.85,.29]],[[.36,.19],[.85,.19]]],
    '风':[[[.16,.08],[.22,.87],[.84,.87],[.84,.2],[.94,.08]],[[.34,.72],[.73,.23]],[[.72,.72],[.32,.23]]],
    '入':[[[.38,.9],[.5,.64],[.72,.27],[.91,.1]],[[.5,.64],[.33,.29],[.1,.1]]],
    '园':[[[.1,.08],[.1,.9],[.9,.9],[.9,.08],[.1,.08]],[[.28,.72],[.72,.72]],[[.22,.55],[.78,.55]],[[.4,.55],[.37,.29],[.23,.2]],[[.6,.55],[.6,.22],[.77,.22],[.79,.32]]],
    '山':[[[.12,.66],[.12,.16],[.88,.16],[.88,.66]],[[.5,.94],[.5,.16]]],
    '水':[[[.5,.95],[.5,.08],[.36,.08]],[[.12,.65],[.34,.65],[.25,.37],[.08,.2]],[[.86,.75],[.6,.54],[.74,.3],[.94,.15]]],
    '有':[[[.08,.77],[.92,.77]],[[.43,.95],[.3,.64],[.08,.43]],[[.32,.08],[.32,.59],[.81,.59],[.81,.08],[.68,.08]],[[.32,.42],[.81,.42]],[[.32,.26],[.81,.26]]],
    '声':[[[.07,.83],[.93,.83]],[[.5,.96],[.5,.65]],[[.18,.65],[.82,.65]],[[.23,.48],[.86,.48],[.86,.26],[.23,.26]],[[.55,.48],[.55,.26]],[[.23,.48],[.23,.23],[.1,.07]]]
  };
  for(const inscription of corridor.inscriptions) {
    const plaque=box(inscription.size,inscription.position,'lakeStone',inscription.id);
    plaque.userData.text=inscription.text;
    const characters=Array.from(inscription.text).filter(c=>glyphs[c]);
    const cell=inscription.size[2]/(characters.length+1);
    const height=Math.min(inscription.size[1]*.7,cell*.85);
    const relief=specification.materials.plaster.heightVariationM*4;
    characters.forEach((character,index)=>{
      for(const stroke of glyphs[character]) for(let j=1;j<stroke.length;j++) {
        const point=([u,v])=>[inscription.position[0]-inscription.size[0]/2-relief/2,inscription.position[1]+(v-.5)*height,inscription.position[2]+inscription.size[2]/2-cell*(index+1)-(u-.5)*height];
        // Face west: horizontal text runs toward south, as seen by camera 4.
        beam(point(stroke[j-1]),point(stroke[j]),relief, height/18,'slate',`inscription-${character}`);
      }
    });
  }
  root.userData.integrationNotes = [
    'Enable renderer shadow maps and the shared sun shadow camera; geometry alone cannot enable renderer shadows.',
    'Fixed sun projects latticeWindow center to receiver at approximately y=1.38, below s1Detail target; review layout camera anchor before shot acceptance.',
    'Pool and yellowRock must be supplied by their owning modules; moon gate contains no backdrop.'
  ];
  return {root, update() {}, dispose() { geometries.forEach(g=>g.dispose()); geometries.clear(); }};
}

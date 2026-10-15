// Layout spike (2026-10-15), kept for Stage 2. Not app code.
// Lays out the SPEC.md §4 example with elkjs, top-to-bottom and
// left-to-right, and prints node centres, port positions and edge routes.
// Run after `npm i elkjs`: node design/layout-spike.cjs
//
// What it established (see SPEC.md §5):
//  - 'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER' (+ considerModelOrder)
//    keeps the list's order, so a loop-back route is drawn as the loop
//    rather than ELK flipping the chart upside down to "fix" the cycle.
//    Without it, item 7 came out ABOVE item 6.
//  - Decisions need ports (one in, one per route) with FIXED_SIDE
//    constraints and centred alignment, so lines leave from the diamond's
//    points rather than anywhere along its bounding box.
const ELK = require('elkjs/lib/elk.bundled.js');
const elk = new ELK();
const N = [[1,120,44],[2,210,56],[3,190,114],[4,180,52],[5,120,44],[6,204,56],[7,190,114],[8,120,44]];
const E = [[1,2],[2,3],[3,4,'Yes'],[3,6,'No'],[4,5],[6,7],[7,8,'Yes'],[7,6,'No']];
const dec = new Set([3,7]);
const side = { DOWN: ['NORTH','SOUTH','EAST','WEST'], RIGHT: ['WEST','EAST','SOUTH','NORTH'] };
for (const dir of ['DOWN','RIGHT']) {
  const [IN, OUT1, OUT2] = side[dir];
  const ports = (id,w,h) => !dec.has(id) ? undefined : [
    { id:`n${id}_in`, layoutOptions:{'elk.port.side':IN} },
    { id:`n${id}_o0`, layoutOptions:{'elk.port.side':OUT1} },
    { id:`n${id}_o1`, layoutOptions:{'elk.port.side':OUT2} }].map(p=>({...p,width:0,height:0}));
  const g = { id:'root', layoutOptions:{ 'elk.algorithm':'layered','elk.direction':dir,'elk.edgeRouting':'ORTHOGONAL',
      'elk.layered.cycleBreaking.strategy':'MODEL_ORDER','elk.layered.considerModelOrder.strategy':'NODES_AND_EDGES',
      'elk.layered.spacing.nodeNodeBetweenLayers':'40','elk.spacing.nodeNode':'40','elk.edgeLabels.inline':'true' },
    children: N.map(([id,w,h])=>({id:'n'+id,width:w,height:h,ports:ports(id),
      layoutOptions: dec.has(id)?{'elk.portConstraints':'FIXED_SIDE','elk.portAlignment.default':'CENTER'}:{}})),
    edges: E.map(([s,t,l],i)=>{
      const ri = E.filter(e=>e[0]===s).indexOf(E[i]);
      return {id:'e'+i, sources:[dec.has(s)?`n${s}_o${ri}`:'n'+s], targets:[dec.has(t)?`n${t}_in`:'n'+t], labels:l?[{text:l,width:30,height:16}]:[]};}) };
  elk.layout(g).then(r=>{
    console.log(dir, 'size', Math.round(r.width), 'x', Math.round(r.height));
    r.children.forEach(c=>console.log(' ',c.id, 'centre', Math.round(c.x+c.width/2), Math.round(c.y+c.height/2), c.ports? c.ports.map(p=>p.id.split('_')[1]+'@'+Math.round(p.x)+','+Math.round(p.y)).join(' '):''));
    r.edges.forEach(e=>{const s=e.sections[0]; console.log('  ',e.id, [s.startPoint,...(s.bendPoints||[]),s.endPoint].map(p=>Math.round(p.x)+','+Math.round(p.y)).join(' → '))});
  }).catch(e=>console.log('ERR',e.message));
}

import * as G from '../js/geometry.js';
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const triArea = (t) => t.reduce((s, [a, b, c]) => s + Math.abs(G.polygonArea([a, b, c])), 0);
const vol = (pos) => { let v = 0; for (let i = 0; i < pos.length; i += 9) { const a=[pos[i],pos[i+1],pos[i+2]],b=[pos[i+3],pos[i+4],pos[i+5]],c=[pos[i+6],pos[i+7],pos[i+8]]; v += (a[0]*(b[1]*c[2]-b[2]*c[1]) - a[1]*(b[0]*c[2]-b[2]*c[0]) + a[2]*(b[0]*c[1]-b[1]*c[0]))/6; } return v; };

// 1) obdélník
let t = G.triangulate([[0,0],[40,0],[40,20],[0,20]]);
ok(Math.abs(triArea(t)-800)<1e-6, 'obdélník plocha 800, tris=' + t.length);

// 2) obdélník + kruhová díra
const circ = G.shapePolygon({t:'circle',cx:20,cy:10,r:5}, 64);
t = G.triangulate([[0,0],[40,0],[40,20],[0,20]], [circ]);
const expected = 800 - Math.abs(G.polygonArea(circ));
ok(Math.abs(triArea(t)-expected)<1e-6, `obdélník s dírou plocha ${triArea(t).toFixed(3)} vs ${expected.toFixed(3)}`);

// 3) vícero děr
const c1 = G.shapePolygon({t:'circle',cx:10,cy:10,r:4}, 48), c2 = G.shapePolygon({t:'circle',cx:30,cy:10,r:4}, 48), r3=[[18,6],[22,6],[22,14],[18,14]];
t = G.triangulate([[0,0],[40,0],[40,20],[0,20]], [c1,c2,r3]);
const exp3 = 800 - Math.abs(G.polygonArea(c1)) - Math.abs(G.polygonArea(c2)) - 32;
ok(Math.abs(triArea(t)-exp3)<1e-6, `3 díry plocha ${triArea(t).toFixed(3)} vs ${exp3.toFixed(3)}`);

// 4) konkávní hřeben (L a U tvar)
const U = [[0,0],[30,0],[30,30],[20,30],[20,10],[10,10],[10,30],[0,30]];
t = G.triangulate(U);
ok(Math.abs(triArea(t)-Math.abs(G.polygonArea(U)))<1e-6, 'U-tvar plocha ' + triArea(t));

// 5) CW vstup
t = G.triangulate([[0,20],[40,20],[40,0],[0,0]]);
ok(Math.abs(triArea(t)-800)<1e-6, 'CW vstup');

// 6) objem extruze obdélníku s dírou
const shapes = [{id:1,t:'rect',x1:0,y1:0,x2:40,y2:20},{id:2,t:'circle',cx:20,cy:10,r:5}];
const sk = {plane:'XY', shapes};
let b = G.extrudeBody(sk, {shapeId:1, dist:10, sym:false});
const V = vol(b.pos);
const Vexp = (800 - Math.abs(G.polygonArea(G.shapePolygon(shapes[1]))))*10;
ok(Math.abs(V-Vexp)<1e-2, `objem ${V.toFixed(3)} vs ${Vexp.toFixed(3)} (kladný = správná orientace)`);
// na rovinách XZ a YZ musí být objem také kladný (pravotočivá báze)
for (const pl of ['XZ','YZ']) { b = G.extrudeBody({plane:pl, shapes}, {shapeId:1, dist:10, sym:true}); ok(vol(b.pos)>0 && Math.abs(vol(b.pos)-Vexp)<1e-2, 'objem rovina '+pl+' '+vol(b.pos).toFixed(2)); }
// záporná vzdálenost
b = G.extrudeBody(sk, {shapeId:1, dist:-10, sym:false});
let mn=1e9,mx=-1e9; for(let i=2;i<b.pos.length;i+=3){mn=Math.min(mn,b.pos[i]);mx=Math.max(mx,b.pos[i]);}
ok(mn===-10&&mx===0, 'záporná vzdálenost z∈<-10,0>');
// díra se nepočítá, pokud kruh není uvnitř
const sk2={plane:'XY',shapes:[{id:1,t:'rect',x1:0,y1:0,x2:10,y2:10},{id:2,t:'circle',cx:50,cy:5,r:3}]};
ok(G.findHoles(sk2.shapes, sk2.shapes[0]).length===0, 'vzdálený kruh není díra');
// normály pláště směřují ven
b = G.extrudeBody({plane:'XY',shapes:[shapes[0]]},{shapeId:1,dist:5});
let badN=0; for(let i=0;i<b.pos.length;i+=9){const a=[b.pos[i],b.pos[i+1],b.pos[i+2]],bb=[b.pos[i+3],b.pos[i+4],b.pos[i+5]],c=[b.pos[i+6],b.pos[i+7],b.pos[i+8]];const u=bb.map((x,k)=>x-a[k]),w=c.map((x,k)=>x-a[k]);const n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];const vn=[b.nrm[i],b.nrm[i+1],b.nrm[i+2]];if(n[0]*vn[0]+n[1]*vn[1]+n[2]*vn[2]<=0)badN++;}
ok(badN===0,'normály souhlasí s orientací trojúhelníků ('+badN+' špatných)');
console.log(fails ? 'SELHÁNÍ: '+fails : 'VŠE OK');
process.exit(fails?1:0);

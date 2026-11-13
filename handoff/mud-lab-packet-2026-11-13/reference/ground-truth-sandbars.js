/* From Ground Truth 28 (last-road src/gt-world.js): the three places the Heron can land by the water, and how the
   ground is shaped round a bar (firm pale sand a hand above the water, shallows that deepen away from it).
   Reference only: GX/GZ turn Ground Truth's map grid into metres; wl is the water's level there. */
GT_WATERS=[
  ['Crane Bar','bar',38.31,45.61,58,380,16,'r'],['River Mouth Bar','bar',39.935,41.41,3,380,16,'r'],['South Beach','beach',44.5,42.886,180,520,22,'b']]
  .map(([name,kind,bx,by,hd,len,hw,lab])=>{const a=hd*Math.PI/180;return {name,kind,x:GX(bx),z:GZ(by),dx:Math.cos(a),dz:-Math.sin(a),len,hw,wl:-1.1,lab};});
/* which water place (x,z) is in or near: along its length (ax), across (ac: + is the lake's side of a beach), and
   how far outside its sand (e) */
function gtWaterQ(x,z,Q){for(const S of GT_WATERS){const ax=(x-S.x)*S.dx+(z-S.z)*S.dz,ac=-(x-S.x)*S.dz+(z-S.z)*S.dx,
    e=Math.hypot(Math.max(0,Math.abs(ax)-S.len/2+S.hw),Math.max(0,Math.abs(ac)))-S.hw;if(e<150){Q.S=S;Q.ax=ax;Q.ac=ac;Q.e=e;return Q;}}return null;}
const GWQ={};
/* named places for the HUD (within a radius, metres) */
const GT_NAMES=[['Roadhead',32.4,7.4,900],['The End',34,7,250],['Kettle Creek Station',20,11,700],['The Cistern',24,13,300],
  ['The Bottle Tree',27,16,250],['The Marbles',29,20,1200],['Three Wells',17,22,500],['The Sunken City',8,27,1500],['Big Daddy',9,24,2500],
  ['Last Well',4,38,500],['The Caldera',7,44,2600],['The Switchback',26,30.5,1500],['The Terraces',28,37.5,700],['The Gorge',41,33,1800],
  ['The Arches',40,18,1500],['The Lake',44.5,45,3000],['The Delta',42,42,2500],['The Pan',8,6,6000]]
  .map(([n,bx,by,r])=>({n,x:GX(bx),z:GZ(by),r}));


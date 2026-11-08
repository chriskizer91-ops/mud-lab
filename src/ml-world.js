/* =====================================================================================
   MUD LAB: THE WORLD (put inside the engine's world generator by src/build.py, so the background worker that makes
   the land has it too: it may use only the generator's own helpers, sst, vn, fbm, SF, rimAt).
   The field: 96 m square of bare soil, every part of it a cheap function of where you are, so the soil
   (src/ml-soil.js) can lay it out every 6.25 cm without asking the slow world:
     the loam (dirt), gently rolling, the default
     the mound (north-west): 1.6 m high, 26 m across, to climb and spin up
     the bog (south-east): a wet hollow, 55 cm deep, mud
     the sod (north-east): a patch of grass
     the sand pit (south-west): loose sand
   Round it, out to the edge of the world: open grassland, low swells, bare patches, fading in over 30 m.
   ===================================================================================== */
const ML_A={x:0,z:1200,h:48,m:30,h0:2};
/* the field's own height (metres over the field's level h0), u east and v south of its middle */
function mlBaseH(u,v){
  let h=.16*Math.sin(u*.11+.6)*Math.cos(v*.09-.3)+.09*Math.sin(u*.23+v*.17+1.3);
  const dm=Math.hypot(u+24,v+22);if(dm<13)h+=1.6*(.5+.5*Math.cos(Math.PI*dm/13));
  const db=Math.hypot((u-22)/1.25,v-20);if(db<12)h-=.55*(.5+.5*Math.cos(Math.PI*db/12));
  return h;}
/* what the field is made of there: weights for the engine's colour (grass, mud, sand) and the surface code */
function mlMat(u,v,o){
  const db=Math.hypot((u-22)/1.25,v-20),mud=sst(11,6.5,db+(vn(u/3.1,v/3.1,811)-.5)*2.2);
  const g0=sst(-6,6,u-10+(vn(u/6,v/6,812)-.5)*9)*sst(-6,6,-(v+10)+(vn(u/5,v/5,813)-.5)*9);
  const grass=g0*(1-mud)*(.75+.25*vn(u/1.7,v/1.7,814));
  const ds=Math.hypot(u+22,v-24),sand=sst(10.5,7,ds+(vn(u/2.6,v/2.6,815)-.5)*2.4)*(1-mud);
  o.grass=grass;o.mud=mud;o.sand=sand;o.rock=0;
  o.code=mud>.5?SF.mud:sand>.5?SF.sand:grass>.5?SF.grass:SF.dirt;return o;}
function mlLevel(){return ML_A.h0;}
/* the grassland round the field: low swells a few metres high, a long way apart, dry grass with bare patches */
function mlOuter(x,z,o){
  const h=ML_A.h0+3.2*(fbm(x/420,z/420,3,821)-.5)+1.1*(fbm(x/90,z/90,2,822)-.5);
  const bare=sst(.58,.7,fbm(x/55,z/55,3,823)),grass=Math.max(0,1-bare)*(.8+.2*vn(x/7,z/7,824));
  o.h=h;o.grass=grass;o.rock=0;o.mud=0;o.salt=0;o.sand=0;o.code=grass>.5?SF.grass:SF.dirt;return o;}
const MLM={};
function mlCore(x,z,o){
  const A=ML_A,u=x-A.x,v=z-A.z,e=Math.max(Math.abs(u),Math.abs(v))-A.h;
  if(e>A.m){mlOuter(x,z,o);}
  else{const h=A.h0+mlBaseH(u,v);mlMat(u,v,MLM);
    if(e<=0){o.h=h;o.code=MLM.code;o.grass=MLM.grass;o.rock=0;o.mud=MLM.mud;o.salt=0;o.sand=MLM.sand;}
    else{/* the ring round it: the field's ground fading into the grassland's */
      mlOuter(x,z,o);const f=sst(0,A.m,e+(vn(x/9,z/9,816)-.5)*8);
      o.h=h+(o.h-h)*sst(0,A.m,e);o.grass=MLM.grass+(o.grass-MLM.grass)*f;o.mud=MLM.mud*(1-f);o.sand=MLM.sand*(1-f);if(f<.5)o.code=MLM.code;}}
  o.h+=rimAt(x,z);o.ramp=0;o.wet=0;o.wl=o.h;o.B=o.h;o.rk=0;o.k=0;o.tm=0;o.tin=0;return o;}

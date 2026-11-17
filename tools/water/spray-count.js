()=>{const out=[];const K=()=>{const c={};for(const q of __ml.MLWK.fx)c[q.kind]=(c[q.kind]||0)+1;return (c.water||0)+'w/'+(c.spray||0)+'s';};
 MLT.place(-112,562,3.1);MLT.drive(1,0,0,2.6);
 for(let i=0;i<10;i++){const r=MLT.drive(1,0,0,.1);out.push((2.7+i*.1).toFixed(1)+'s '+r.here.waterCm+'cm '+r.mph+'mph '+K());}
 /* out again: turn round is slow, so set it going backwards out of the hole */
 MLT.place(-160,562,3.1);MLT.drive(.5,0,0,2);const t=__dyb.GAME.car;out.push('deep '+__ml.mlStats().here.waterCm+'cm '+K());
 __dyb.placeCar(__dyb.WG.mlA.x-120,__dyb.WG.mlA.z+562,3.1);for(let i=0;i<8;i++){const r=MLT.drive(.3,0,0,.4);out.push('out '+(i*.4+.4).toFixed(1)+'s '+r.here.waterCm+'cm '+K());}
 return out.join(' | ');}

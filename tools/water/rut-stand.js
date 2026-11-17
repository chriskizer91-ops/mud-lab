()=>{const out=[];const c=()=>__dyb.GAME.car;
 const row=(tag)=>{const t=c(),W=t.wheels.map(w=>((w.mlWd||0)*100).toFixed(0)+'/'+((w.mlWdE||0)*100).toFixed(0)).join(' ');let seen=0,all=0;for(const p of __game.FX)if(p.kind==='water'){all++;if(p.s>0)seen++;}
   const k={};for(const q of __ml.MLWK.fx)k[q.kind]=(k[q.kind]||0)+1;
   out.push(tag+' x'+(t.p[0]-__dyb.WG.mlA.x).toFixed(1)+' '+(t.speed*2.237).toFixed(0)+'mph wd/stand['+W+'] engine drops '+seen+'/'+all+' wake '+(k.water||0)+'w/'+(k.spray||0)+'s fill '+(__ml.MLS.fill?__ml.MLS.fill.size:0));};
 /* the wet clay just short of the Mud Hole's water: a standing start flat out digs ruts down to the water's level */
 for(const x of [-139,-141,-143]){MLT.place(x,562,3.1);for(let i=0;i<8;i++){MLT.drive(1,0,0,.25);row('from'+x+' '+((i+1)*.25)+'s');}}
 return out.join(' | ');}

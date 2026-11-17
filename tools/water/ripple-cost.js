()=>{const out=[];MLT.place(-150,562,3.1);MLT.drive(.6,0,0,1);const t0=performance.now();for(let i=0;i<8;i++)MLT.drive(.6,0,0,.5);
 out.push('hole ms/step '+((performance.now()-t0)/480).toFixed(3));const R=__ml.MLRP;if(R)out.push('rows '+R.j0+'..'+R.j1+' of '+R.n+' peak '+(R.peak*100).toFixed(1)+'cm');
 MLT.place(0,600,1.571);const t1=performance.now();for(let i=0;i<8;i++)MLT.drive(.6,0,0,.5);out.push('field ms/step '+((performance.now()-t1)/480).toFixed(3));return out.join(' | ');}

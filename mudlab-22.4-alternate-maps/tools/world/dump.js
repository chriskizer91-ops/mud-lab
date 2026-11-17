/* every 4 m of the old map's square: mlZone's numbers, to a binary file (for "is the old ground the same?") */
const {load}=require('./world.js'),fs=require('fs');
const W=load(process.argv[2]),out=process.argv[3],step=+process.argv[4]||4;
const n=Math.floor(1536/step),keys=['h','clay','silt','peat','sand','moist','wl','grass','wood','trail'],A=new Float64Array(n*n*keys.length),o={};
const t0=Date.now();
for(let j=0;j<n;j++)for(let i=0;i<n;i++){W.mlZone(-768+(i+.5)*step,-768+(j+.5)*step,o);const k=(j*n+i)*keys.length;for(let q=0;q<keys.length;q++)A[k+q]=o[keys[q]];}
fs.writeFileSync(out,Buffer.from(A.buffer));console.log(n*n,'points',Date.now()-t0,'ms',((Date.now()-t0)/(n*n)*1000).toFixed(2),'us each');

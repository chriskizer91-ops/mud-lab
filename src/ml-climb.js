/* =====================================================================================
   MUD LAB 14: THE HILL CLIMB (the world's part is in src/ml-world.js, ML_CLIMB): a lane bulldozed up the Ridge's south
   face beside the Ridge Trail, loose dry sand, that gets steeper all the way up. A standing start: stop with your
   front bumper at the line at its foot (the two tall posts), then go; how far up its slope your front bumper gets is
   your mark, in feet. (A run at it from further back doesn't count: on this game's firm ground a SUV is doing 25 mph
   in 14 m, and would be carried over the top whatever its tyres.) A post every 25 ft up both sides (a taller one
   at the line and at 100), and a stake where each SUV got to at its best (remembered). The run ends when you've
   stood still for two seconds, rolled back 8 ft, left the lane, or come over the top.
   ===================================================================================== */
const MLHC={run:null,cool:false,staged:false,best:(()=>{try{return JSON.parse(localStorage.getItem('mudlab:climb')||'{}')||{};}catch(e){return {};}})(),mesh:null,last:null,len:0,posts:null};
const mlhcLen=()=>MLHC.len||(MLHC.len=WG.mlClimbS(WG.mlClimb.X));
/* (a spot on the lane: x metres up it on the level from its foot, w metres off its middle; it runs north) */
function mlhcAt(px,pz,o){const C=WG.mlClimb,A=WG.mlA;o.x=(A.z+C.v)-pz;o.w=px-(A.x+C.u);return o;}
const MLHC_Q={x:0,w:0};
function mlhcOn(t){const C=WG.mlClimb;if(!C)return false;const q=mlhcAt(t.p[0],t.p[2],MLHC_Q);return q.x>-3&&q.x<C.X+8&&Math.abs(q.w)<C.hw+3;}
function mlhcTick(t,dt){const C=WG.mlClimb;if(!C||t.rt)return;const H=mlrHook(t,1,MLR_B),x=mlhcAt(H[0],H[2],MLHC_Q).x,dw=Math.abs(mlhcAt(t.p[0],t.p[2],MLHC_Q).w),up=t.M[6]<-.5;
  if(!MLHC.run){
    /* at the line: stopped with the front bumper within 5 m short of it (or just on it) */
    const box=x>-5&&x<1.5&&dw<C.hw&&up;
    /* (after a run, or after driving in without stopping: nothing more until it's back below the line, or stopped at it) */
    if(MLHC.cool){if(x<-3||dw>C.hw+6||box&&t.speed<.4)MLHC.cool=false;else return;}
    if(box&&t.speed<.4){if(!MLHC.staged){MLHC.staged=true;say('AT THE LINE. THE HILL CLIMB: '+mlbFt(mlhcLen())+' FT, STEEPER ALL THE WAY. GO WHEN YOU LIKE',3);}}
    else if(MLHC.staged&&x>=1.5&&dw<C.hw+1&&up){MLHC.staged=false;MLHC.run={max:x,still:0};}
    else if(MLHC.staged&&!box){MLHC.staged=false;}
    else if(!MLHC.staged&&x>2.5&&x<12&&dw<C.hw&&up&&t.speed>2){MLHC.cool=true;say('THE HILL CLIMB: STOP AT THE LINE FIRST, THEN GO',3);}
    return;}
  const R=MLHC.run;if(x>R.max)R.max=x;if(t.speed<.3)R.still+=dt;else R.still=0;
  const top=R.max>=C.X+1;if(!(top||R.still>2||dw>C.hw+2.5||x<R.max-2.5))return;
  const ft=mlbFt(WG.mlClimbS(R.max)),k=mlSuvKind(t),was=MLHC.best[k]||0;MLHC.run=null;MLHC.cool=true;MLHC.last={k,ft,psi:ML_AIRS[t.mlAirI||0].psi};
  if(ft>was){MLHC.best[k]=ft;try{localStorage.setItem('mudlab:climb',JSON.stringify(MLHC.best));}catch(e){}}
  say((top?'UP THE HILL CLIMB: ALL ':'THE HILL CLIMB: ')+ft+' FT'+(ft>was?(was?'. A NEW BEST (WAS '+was+')':'. YOUR FIRST MARK'):' (BEST '+was+')'),4,top?PAL.gold:undefined);}
/* ---------- drawn: the posts up the lane, the stakes at each SUV's best ---------- */
function mlhcPostX(ft){const C=WG.mlClimb,s=ft/3.281;let lo=0,hi=C.X;for(let i=0;i<22;i++){const m=(lo+hi)/2;if(WG.mlClimbS(m)<s)lo=m;else hi=m;}return (lo+hi)/2;}
function mlhcDraw(eye){const C=WG.mlClimb;if(!C||GAME.state!=='drive')return 0;const A=WG.mlA,x0=A.x+C.u,z0=A.z+C.v;
  if(Math.hypot(x0-eye[0],z0-C.X/2-eye[2])>280)return 0;
  if(!MLHC.mesh)MLHC.mesh={mark:mlrMesh([.85,.83,.76]),stock:mlrMesh([.7,.42,.06]),crawler:mlrMesh([.75,.12,.08])};
  if(!MLHC.posts){MLHC.posts=[];const n=Math.floor(mlbFt(mlhcLen())/25);for(let i=0;i<=n;i++)MLHC.posts.push([i?mlhcPostX(i*25):0,i*25%100===0]);}
  const u=CUR.u;if(u.uMudOff)gl.uniform1f(u.uMudOff,1);let n=0;
  const post=(mesh,x,z,h,r)=>{const y=RANCH.W.heightAt(x,z);if(mlrSeen([x,y,z],3))n+=mlrSeg(mesh,[x,y-.1,z],[x,y+h,z],r);};
  for(const P of MLHC.posts)for(const sd of [-1,1])post(MLHC.mesh.mark,x0+sd*(C.hw+1.3),z0-P[0],P[1]?1.5:.8,P[1]?.06:.04);
  for(const k of ['stock','crawler']){const ft=MLHC.best[k];if(ft)post(MLHC.mesh[k],x0+(C.hw+.7)*(k==='stock'?-1:1),z0-mlhcPostX(ft),1.9,.05);}
  return n;}
window.__mlhc={MLHC,mlhcOn,mlhcLen,mlhcPostX};

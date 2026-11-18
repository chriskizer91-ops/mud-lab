/* =====================================================================================
   MUD LAB: THE SOUND WHEN YOU COME BACK (Mud Lab 7). The Digital Engine's synth ran on, by itself, while the page was
   out of sight (another app on the phone, the window minimised on the laptop), and nothing reset it when you came
   back: the phone hands the sound back to Chrome on a reopened output stream, the synth's own state had run on without
   the engine telling it anything, and what came out was garbled until the page was reloaded. Now:
   - out of sight: the sound fades out and the browser's sound stops (no engine droning in your pocket either);
   - back: the sound starts again, the engine's synth is made fresh (the same engine, its state from nothing, as when the
     engine starts) and fades in over a quarter second;
   - and if the phone takes the sound away while the page is in front of you (a call, another app's sound), the next
     touch or key gets it back.
   ===================================================================================== */
const MLA={away:false,n:0,last:''};
function mlAudioAway(){const a=ENG.audio;if(!a||MLA.away)return;MLA.away=true;
  try{const t=a.ctx.currentTime;a.master.gain.cancelScheduledValues(t);a.master.gain.setTargetAtTime(0,t,.02);}catch(_){}
  setTimeout(()=>{if(MLA.away)try{a.ctx.suspend();}catch(_){}},80);}
async function mlAudioBack(){const a=ENG.audio;if(!a||!MLA.away||document.hidden)return;MLA.away=false;MLA.n++;
  const v=GAME.voice,had=!!v.port;
  /* (the old synth: let go of, its state not trusted) */
  if(v.node){try{v.node.disconnect();}catch(_){}try{if(v.node.port){v.node.port.onmessage=null;v.node.port.close();}}catch(_){}try{v.node.onaudioprocess=null;}catch(_){}}
  v.node=null;v.port=null;v.asleep=false;
  try{if(a.ctx.state!=='running')await a.ctx.resume();}catch(_){}
  MLA.last=a.ctx.state;
  if(had&&v.spec)try{voiceNode(v);}catch(e){console.warn('engine sound: '+(e&&e.message||e));}
  try{const t=a.ctx.currentTime;a.master.gain.cancelScheduledValues(t);a.master.gain.setValueAtTime(0,t);a.master.gain.setTargetAtTime(ENG.vol,t+.05,.08);}catch(_){}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)mlAudioAway();else mlAudioBack();});
addEventListener('pagehide',mlAudioAway);
addEventListener('pageshow',()=>{if(!document.hidden)mlAudioBack();});
/* (the phone took the sound while the page was in front: the next touch or key brings it back) */
function mlAudioKick(){const a=ENG.audio;if(!a||document.hidden||MLA.away)return;if(a.ctx.state==='suspended'||a.ctx.state==='interrupted'){MLA.away=true;mlAudioBack();}}
addEventListener('pointerdown',mlAudioKick,true);addEventListener('keydown',mlAudioKick,true);
/* (for the tests: the output listened to, and the page sent away and back without a real app switch) */
window.__mla={MLA,away:mlAudioAway,back:mlAudioBack,ctx:()=>ENG.audio&&ENG.audio.ctx,
  tap(){const a=ENG.audio;if(!a)return null;if(!MLA.an){MLA.an=a.ctx.createAnalyser();MLA.an.fftSize=4096;a.master.connect(MLA.an);}return MLA.an;},
  listen(){const an=this.tap();if(!an)return null;const n=an.fftSize,b=new Float32Array(n),f=new Float32Array(an.frequencyBinCount);an.getFloatTimeDomainData(b);an.getFloatFrequencyData(f);
    let s=0,pk=0,zc=0,bad=0;for(let i=0;i<n;i++){const x=b[i];if(!Number.isFinite(x)){bad++;continue;}s+=x*x;pk=Math.max(pk,Math.abs(x));if(i&&(b[i-1]<0)!==(x<0))zc++;}
    let num=0,den=0;const sr=an.context.sampleRate;for(let i=1;i<f.length;i++){const p=Math.pow(10,f[i]/10);num+=p*i*sr/n;den+=p;}
    return {rms:+Math.sqrt(s/n).toFixed(4),peak:+pk.toFixed(3),zeroCross:zc,centroidHz:Math.round(den?num/den:0),nonFinite:bad,state:an.context.state};}};

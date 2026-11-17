async ()=>{const G=__game.R.G,gl=__game.gl,dbg=gl.getExtension('WEBGL_debug_shaders');
 const progs=G.programs.map(P=>({name:P.name,ready:P.ready,bg:!!P.bg,vs:P.srcV.length,fs:P.srcF.length,tv:dbg?(dbg.getTranslatedShaderSource(P.vs)||'').length:-1,tf:dbg?(dbg.getTranslatedShaderSource(P.fs)||'').length:-1}));
 /* draws per program over a few frames */
 const byP=new Map();let cur=null;const names=new Map(G.programs.map(P=>[P.p,P.name]));
 const up=gl.useProgram.bind(gl),de=gl.drawElements.bind(gl),da=gl.drawArrays.bind(gl),dei=gl.drawElementsInstanced.bind(gl),dai=gl.drawArraysInstanced.bind(gl);
 const add=(n,k)=>{const nm=names.get(cur)||'?';const o=byP.get(nm)||{draws:0,verts:0};o.draws++;o.verts+=n*(k||1);byP.set(nm,o);};
 gl.useProgram=p=>{cur=p;up(p);};gl.drawElements=(m,n,t,o)=>{add(n);de(m,n,t,o);};gl.drawArrays=(m,f,n)=>{add(n);da(m,f,n);};
 gl.drawElementsInstanced=(m,n,t,o,k)=>{add(n,k);dei(m,n,t,o,k);};gl.drawArraysInstanced=(m,f,n,k)=>{add(n,k);dai(m,f,n,k);};
 const N=12;for(let i=0;i<N;i++){__dyb.render(1/60);await new Promise(r=>setTimeout(r,20));}
 gl.useProgram=up;gl.drawElements=de;gl.drawArrays=da;gl.drawElementsInstanced=dei;gl.drawArraysInstanced=dai;
 const draws=[...byP.entries()].map(([k,v])=>k+': '+(v.draws/N).toFixed(1)+' draws, '+Math.round(v.verts/N/3)+' tris').join(' | ');
 return {progs:progs.map(p=>p.name+' '+(p.ready?'ready':'NOT')+(p.bg?' bg':'')+' src '+p.vs+'/'+p.fs+' tr '+p.tv+'/'+p.tf).join(' | '),draws,level:__game.GFX.level};}

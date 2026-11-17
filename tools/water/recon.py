import re,sys
A=open('builds/mud-lab-21.html',encoding='utf-8').read().split('\n')
B=open(sys.argv[1],encoding='utf-8').read().split('\n')
files={f:open(f,encoding='utf-8').read() for f in ['src/ml-soil.js','src/ml-look.glsl','src/build.py']}
hunks=[]
for l in open(sys.argv[2],encoding='utf-8'):
    m=re.match(r'^(\d+)(?:,(\d+))?([acd])(\d+)(?:,(\d+))?$',l)
    if m:
        a0=int(m[1]);a1=int(m[2] or m[1]);b0=int(m[4]);b1=int(m[5] or m[4]);k=m[3]
        old=A[a0-1:a1] if k!='a' else []; new=B[b0-1:b1] if k!='d' else []
        hunks.append((a0,a1,k,old,new))
for a0,a1,k,old,new in hunks:
    if 'ML_BUILD=' in ''.join(old): print('skip build name');continue
    pre=0
    while True:
        o='\n'.join(A[a0-1-pre:a0-1]+old); n='\n'.join(A[a0-1-pre:a0-1]+new)
        if k=='d': o+='\n'; n='\n'.join(A[a0-1-pre:a0-1])+('\n' if pre else '')
        hits=[(f,files[f].count(o)) for f in files if files[f].count(o)]
        tot=sum(c for f,c in hits)
        if tot==1: break
        if tot==0:
            # the uniform line: only part of it is in build.py
            if 'uMLk[16]' in o:
                f='src/build.py';assert files[f].count('uniform vec4 uMLk[16];uniform vec4 uMLb;uniform vec4 uMLc;')==1
                files[f]=files[f].replace('uniform vec4 uMLk[16];uniform vec4 uMLb;uniform vec4 uMLc;','uniform vec4 uMLr[52];uniform vec4 uMLb;');print('uniform line -> build.py');hits=None;break
            raise SystemExit('NOT FOUND hunk at %d: %r'%(a0,o[:200]))
        pre+=1
        if pre>6: raise SystemExit('ambiguous hunk at %d'%a0)
    if hits is None: continue
    f=hits[0][0]; files[f]=files[f].replace(o,n); print('hunk',a0,k,'->',f,'ctx',pre)
for f in files: open(f,'w',encoding='utf-8').write(files[f])

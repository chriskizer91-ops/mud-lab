"""every inline script of a built page through node's syntax check. python3 syntax.py BUILD"""
import re,sys,subprocess,os,tempfile
s=open(sys.argv[1],encoding='utf-8').read(); bad=0
for n,m in enumerate(re.finditer(r"<script(?![^>]*src)[^>]*>(.*?)</script>",s,re.S)):
    js=m.group(1)
    if len(js)<200 or js.lstrip().startswith('{') and len(js)>5_000_000: continue
    if 'type="application/json"' in m.group(0)[:80]: continue
    f=tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8'); f.write(js); f.close()
    r=subprocess.run(['node','--check',f.name],capture_output=True,text=True)
    if r.returncode: bad+=1; print('script',n,len(js),'chars:',r.stderr[:600])
    os.unlink(f.name)
print('syntax:', 'ok' if not bad else str(bad)+' bad')

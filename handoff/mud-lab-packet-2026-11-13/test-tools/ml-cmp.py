"""Hold one page's same-drive numbers against another's (files from ml-one.py). Every number must be the same."""
import sys, json
A = json.load(open(sys.argv[1])); B = json.load(open(sys.argv[2])); same = 0
for (n, x), (_, y) in zip(A['runs'], B['runs']):
    x = {k: v for k, v in x.items() if not k.startswith('__')}; y = {k: v for k, v in y.items() if not k.startswith('__')}
    if json.dumps(x, sort_keys=True) == json.dumps(y, sort_keys=True):
        same += 1; print(f'SAME   {n}: {x.get("mph")} mph at {x.get("p")}, ruts {x.get("deepestCm")} cm, dug {x.get("dugLitres")} l, {x.get("clods")} clods')
    else:
        print(f'DIFFERENT   {n}')
        for k in sorted(set(x) | set(y)):
            if json.dumps(x.get(k)) != json.dumps(y.get(k)): print('    ', k, ':', json.dumps(x.get(k)), ' / ', json.dumps(y.get(k)))
print(f'{same} of {len(A["runs"])} drives the same.  page errors: {A["errs"][:2] or "none"} / {B["errs"][:2] or "none"}')

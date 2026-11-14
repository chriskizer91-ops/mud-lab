# tools/world: the ground, outside the game (Mud Lab 19)

`src/ml-world.js` uses only the generator's own helpers, so it runs in Node with copies of them (`world.js`, seed 6).
A change to the world can be looked at and measured in a second, before the slow test browser is opened.

```
node tools/world/render.js src/ml-world.js out.rgb -768 -768 2304 2304 2.56   # a picture of any rectangle (u0 v0 u1 v1, metres a pixel)
python3 tools/world/topng.py out.rgb 1200 1200 out.jpg
node tools/world/river.js src/ml-world.js 0        # the River every 50 m: width, deepest water, bed
node tools/world/stations.js src/ml-world.js       # where to stand to look at each ford and each piece of the Track
node tools/world/dump.js src/ml-world.js a.bin 4   # every 4 m of the first map's square, for "is the old ground the same?"
python3 tools/world/syntax.py builds/mud-lab-19.html   # every script of a built page through node --check
node tools/world/jumps.js src/ml-world.js           # (Mud Lab 21) each jump: its lane, its ramps, and where a thrown stone would land at each speed
```

The pictures are this tool's own colours (the map's, roughly), not the game's.

# Mud Lab 22.4, alternate map 2: Rimrock Run

The same game as Mud Lab 22.4 on a strip of land a mile wide and nearly four miles long, rising 800 ft from river
bottoms in the east to a pine rim in the west. His words (Nov 18): "a mile wide strip that's 3 or 4 mi long", the
elevation rising "gradually from the East side of the map which is the river bottoms and then up to the west side",
"something between rimrock one and two that has really good views", "the elevation changes less steeply so the rally
car can do things", "the two SUVs and the rally car".

**Open `builds/rimrock-run-1.html`** (one self-contained page, 19 MB). It keeps its own saves, apart from Mud Lab's and
the Mud Park's.

This first build is **the land**: the ground, the water, the views, a graded road the length of it, three trails. The
rally stage (one way, rim to river, against the clock) and the loops (flat, up and down) come next, on top of it.

## The strip, east to west

6,144 m (3.8 miles) by 1,536 m (0.95 mile). Heights are over the River's water.

| Place | Height | What it is |
| --- | --- | --- |
| The Bottoms, River Camp | 4 to 10 ft | Where you start, facing west up the whole strip. The River crosses the strip north to south: its middle is the Braids (sand bars and pools, Mud Lab's best water), the Sloughs on its far side. The Oxbow: a cut-off bend, a crescent lake. Cottonwoods. |
| The Low Bench | 45 to 75 ft | A 40 ft riser, then an old terrace with junipers. |
| The Breaks | 75 to 235 ft | Bare clay and red dirt in bands, gully after gully, badland humps. |
| The High Bench, Lone Butte | 235 to 310 ft | Grass and aspen groves, a 30 ft terrace step. Lone Butte stands 125 ft over it, cliffs all round, its top flat. |
| The Wall, the Shelf | 310 to 700 ft | Two faces of 170 ft with the Shelf between, gullies down them, a band of rimrock along the top broken by notches. |
| The Rim, the Lookout | 700 to 800 ft | Pines on rolling ground. The Lookout is a knob at the rim's edge, 745 ft over the River, looking east down all of it. |
| Cold Creek | | From a spring at the Wall's foot down to the River, 2.3 miles: a stair of 161 pools, each flat at its own level, a little fall between each. A ravine through the breaks. |
| The Grade | | A graded road from River Camp to the Rim, 5.4 miles, never steeper than 9%: up the Wall in two long legs and two hairpins. |

Trails: EASY the Bottoms Track (puddles), MEDIUM the Creek Trail (up the breaks beside the creek), HARD the Rim Trail
(clay pits in the pines). MENU on the map > THINGS TO DO sets you down at each place, facing the view.

## What is Mud Lab 22.4's and what is new

The code is the Mud Park's copy of Mud Lab 22.4 (its four-vehicle fleet, its baked Group B), with these changes:

- `ml-world.js`: the new land.
- `ml-soil.js`: **the world can be a strip, not only a square** (every size in two: east to west and north to south);
  **the fine ground near the car is kept as heights over the coarse ground** (as Rimrock 3 does: the graphics card holds
  heights as half floats, which go in eighth-of-a-metre steps above 128 m and would have laid the ground near the car
  in terraces); the map's CLOSE UP (the strip's width, round where you are) and WHOLE MAP.
- `build.py`, `ml-look.glsl`: the same two things in the shader (the strip's two scales; the fine heights added back
  over the coarse). The ground and water shader is otherwise Mud Lab 22.4's own, the latest water; the Mud Park's white
  country is not in it.
- **The view** (`build.py`, `ml-heron.js`): the far land is drawn 2.2 times as far (4 km on a phone's tier, 6.6 km on a
  laptop's), and the haze is a third as thick as Mud Lab's, thinner again the higher you are (a fifth on the Rim). At
  Mud Lab's haze the land 2 km off was as pale as the sky.
- `ml-suv.js`, `ml-recover.js`: the two SUVs and the Group B (no tractor), the other two waiting at River Camp.
- `ml-menu.js`, `ml-ui.js`: this map's THINGS TO DO; the title.
- No Bog, no Hill Climb, no plane on this map.

## Building and checking

```
python3 src/build.py rimrock-run-2                          # from this folder; each build its own name
python3 ../tools/world/syntax.py builds/rimrock-run-1.html  # every script of the page parses
node ../tools/world/probe-strip.js src/ml-world.js          # the heights east to west, the creek's pools, the Grade's grades
node ../tools/world/render.js src/ml-world.js out.rgb -3072 -768 3072 768 2.56 && python3 ../tools/world/topng.py out.rgb 2400 600 out.jpg
python3 ../tools/test/ml-run.py file://$PWD/builds/rimrock-run-1.html TAG l "start;wait:8;shot:camp;stats"
```

The test browser draws with software graphics, which takes every core: there the land's own worker is starved and the
far land takes minutes to come in. On a real graphics card it is seconds (a far tile is 1 to 2 ms to make).

See `docs/CHANGELOG.md` for what each build is and what was measured.

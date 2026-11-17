# Mud Lab 22.4: alternate maps

The same game as Mud Lab 22.4 (the soil that tears up, the water, both SUVs, the winch and the strap, the cameras), on
different ground. Mud Lab itself is untouched: nothing outside this folder was changed.

**Open `builds/mud-park-1.html`** (one self-contained page, 19 MB). It keeps its own saves (bests, picks, keys), apart
from Mud Lab's.

## Map 1: the Mud Park

One mile square. You start at the Pits with the other three vehicles parked beside you.

| Place | What it is |
| --- | --- |
| The Pits (south) | A packed pad: where you start, where the others wait. |
| The Bog (west of the Pits) | One firm run-up 1,080 ft long, then two measured lanes side by side, 400 ft each, that get evenly deeper to their ends: the MUD LANE (soft silt and clay) and the WATER LANE (a firm bed, water over the roof at its end). Where you stop is your mark, and it tells you how fast you came in. A stake for each vehicle's best in each lane. The PULL TEST post is beside the run-up. |
| The Braids (the river, through the middle) | A chain of sand bars and flat-bottomed pools right across a river 400 ft wide: bar, pool, bar, pool, each pool a little deeper than the last. Deep enough for the full bow wave, never deep enough to drown an engine. Run it lengthways or cross it anywhere. |
| The Sloughs (the river's south-east side) | Soft, dark, silty bars and backwaters. No tree within a winch line's reach: sink there and you fetch the tractor (or any of the others) and strap it out. |
| The Narrows and the Upper Ford (north) | The river before it spreads: deep enough to drown an engine, wooded banks; one shallow ford. |
| The White Dunes (north-west) | Gypsum-white dunes up to 136 ft: long easy backs, steep slip faces. Big White is the tall one. |
| The White Marsh (between the dunes and the river) | A white clay flat: hard crust at its rim, slick wet clay and a sheet of still water an inch or two deep further in, soft channels through it. |
| The Bluff (east) | 200 ft up. A steep face over the river bottoms, an easy back slope from the south (the Bluff Road). The Overlook on its brink; the Hill Climb up its face. |
| The Gumbo Woods (under the Bluff) | Wet clay bottoms with trees to winch to. The HARD trail. |
| The home field | Sod, clay flats, the Mud Pit, the EASY trail (the Park Loop); the MEDIUM trail (the Slough Trail) follows the river bank. |

MENU on the map > THINGS TO DO lists all of these: in Free play it sets you down at each, facing the right way; in Real
it guides you there.

## Four vehicles

| Vehicle | What it is | In water |
| --- | --- | --- |
| Rock & Mud | As in Mud Lab. | Breathes through its snorkel, 6.7 ft up. |
| Stock SUV | As in Mud Lab. | Chokes with water over its hood (3.4 ft). |
| Group B hatch | Salt & Sand's rally car, already in Mud Lab's engine and never offered: 500 hp, 1,050 kg, four-wheel drive, gravel tyres. Drawn from its own baked model, made for this folder the way the two SUVs' were. | Low and light: it stalls in about a foot of water. |
| Tractor | The engine's 1940s two-cylinder, as it came: 38 hp, 2,580 kg, rear-wheel drive, six gears to about 13 mph, 38 in lugged rear tyres. Its plain old model. | Its air cleaner is 4.8 ft up. |

Pick one on the title. The other three stand at the Pits. MENU > THE OTHER VEHICLES: get in one where it stands, or
(Free play) have it brought to you.

## What is Mud Lab 22.4's and what is new

| What | Where | Notes |
| --- | --- | --- |
| The engine, the two SUVs' models, his ground pictures | `../base/` | Mud Lab's own, read from there, not copied. |
| The game's code | `src/` | Mud Lab 22.4's `src/`, copied here on Nov 17 2026 and changed only where the map and the two new vehicles need it (below). |
| The map | `src/ml-world.js` | New. The same interface as Mud Lab's (every spot a soil, a moisture, a water level), so the soil, the water and the picture are unchanged. |
| The Group B's model | `base/hatch-groupb-baked.js`, `tools/hatch_pack.py` | Baked with salt-mini-plus's own tools (branch `beyond-the-last-road`, `models/tools/bake.py`: the Studio Group B onto the game's own Group B, the SUV's settings), repacked as the stock SUV's is. 51,742 triangles. |
| Tests | `tools/test/`, `tools/world/` | Mud Lab's, plus `tools/test/ml-park.js` (this map's test drives) and `tools/world/probe.js` (this map's numbers). |

Changes to Mud Lab's code, file by file:

- `ml-world.js`: the new map.
- `ml-soil.js`: a mile square (as Mud Lab was before 19); where the hatch's and the tractor's engines breathe; the
  white country's clods, dust and map colour; the map at one scale.
- `ml-look.glsl`: one line: bare soil north-west of the river is white (its light and dark kept, its colour gone).
  No look setting was changed.
- `ml-suv.js`, `ml-truck.js`: four vehicles in place of two; the Group B drawn from its bake.
- `ml-recover.js`: "the other SUV" is now the fleet: every vehicle you are not in stands in the world. The winch, the
  strap and their numbers are unchanged.
- `ml-heron.js`: no plane on this map (its model is not in the page).
- `ml-bog.js`: two lanes, marks for four vehicles, the entry speed. `ml-climb.js`: the lane can run any way.
- `ml-menu.js`: this map's THINGS TO DO; the vehicles' page. `ml-ui.js`: the title.
- `build.py`: reads Mud Lab's `../base`, writes this folder's `builds/`.

## Building and checking

```
python3 src/build.py mud-park-2                      # from this folder; each build its own name
python3 tools/world/syntax.py builds/mud-park-1.html # every script of the page parses
node tools/world/probe.js src/ml-world.js            # heights, the Hill Climb's fit, lane and pool depths
node tools/world/render.js src/ml-world.js out.rgb -768 -768 768 768 1.28 && python3 tools/world/topng.py out.rgb 1200 1200 out.jpg
python3 tools/test/ml-run.py file://$PWD/builds/mud-park-1.html TAG l "start;place:-140_-40_3.8;wait:6;shot:braids;stats"
python3 tools/test/ml-pits.py builds/mud-park-1.html tools/test/ml-park.js runs.txt   # runs.txt: one TP.* line each (ml-park.js's header)
```

The test browser draws with software graphics: its pictures are right, its speeds are not a phone's.

## How the Group B's model was made

From a checkout of salt-mini-plus at `e17e13b` (branch `beyond-the-last-road`), with Blender's Python module
(`pip install bpy==5.2.4 numpy pillow scipy`, Python 3.13), `X` a scratch folder:

```
node models/tools/export_parts.js hatchB $X
python models/tools/bake.py $X/bake-in $X/bake-out 2048 1024 32
python models/tools/pack_game.py $X/bake-out hatchB models/hatch-groupb/hatch-groupb_baked_data.js
python models/tools/baked_glb.py $X/bake-out $X/studio/manifest.json models/hatch-groupb/hatch-groupb_baked.glb
python3 tools/hatch_pack.py <that>_baked_data.js <that>_baked.glb ML_HATCHB base/hatch-groupb-baked.js "THE GROUP B HATCH"   # from this folder
```

The same steps re-made salt-mini-plus's own stock hatch bake byte for byte, and `hatch_pack.py` on the stock SUV's two
files gives Mud Lab's `base/suv-stock-baked.js` again. Nothing was written to salt-mini-plus.

See `docs/CHANGELOG.md` for what each build is and what was measured. Pictures: `docs/shots/`.

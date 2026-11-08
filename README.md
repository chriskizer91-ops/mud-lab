# Mud Lab

Christopher's soil game: the Rock & Mud — the exact truck, physics and engine sound from his racing game and Ground
Truth — on ground that tears up for real. Its own game, not connected to Ground Truth's code: if the soil proves
itself, it gets copied back into Ground Truth.

**Open `builds/mud-lab-2.html`** (one self-contained page, 12 MB). START drives out onto the field; K rakes it smooth
on a keyboard (or reload the page).

## What it's made of

| What | Where | Notes |
| --- | --- | --- |
| The engine | `base/engine-salt-and-sand.html` | A frozen copy of Redline County's Salt & Sand page (the Road Not Found engine: renderer, physics, Digital Engine sound), from `chriskizer91-ops/salt-mini-plus` branch `beyond-the-last-road`, Nov 7 2026. Never updated from there: this copy is Mud Lab's own. |
| The truck | `base/truck-rock-mud-50k.js`, `src/ml-truck.js` | Ground Truth's Rock & Mud play model: 49,654 triangles, the Studio 2 baked onto it, Station Sand paint. Its numbers are the engine's own Rock & Mud (`crawler`): checked identical to Ground Truth's (mass 2,530 kg, tyre 0.47 m radius, 0.318 m wide, the same chassis and engine numbers). |
| His ground pictures | `base/texpack.js` | The textures Ground Truth paints its ground with (red dirt, wet mud, sand, grass...). |
| The world | `src/ml-world.js` | A 96 m field of soil (loam, a bog, sod, a sand pit, a mound) in open grassland. |
| The soil | `src/ml-soil.js` | The ground every 6.25 cm, dug, packed and thrown by the tyres (below). |
| The front door | `src/ml-ui.js` | Its own title; the phone's driving screen without N2O, O/D OFF, REAR and HORN. |
| The build | `src/build.py` | `python3 src/build.py` writes `builds/mud-lab-2.html` with exact text swaps on the engine. |
| Tests | `tools/test/ml-run.py` | Headless Chrome: `python3 tools/test/ml-run.py file://$PWD/builds/mud-lab-2.html TAG m "start;place:9_20_0;drive:1_0_0_1.2;shot:roost;stats"` (m phone size, l laptop). |

## The soil (mud-lab-1's, carried over)

- A grid every 6.25 cm over the field (1536 x 1536): height, ruts, churned, pressed, packed.
- Each tyre each frame sinks until the soil bears its pressure (packing as it goes); presses down what stands higher
  than the tyre; squeezes some up beside it as berms; scrapes sideways when sliding; digs when spinning.
- The physics drives on this grid, so ruts catch the tyres and a sunk tyre has a step to climb.
- Spinning tyres throw clods back off the tread (at the tread's speed, capped at 11 m/s); at speed in mud they peel
  off the back of the tyre; dry soil makes dust; clods land and stay as small lumps.
- A fine mesh under the truck (6.25 cm apart under it, out to 30 m) shows the ruts in the ground; the shader shades
  churned soil, pressed tracks with tread knobs, and water in the bog's deep ruts.
- Numbers (test browser): parked, it settles 5 cm into the loam; ruts 2-3 cm at 30+ mph, about 8 cm pulling away;
  14-16 cm in the bog when spinning. Phone frame 175,000-250,000 triangles.

## Next: going hard on soil (proposed, Nov 7 2026)

Soil types, each with its own behaviour, not just its own colour:

1. **Firm loam** (today's field): shallow ruts, dust when dry.
2. **Sticky clay (gumbo):** holds sharp-edged ruts, slick, packs into the tread so the tyres lose grip until they
   spin it out; big clods that stick to the truck.
3. **Soupy silt:** very soft and deep; ruts slump back and fill in over a few seconds; splashes rather than clods;
   heavy drag.
4. **Peat bog:** spongy, springs part way back after the tyre; push too hard and you break through to deeper soup.
5. **Wet sand:** firm while packed, turns to quicksand under a spinning tyre.

Water on top of the mud, at different depths:

- **Puddles** (2-5 cm): spray and splash, a wet sheen, wet tyre tracks left on the dry ground afterwards.
- **Water lying in ruts:** ruts below the water level fill with water.
- **Deep water over mud** (30-60 cm): a bow wave, water drag on the tyres and the body, muddy water clearer where
  it's deep and still, waves behind the truck.

## How to work with Christopher

- He can't code; explain in plain words and **prove every step with screenshots and simple numbers**.
- **Uncluttered phone screens**: every button has to earn its place.
- His devices: a Pixel 7a phone and an MSI Cyborg 15 laptop (Edge). Frame rates can only be judged there.
- **Never overwrite a build**: each step gets a new file name in `builds/`.
- Change the engine with exact text swaps (`src/build.py`), so a changed engine fails loudly.

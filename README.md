# Mud Lab

Christopher's soil game: the Rock & Mud — the exact truck, physics and engine sound from his racing game and Ground
Truth — on ground that tears up for real. Its own game, not connected to Ground Truth's code: if the soil proves
itself, it gets copied back into Ground Truth.

**Open `builds/mud-lab-7.html`** (one self-contained page, 17 MB). Pick ROCK & MUD or STOCK SUV on the title; START
drives out from the Trailhead; the map shows the whole world with every place named (tap a name, JUMP, and the truck is
there; SUV: swaps the SUV you're in); the Heron waits on its strip (drive up, stop, HERON); G (or the Grip button on the
map) switches the grip physics; on a keyboard Enter is HERON/TRUCK, L the low range (his SUV: AWD, 4 HI, 4 LO),
Backspace rakes the ground smooth. Earlier builds stay as they were (`mud-lab-6.html`: the sound garbles after switching apps; `mud-lab-5.html`: no stock SUV, hangs on Windows
laptops; `mud-lab-4.html`: no plane; `mud-lab-3.html`: the 1,075 ft world; `mud-lab-2.html`: the 96 m field).

## What it's made of

| What | Where | Notes |
| --- | --- | --- |
| The engine | `base/engine-salt-and-sand.html` | A frozen copy of Redline County's Salt & Sand page (the Road Not Found engine: renderer, physics, Digital Engine sound), from `chriskizer91-ops/salt-mini-plus` branch `beyond-the-last-road`, Nov 7 2026. Never updated from there: this copy is Mud Lab's own. |
| The truck | `base/truck-rock-mud-50k.js`, `src/ml-truck.js` | Ground Truth's Rock & Mud play model: 49,654 triangles, the Studio 2 baked onto it, Station Sand paint. Its numbers are the engine's own Rock & Mud (`crawler`): checked identical to Ground Truth's (mass 2,530 kg, tyre 0.47 m radius, 0.318 m wide, the same chassis and engine numbers). |
| His ground pictures | `base/texpack.js` | The textures Ground Truth paints its ground with (red dirt, wet mud, sand, grass...). |
| The world | `src/ml-world.js` | Mud Lab 4: 1,536 m (5,040 ft) square, every spot a soil and a moisture (below). |
| The soil | `src/ml-soil.js` | The ground every 8 cm, dug, packed, thrown, slumping and springing (below). |
| The sound coming back | `src/ml-audio.js` | Out of sight, the sound stops; back, the engine's synth is made fresh and fades in (Mud Lab 7). |
| The stock SUV | `src/ml-suv.js` | His own SUV as the engine has it (the Stock build's garage preset), the pick on the title and the map, its AWD / 4 HI / 4 LO. |
| The Heron | `base/heron/`, `src/ml-heron.js` | Ground Truth's bush plane: the Redtail's flying code (frozen copies of salt-mini-plus `redtail/game/rt-game.js` and `rt-fly.js`, Nov 7 2026), the redtail-2 model (`heron-data.js`, made by that repo's `glb2js.py`, 60,481 triangles) in his Heron paint. |
| The front door | `src/ml-ui.js` | Its own title; the phone's driving screen without N2O, O/D OFF, REAR and HORN. |
| The build | `src/build.py` | `python3 src/build.py` writes `builds/mud-lab-4.html` (next build: change the name in it, never overwrite) with exact text swaps on the engine. |
| Tests | `tools/test/ml-run.py` | Headless Chrome: `python3 tools/test/ml-run.py file://$PWD/builds/mud-lab-2.html TAG m "start;place:9_20_0;drive:1_0_0_1.2;shot:roost;stats"` (m phone size, l laptop). |

## Mud Lab 7 (Nov 9 2026): the sound after another app

His report: the Digital Engine's sound (in all his games that use it) turns to garble after switching to another app
on the phone and back, or leaving the laptop's window and coming back; everything else in Mud Lab "amazing". The engine
had no handling for the page going out of sight: the synth ran on by itself (the phone hands the sound back on a
reopened output stream; the synth's state had run on with nothing from the engine), and nothing reset it. Now
(`src/ml-audio.js`): out of sight, the sound fades out and the browser's sound is suspended; back, it resumes, the
engine's synth is made fresh and fades in; if the phone takes the sound away while the page is in front, the next
touch or key gets it back. The test browser can't reproduce the phone's garble (no real sound device); there the sound
comes back clean after a simulated app switch (no broken samples, engine at idle 950 rpm). The same fix can go into his
other games that use the Digital Engine.

## Mud Lab 6 (Nov 8 2026): his stock SUV, and a page that opens on his laptop

**The stock SUV.** His own SUV as the engine has it (the game's Stock build, made to drive like his real one: the 4.6 V8,
six-speed automatic, 3.73 gears, 2,180 kg, 245/65R17 all-season tyres, all-wheel drive through a slipping centre
coupling with brake traction control, open diffs, no lockers, factory height, a two-speed transfer case), beside the
Rock & Mud. Pick it on the title (remembered) or swap in place on the map. Its button goes AWD -> 4 HI (centre locked) ->
4 LO (low range). Drawn with the game's own model (Studio 2's is about 800,000 triangles: never while driving now).

What makes it bog where the Rock & Mud doesn't (the soil reads each vehicle; nothing about the Rock & Mud changed):
- the tread: in soft soil an all-season's small voids bite less than mud-terrain lugs (from the engine's own grip in
  mud, .47 against .68), and pack with sticky clay sooner and throw it out later;
- its body: sills 32 cm up against the Rock & Mud's 56; water over the sills pushes on the body, and lifts it (a quarter
  of the water it pushes aside: a cab isn't sealed), so the tyres press down and grip less;
- its belly: sunk deeper than the underside sits, the axles and floor plough the mud between the ruts.

Tested (straight in from 12 m back, full and half throttle, Rock & Mud with its lockers on): a shallow trail hole, both
through (the stock 9-13 mph, the Rock & Mud 21-23); a deeper trail hole, both through (the stock crawling 3-7 mph, the
Rock & Mud 10-12); the Mud Hole, the Rock & Mud through at 3.5-4.5 mph, the stock to the far side and stuck; the pond's
soft bottoms, the Rock & Mud through at about 3 mph, the stock stopped.

**The laptop hang** (two reviews, Opus 5.5 and Fable 5.1, both found it): the page stuck on "Warming up the shaders
20 / 21" on his Windows laptop in Edge. The 21st is the land's shader; Mud Lab's ground photos and soil painting made it
the largest the engine has, and Windows' shader compiler (Direct3D's, through ANGLE) takes minutes over it. The engine
waited 60 s, then sat in a blocking wait. Mud Lab 4 had the same shader. Now:
- the land program the title waits for leaves out the photos and the soil painting (about the size of the reflections'
  program his laptop already builds); the full one, landSoil, builds in the background and takes over when it's ready
  (the plain ground until then, and a line saying so). Windows keeps a built shader, so later opens are quick;
- the soil's 19 texture reads ask for their one level outright (textureLod), and the truck's and plane's pictures use
  gradients worked out once (textureGrad): nothing in Mud Lab's code needs the compiler to work out gradients in a branch;
- the warm-up waits as long as the shaders take and the loading line names what is still building.

**And from the reviews:** nothing drawn behind the title, and no traffic cars built for a game without traffic (the
soil's preparation finishes under the title); the big map's picture made once (it was redrawn dot by dot, 25 ms a frame
on a laptop); the ground's own heights per square kept for the next time it comes into view; after a jump the ground round
the truck is ready before it's drawn; the Heron's paint is its model's picture (one 2048 picture and 0.75 MB less); the
parked Heron drawn out to 450 m and its shadow within 150 m; the town, park and Outer Loop's buildings, posts and chevrons
the engine was putting round and inside the world are gone; map names under the steering strip can be tapped; the swap
key is Enter (E is the gear-up key) and the rake Backspace (K is the lockers').

## Mud Lab 5 (Nov 8 2026): the Heron, and jumps on the map

His ask: a quick way round the map for testing, and the Heron from Ground Truth to get about and sightsee, flown for
real: take off and land yourself (or crash, reset, and switch to the truck).

- **The Heron Strip**: 400 m (1,300 ft) of mown grass in the south fields, laid level, a worn track down its middle, no
  trees near it. The Heron waits at its west end, facing east.
- **Getting in and out**: drive up to the Heron, stop, and HERON (E on a keyboard) puts you in it; the truck waits where
  you left it. Stopped on the ground anywhere, TRUCK (E) puts you in the truck beside the Heron's left wing (the nearest
  dry spot out of the trees), the Heron left standing there. Crash, RESET puts it back on its wheels where it came down,
  then TRUCK.
- **Flying**: the Heron as it is in Ground Truth (260 hp, 750 kg, the same stick, throttle lever, flaps and tilt); only the
  chase camera is Ground Truth's too. Up in it, the haze thins to half (from 20 m up to 250 m up), so the whole map shows.
- **Jumps**: on the map, tap a place's name (or THE HERON, where it waits): JUMP puts the truck at the nearest dry, open spot
  to it, facing it. From the air the Heron goes back to its strip; landed, it stays where it is.

Tested (test pilot in the headless browser): the take-off run on the strip, 10 degrees of flap, full power: tail up at
36 mph after 27 m, off the ground at 56 mph after 67 m, over 50 ft after 182 m. Level at full power: 140 mph; at about
half power, 106 mph (the map is crossed in about 30 seconds). A straight-in landing on the strip with full flap: down at
52 mph, 216 ft/min, stopped 159 m later, TRUCK put the truck 14 m off the left wing. A reset from 870 ft put the Heron on
its wheels and TRUCK worked. About 210-230K triangles on screen while flying over the woods.

## Mud Lab 4 (Nov 8 2026): five thousand feet built on moisture

His ask: a 5,000 ft map built on moisture (dry hard ground too, every spot a soil and how wet it is); a world map with
everything on it from the start, not a reveal; mud trails through the woods; and the soil science off-road engineers
use for grip as a switch beside the current grip. Getting stuck as it was (bogged to about 1 mph at full power in the
pond mud) and mud on the truck stay as they were.

**The world** (1,536 m square; u east, v south of its middle). Every spot has a soil mix (loam, clay, silt, peat, sand),
a moisture from bone dry to soaked, sod or woods' floor, and a water table. The soil's strength, grip, how it digs and
throws all slide between each soil's dry and wet numbers by the moisture.

| Place | Where (u, v) | What it is |
| --- | --- | --- |
| The Trailhead | 0, 650 | The start: dry, hard loam. |
| The Mud Hole | -172, 556 | 30 x 19 m, wet clay under up to 75 cm of water. |
| Big Creek | runs (-800, 560) to (800, -520) | Wet silt bottoms, sand bars, two fords (Upper and Lower). |
| The Pond | 232, 104 | Soft silt under deep water. |
| The Bottoms | along the creek | Wet silt and peat, moss. |
| The Clay Pan | -470, -300 | Dry, cracked clay: hard and fast when dry. |
| The Quarry | 450, 516 | A sand pit 6 m deep, dry sand. |
| The Ridge | v = -600 | High ground, pines. |
| Mud trails | Creek Loop, Ridge Trail, Gumbo Trail, Deer Run, Field Track | Two-track trails through the woods with 14 mud holes along them. |

**The map** shows the whole world from the start: soil colours, woods, water, trails, every place named, the truck's arrow,
and which grip is on.

**The grip switch** (G, or the Grip button on the phone's map; it's remembered):
- *Game* grip: the grip it always had (the engine's grip times the soil's).
- *Soil science* grip (terramechanics): grip = how sticky the soil is (cohesion) over the tyre's footprint, plus how it
  holds by friction (its friction angle); pushing through soft ground costs more the deeper the tyre sinks; sticky wet
  clay clogs the tread.

Tested (full power from a standstill, 6 s): pond mud, Game 4-5 mph, Soil science 0.4-0.7 mph (much harder: carry speed in);
the Mud Hole, Game 5.5-6 mph, Soil science 0.3-0.5 mph; dry clay pan after 3 s, Game 51 mph, Soil science 35 mph (closer to
a real SUV's pull); dry quarry sand after 6 s, Game 13 mph, Soil science 5 mph. Woods: about 253K triangles on screen
(open ground about 175K).

## Mud Lab 3 (Nov 7 2026): the whole world is soil

His ask: the modified ground the entire space, a small world (about 1,000 ft square), going hard on soil: different
muds, different depths of water on the mud.

**The world** (327.68 m square; u east, v south of its middle):

| Place | Where | What it is |
| --- | --- | --- |
| The field | the middle | red loam, gently rolling; a patch of sod to the south; you start at the south edge |
| The clay flats | north-west | flat grey clay, cracked; puddles 1-4 cm deep in its hollows |
| The peat bog | north-east | dark and mossy, the water 3 cm under the moss (ruts fill); three bog holes of open water 20-30 cm deep |
| The ditch | bog to pond | 4 m wide, about 30 cm of water over soft silt |
| The pond | east | silt bottom, water up to 65 cm deep; a ford across its west end, 15-17 cm |
| The beach | pond's south shore | sand, wet near the water |
| The sand | south-west | dry dunes 1-2 m high |
| The hills | west | a mound (1.8 m) and a steeper hill (3.6 m) |
| The bank | all round | grass rising 3 m; trees beyond |

**The soils**, each with its own behaviour (mixed where they meet; `ML_SOIL` in `src/ml-soil.js`):

| Soil | How it behaves | Test numbers (headless, phone size) |
| --- | --- | --- |
| Loam | firm: shallow ruts, berms, dust when dry | ruts stay where they are (7.2 cm, still 7.2 cm 8 s later) |
| Clay | slick (grip x 0.62); packs into the tread so grip falls further until you spin it out; sharp ruts; big clods; mud builds up on the truck | after 3.5 s at half throttle the front treads were half clogged, grip 0.47 (loam 1.0) |
| Silt | soupy: sinks deep, ruts slump back and fill in, splashes | a 19 cm rut: 15 cm after 1 s, 11 cm after 3 s, 7.6 cm after 8 s |
| Peat | spongy: 60% of what sinks springs back behind the tyre; spin it and the mat breaks through to soup | springs back 12.5 to 7.7 cm; spun through: 49 cm deep, 6.5 m2 broken |
| Sand | loose: sprays and dusts; wet sand by the pond is firm until churned, then goes soft (quicksand) | berms up to 31 cm when spinning |
| Sod | grass on loam, tears up when spun | |

**Water**: flat levels (the clay's puddles, the bog's water table and holes, the ditch, the pond, the ford), drawn as a
surface wherever the ground (ruts too) is below them, so ruts fill. Muddy, the bottom showing through where it's
shallow. The tyres throw spray, the truck pushes a bow wave, the water drags on the tyres and the body (harder the
deeper and faster: about 16 kN at 5 m/s in 60 cm), and the tyres come out wet and leave wet tracks that dry over
90 s. The ground's grip is the engine's own for the surface, times the soil's.

**How it's kept:** the soil every 8 cm (4096 x 4096 cells) in 5.12 m squares made only when touched (a test tour of
every place made 78 squares, 4.3 MB); the world's own ground every 64 cm. On the graphics card: the soil in a 122 m
window that moves with the truck, the world's ground for all of it, a fine mesh under the truck (8 cm apart under it,
out to 30 m), the water (about 9,000 triangles). Frame: about 170,000-200,000 triangles on the phone level. No stunt
scores or money in this game.

**Known:** at full throttle in sand or peat the tyres spin very fast and dig straight down (the engine's big-block
has a lot of torque); ruts are forgotten when the page closes; the land's shader now uses all 16 of a phone's
picture slots.

## How to work with Christopher

- He can't code; explain in plain words and **prove every step with screenshots and simple numbers**.
- **Uncluttered phone screens**: every button has to earn its place.
- His devices: a Pixel 7a phone and an MSI Cyborg 15 laptop (Edge). Frame rates can only be judged there.
- **Never overwrite a build**: each step gets a new file name in `builds/`.
- Change the engine with exact text swaps (`src/build.py`), so a changed engine fails loudly.

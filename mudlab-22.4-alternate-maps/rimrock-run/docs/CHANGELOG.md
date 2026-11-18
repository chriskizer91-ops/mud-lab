# Changelog: Rimrock Run

## rimrock-run-1 (Nov 18 2026): the land

His words (Nov 18): a mile-wide strip, 3 or 4 miles long, river bottoms in the east rising gradually west; between
Rimrock 1 and 2, really good views, "maybe all three of them", 800 ft; less steep "so the rally car can do things"; the
two SUVs and the rally car; using "all the current updates from mudlab", the latest water; a one-way stage from the top
to the bottom against the clock and several loops (flat, up and down). And: "I do want to see epic views". This first
build is the land, to be seen before the stage and the loops are built on it.

What is in it: README.

### Where it came from

- The three Rimrock pages he shared (rimrock-1, -2, -3) are whole games on Mud Lab 22's engine, before the water
  passes of 22.1 to 22.4. Their landforms were the model (river bottoms, a bench, breaks, a butte, a big wall, a pine
  rim, a creek as a stair of pools); their code was not taken, except one idea from Rimrock 3: the fine ground near the
  car kept as heights over the coarse ground (README).
- The code is the Mud Park's copy of Mud Lab 22.4. The ground and water shader is Mud Lab 22.4's own with one change
  for the strip's shape and the height idea above: checked line by line against Mud Lab's.

### What was checked, and what came out

All in the test browser (software graphics, a laptop-sized window unless it says phone). Nothing driven by hand or
seen on a real phone.

**Passed**

- The page builds and every script in it parses; it loads and starts with no errors or warnings, at River Camp, the
  other two vehicles beside you.
- The title fits a phone held sideways (915 x 412), START on the screen.
- The ground's shader builds on the phone's tier and takes over from the plain ground: landSoil 461,314 characters
  (the Mud Park's 461,264; the limit kept is Mud Lab 7's 683,160), 16 samplers (the phone's limit; none added).
- The land (`tools/world/probe-strip.js`): River Camp 9 ft over the River; the Butte's top 425 ft; the Lookout 745 ft;
  the Rim's west end 768 ft; the highest ground 817 ft. Cold Creek: 161 pools over 2.3 miles, 0 to 1.2 m between one
  and the next, the last at the River's level. The Grade: 5.4 miles, climbs 758 ft, steepest 40 m of it 9.0%, the
  biggest fill under it 7 m (on the Wall's upper face).
- Driving it (`tools/test/ml-strip.js`, following the Grade; one drive each):
  - the Group B from River Camp up the Grade: 10,583 ft in 2 1/2 minutes, average 48 mph, climbing 314 ft, never off
    the ground;
  - the Group B from the Rim down: 7,534 ft in 4 minutes, average 29 mph (the Rim's bends and the Wall's hairpins),
    leaning at most 13 degrees;
  - the stock SUV from the Rim down: 11,085 ft in 4 minutes, average 33 mph.
- The Braids (the same chain as the Mud Park's): the Rock & Mud lengthways at 20 mph through all of it, 3,261 ft, two
  and a quarter minutes of it in water deep enough for the full bow wave, never choking. The stock SUV stopped 1,627 ft
  down (in 1.6 ft of water); in the Mud Park it went the whole way: one drive, could be the dice. Across, the stock
  SUV stops in the Sloughs, as it should.
- **The view.** From the Lookout, once the far land is in: the whole strip east to the River, the Butte, the breaks'
  red bands, the high bench's groves, the valley's walls either side.

**The two things that make the view (each a change from Mud Lab's look; say if either should go)**

- The far land is drawn 2.2 times as far (4 km on a phone's tier, 6.6 km on a laptop's). It costs triangles: at the
  Lookout the test browser drew about 350,000 against about 230,000 before. Not measured on a phone.
- The haze is a third as thick as Mud Lab's everywhere on this map, thinner again the higher you are (a fifth on the
  Rim). At Mud Lab's haze the land 2 km off was as pale as the sky.

**Found and not fixed (not this map's own)**

- In the test browser the far land takes minutes to come in: the software graphics use every core and starve the
  land's own worker (the Mud Park is the same). Made on the page's own thread a far tile takes 1 to 2 ms and a near
  piece of ground 20 to 40 ms, so on a real graphics card it should be seconds. Not seen on real hardware yet.

**Not checked**

- A real phone, its frame rate, how long the far land really takes; the sound.
- Real mode end to end, the winch on this map's trees, the timed trails, A RESCUE, the pull test (there is no post).

### Known rough edges

- The breaks' and the Wall's gullies are noise, not a drainage pattern: from above they read as squiggles.
- The Lookout's knob is gentle: the drama is the distance, not a drop at your wheels.
- The far land is a point every 32 m: the Wall's face and the Butte's cliffs look soft from a distance.
- The map's names lie over each other where places are close (the Shelf and the Wall).
- THE SHELF sets you down among pines: the view east from it is trees. It wants a clearing.
- Lone Butte's top is flat grass and its edge is out of sight from the middle: the cliffs show from below, not from on top.

Pictures from the test browser: `docs/shots/`.

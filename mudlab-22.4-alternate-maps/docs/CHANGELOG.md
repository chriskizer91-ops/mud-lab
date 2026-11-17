# Changelog: Mud Lab 22.4, alternate maps

## mud-park-1 (Nov 17 2026): the Mud Park; four vehicles

His words (Nov 17): the mechanics of Mud Lab 22.4 on a different map, a quarter of the size; a measured bog, evenly
graded, where "the faster you hit it, the better"; "sandbar to deeper water to sandbar to deeper water", deep enough
for the bow wave without quickly getting too deep; "a lot of environmental situations that look really good
screenshot-wise" without raising the visual detail; sand dunes in a corner, white like White Sands and its marsh, wet
mud in the rest; a couple of hundred feet of elevation; no plane; the two SUVs, the Group B hatch from Salt & Sand, and
the old tractor in its plain look (to find out whether it is fun before a detailed one is made); river bottoms where
the Rock & Mud sinks and the tractor pulls it out.

What is in the build: README.

### What was checked, and what came out

All of this is the test browser (software graphics, a laptop-sized window unless it says phone). Nothing here has been
driven by hand or seen on a real phone.

**Passed**

- The page builds, and every script in it parses (`tools/world/syntax.py`).
- It loads and starts with no errors or warnings, on the Pits, with the other three vehicles standing there.
- The title fits a phone held sideways (915 x 412): four vehicles, Free play / Real, START all on screen.
- The ground's shader still builds on the phone's tier and took over from the plain ground: landSoil 461,264
  characters (the limit kept is Mud Lab 7's 683,160), 16 samplers (the phone's limit; none added).
- THINGS TO DO sets a SUV down at each place; the map shows every name and each waiting vehicle.
- The Group B hatch draws from its bake; the tractor draws as the engine builds it; both drive.

**The Bog** (`TP.bog`: down the run-up to the speed given, then flat out in the lane; one drive each, and a drive that
ends at walking pace in mud varies from one sitting to the next):

| | Mud Lane, in at 15 mph | 40 mph | 80 mph | Water Lane (40 mph) |
| --- | --- | --- | --- | --- |
| Rock & Mud | all 400 ft | all 400 ft | all 400 ft | 370 ft, drowned (6.4 ft of water) |
| Stock SUV | 345 ft | 332 ft | 380 ft | 201 ft, drowned (3.3 ft) |
| Group B hatch | 259 ft | 257 ft | 247 ft (90 mph) | 112 ft, stopped (1.7 ft) |
| Tractor (13 mph) | 394 ft and still going when the test's clock ran out | | | 283 ft, drowned (4.9 ft) |

- **Does a faster run-in pay? Only partly.** In the Mud Lane the stock SUV's best mark was its fastest run-in in both
  sets of drives (370 and 380 ft, against 252 to 345 slower), but slow against medium is not consistent. For the hatch
  it makes no difference, and in the Water Lane none for anyone: this game's water drags by the square of the speed,
  so a fast car is slowed hardest. At 139 mph the Rock & Mud rolled in the lane.
- **The Rock & Mud and the tractor drive the whole Mud Lane.** Tried: the lane 1.5 m and 2 m deep at its end (the Rock
  & Mud still got through, choking at 2 m; the stock SUV and the hatch stopped sooner, and the gain from speed went);
  a peat bog for the lane's last 45% (the Rock & Mud bogged at 277 to 321 ft flat out, but the stock SUV then got
  369 to 400 ft, past it). Left as it is, evenly deeper to 1.05 m; `ML_BOG.lanes[0].peat` in `src/ml-world.js` is the
  peat (1: none), `ML_BOG='...' python3 src/build.py trial` tries numbers.
- The Water Lane sorts the four by where their engines breathe.

**The Braids** (`TP.chain`, `TP.cross`):

- Lengthways at 20 mph the Rock & Mud and the stock SUV both ran the whole chain (2,907 ft), neither choking, with
  118 and 139 seconds of it in water deep enough for the full bow wave (over 14 in).
- The first set of pools (17 in to 3 ft) was too deep: the stock SUV stalled 1,896 ft down and the Rock & Mud 2,297 ft,
  where the pools passed 29 in. They are now 15 to 27 in, and half that toward the white bank.
- **The Group B hatch cannot run the river.** It stalls in about a foot of water (66 ft down the middle, 669 ft along
  the shallow side). It is for the run-up, the dunes, the marsh's crust and the trails.
- The Sloughs do what they are for: crossing the river, the stock SUV stopped in them 382 ft across (300 m down the
  chain) and the Rock & Mud 392 ft across (620 m down); 300 m down, the Rock & Mud got across.

**The tractor as the rescue** (`TP.fetch`: a SUV left dead in the Sloughs' water, the puller strapped on from the bank
and driven off flat out for 25 s):

- The old tractor moved a dead Rock & Mud 15 ft and a dead stock SUV 16 ft. The stock SUV moved the Rock & Mud 59 ft.
- So the tractor in its plain form (38 hp, rear-wheel drive) is the weakest puller of the three that can pull: it
  will drag one out, slowly. That is the case for the swamp tractor.
- Not tested: a SUV truly bogged by its own driving and then pulled (the test's SUV was driven to the middle and
  switched off).

**Not checked**

- Driving it by hand; a real phone or its frame rate; the sound.
- Real mode end to end (bogging, fetching the tractor from the Pits through the menu, the strap by buttons); the
  winch on this map's trees; the timed trails; the Hill Climb's marks; the pull test; A RESCUE from THINGS TO DO.
  Their code is Mud Lab's with the changes listed in the README, and the pieces the tests do reach (the strap, the
  fleet, the menu's list, the set-downs) worked.
- Mud Lab's own picture tests (`ml-views.py`, `ml-rescue.py` and others) are written for Mud Lab's places and were
  not re-pointed.

### Known rough edges

- The Group B's baked model has ragged patches round its wheel arches and thin dark lines on some panel joins (the
  game's own light flares and the detailed car's don't coincide there). Baked at the SUV's settings, untouched.
- Far land fills in over the first seconds after a jump across the map: the Bluff can stand as a hazy block with a
  straight edge until it has, and a far stretch of river as a raised brown terrace.
- After a jump all of the fine ground round the vehicle is laid at once (Mud Lab laid the nearest part and let the
  rest follow): a short pause at a jump, in place of a brown ring round the SUV on the white dunes.
- Trails in the white country are a worn, damper two-track only, not a painted road (painted, they were orange).
- Past the square's edge in the white corner the land is dry grass: the dunes die away before the edge so that a
  dune's far flank doesn't show over the rim.
- The haze thins as you climb (20 ft up nothing, at the Overlook about half), as it already did in the plane: without
  it the Overlook looked into grey. It is the one change to how the air looks.
- The water in the white country is pale (milky), and its spray with it; everywhere else it is Mud Lab's.
- The tractor takes about a minute to cover the run-up, so THINGS TO DO sets it down 130 ft short of the lanes.
- On the map the three waiting vehicles' names lie over each other while they stand together at the Pits.

Pictures from the test browser: `docs/shots/`.

# Rollovers that roll like a truck

**Use `rollover_for_mud_lab_patch.py`.** Do not use the one in `ground-truth-original/`: it is Ground Truth's fix as
written, kept for reference, and it changes how Mud Lab drives on soft ground (below).

## What is wrong in Mud Lab 15

It is the fault Christopher found in Ground Truth on 8 Nov 2026 ("flips really hard really fast"). It is in the
engine's wheels, which all his games share. A truck rolled onto its side still has its wheels "touching" the ground:
the springs and the tyres' side grip push along the axles, which point straight up by then, and throw the truck back
into the air spinning.

Ground Truth's notes say "in Sim". **It happens in Mud Lab on Realistic too**, which is the only level Mud Lab offers
(its menu hides the level picker).

### Measured: a hard turn at speed on the dry field

Mud Lab's own first test drive (`ml-same.py`, "Rock & Mud, the dry field": 3 s at 0.8 throttle, then 2 s at half
throttle with the steering at 0.3, then 1.5 s of brakes), followed by 6 s hands off. The Rock & Mud turns in at
56 mph and goes over 1.6 s later. Tool: `test-tools/ml-turn.py`. Realistic level.

| Rock & Mud | Mud Lab 15 | With this fix |
| --- | --- | --- |
| Steering 0.3 | over at 4.58 s. **4.6 full turns**, fastest **849 degrees a second**, 1.28 m into the air, ends on its roof | over at 4.58 s. 2.3 turns, 483 degrees a second, 0.71 m, ends on its side |
| Steering 0.6 | over at 4.65 s. **6.3 full turns**, **1,006 degrees a second**, 1.54 m, still not at rest 6 s later | over at 4.65 s. 2.3 turns, 461 degrees a second, 0.68 m, ends on its side |
| Full steering | stays on its wheels | the same |

The Stock SUV stayed on its wheels in the same drive at 0.3 and at full steering, in both.

### Measured: sliding sideways on the clay pan

Ground Truth build 26's own test, put on Mud Lab's clay pan (`test-tools/ml-tip.py`): the truck is given a sideways
speed and let go for 6 s.

- **On Realistic nothing rolls** at 11 to 40 mph, either truck, with or without the fix (0 to 8 degrees).
- **On Sim** (which Mud Lab does not offer today; set by hand for the test), Rock & Mud:

| Sideways at | Mud Lab 15 | With this fix |
| --- | --- | --- |
| 13 mph | stays on its wheels | onto its side, 119 degrees a second, 0.26 m |
| 18 mph | **a full roll at 368 degrees a second, 3.77 m into the air** | onto its roof, 259 degrees a second, 0.98 m |
| 22 mph | onto its roof, 193 degrees a second, 0.41 m | onto its roof, 195 degrees a second, 0.37 m |
| 27 mph | two rolls, 432 degrees a second, 2.49 m | one roll, 253 degrees a second, 0.46 m |
| 31 mph | one and a half rolls, 363 degrees a second, 0.97 m | two rolls, 341 degrees a second, 0.65 m |
| 40 mph | three rolls, 608 degrees a second, 1.22 m | three rolls, 474 degrees a second, 0.73 m |

## Why Ground Truth's swaps can't go in as written

Its first swap (the "guard") asks the ground for its slope under each wheel and compares it with the truck's own up.
Past about 52 degrees apart the wheel carries less; past about 70 it lets go. In Ground Truth the ground is smooth.
**In Mud Lab the ground's slope is the soil's, 8 cm sharp, and the wall of a rut is steeper than that.** So the guard
let go of wheels on a truck that was upright.

Counted with a probe that reads and does nothing (`test-tools/roll_probe.py`; the page drove the same as Mud Lab 15
to the last digit, 7 of 7):

| Drive | Wheel touches | Read as past 52 degrees | Read as past 70 (wheel let go) | Was the truck really over? |
| --- | --- | --- | --- | --- |
| Rock & Mud, the dry field | 9,481 | 88 | 30 | **Yes**: this is the drive above |
| Rock & Mud, the Mud Hole | 11,040 | 185 | 10 | No |
| Rock & Mud, the pond's bottoms | 9,120 | 474 | 215 | No |
| Rock & Mud, the quarry's sand | 8,160 | 20 | 0 | No |
| Stock SUV, the Mud Hole | 10,080 | 1 | 0 | No |
| Stock SUV, 4 LO on the clay pan | 9,216 | 0 | 0 | No |
| The Heron's take-off | 13,950 | 0 | 0 | No |

The other half of the fix (the bump stop) never came into play in any of the seven drives (0 times).

## What the Mud Lab version changes

One thing: where the soil is, the guard reads **the land's own slope under the ruts** (`mlBase`, the 64 cm ground the
soil lies on), through a small new function `mlBroadUp` that belongs in `src/ml-soil.js` beside `mlGround`. Outside
the soil's square it asks the engine's ground, as Ground Truth's does. The other three swaps are Ground Truth's.

## Same-drive results (Mud Lab's `ml-same.py` drives against Mud Lab 15)

| Page | Drives the same, of 7 |
| --- | --- |
| Ground Truth's four swaps as written | 2 |
| Its guard alone (first two swaps) | 2 |
| Its bump stop alone (last two swaps) | 7 |
| The probe (reads, does nothing) | 7 |
| **This version** (`rollover_for_mud_lab_patch.py`) | **6** |
| This version with the packet's other three pieces | 6 (the same six; and 7 of 7 against this version alone) |

The one drive that differs with this version is **the dry field, the drive in which the truck goes over** (first
table). There the fix is meant to change what happens. The four soft-ground drives that Ground Truth's version
disturbed are the same to the last digit.

## For the Mud Lab session to know

- **`ml-same.py`'s first drive ends with the Rock & Mud going over** (at 4.58 s of its 6.5 s). So a build with this
  fix will show "6 of 7" against a build without it, for a good reason. To keep that test as a clean "nothing
  changed" check, consider ending its first drive before the truck tips (a gentler turn, or 1 s less of it), and
  keeping the hard turn as its own rollover test.
- Whether a Rock & Mud should go over from 0.3 of steering at 56 mph on dry loam (grip 1.48 there) is a question
  about the truck and the soil, not about this fix. It is Christopher's call.
- **Not done:** nobody has driven this on a phone or a laptop. The numbers are from the test browser stepping the
  physics. Rollovers on a side slope (the Hill Climb) were not tested. The pictures of a rollover were not looked at.
- Salt & Sand and Ice & Snow have the same fault and no soil: Ground Truth's original fits them as it is.

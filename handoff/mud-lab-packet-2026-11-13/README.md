# A packet for the Mud Lab session (13 Nov 2026)

From the session that was combining Ground Truth, Mud Lab and Salt & Sand. On 13 Nov Christopher changed the plan:

> "You make a code data packet to give to the session that is working on Mud Lab, because Mud Lab is now at version
> 15. I think I'm going to continue improving the soil. So the elements from the other two games that are bug fixes,
> that are performance efficiency improvements, camera angles, I want to move those into Mud Lab now, and I don't
> need you to do it. I need you to put a packet together for me to give to the Mud Lab session, as well as any other
> notes."

So: nothing here has been put into Mud Lab. Every piece is a small patch you can run on a built page to try it, or
lift into `src/build.py`. Each was run on **Mud Lab 15** (the page from his laptop: 19,487,369 bytes, md5
`f0ab04240003ceb582cb82fddc0c3181`; build 15 was not on GitHub when this was made, so the newest source seen is
build 14's).

## What is in it

| Folder | What | State |
| --- | --- | --- |
| `film-camera/` | The **Film camera** from Salt & Sand (a 16th camera that reads what the truck is doing and cuts like a car film: its Helicopter, Park orbit and long lens) and the **softer fly-past sound** | Ready |
| `plane-hud/` | The **Heron's HUD without the truck's lamps and gear number** (Ground Truth's fix) | Ready |
| `graphics-card/` | The **graphics card named on the title**, a level the card can't hold stepping down to Low, and the reset message in a laptop's words (from the combined trial) | Ready; two of its three parts not yet seen on a real card |
| `rollover/` | **Rollovers that roll like a truck** (Ground Truth build 26's fix), in a version re-pointed for Mud Lab's soil | Ready, and it changes one of `ml-same.py`'s drives on purpose. **Read `rollover/README.md` first** |
| `MAP-BRIEF.md` | The bigger map, the pond you can drown in, the river you have to read: what he asked for and how a real river lays out its bars, fords and pools | A brief, not code |
| `NOTES.md` | Where the combination stands, what Mud Lab lacks line by line, what there was (and wasn't) to move for efficiency, testing lessons, how to test on his laptop's own graphics card | Notes |
| `reference/` | Ground Truth's Heron-on-water and sandbar code (for the new river), and the shader-slot bridge (for the day the Showroom's car comes over) | Reference only |
| `test-tools/` | The tools these results came from | Run from Mud Lab's repo |
| `proof/` | Pictures and the raw numbers | |

## What was checked, in numbers

Mud Lab's own same-drive test (`tools/test/ml-same.py`: seven drives, counted dice, a fresh page per drive), each
page against Mud Lab 15. Full output: `proof/same-drive-results.txt`.

| Page | Swaps that fit | Drives the same, of 7 | Page errors |
| --- | --- | --- | --- |
| Film camera + fly-past, graphics card, plane HUD together | 14 + 2 + 2, all | **7** | none |
| Those three and the rollover fix (all four pieces) | 23, all | **6**: the seventh is the drive in which the truck rolls over | none |
| Ground Truth's rollover fix as it was written | 4, all | 2: do not use it | none |

- The four pieces fit in either order and give the same page both ways.
- **Film camera:** 16 cameras in the list, Film at number 15 and second in the cycle after Chase; picked on a drive
  at 55 mph with no errors or warnings (`proof/film-camera-on-a-drive.jpg`).
- **Softer fly-past:** read from the page itself. Passing a standing camera 20 m away at 67 mph, the engine's note
  rises 1.8% coming and drops 1.7% going (it was 9.6% and 8.0%).
- **Plane HUD:** `proof/heron-hud-before-after.jpg`.
- **Graphics card line:** `proof/title-graphics-card-line.jpg` (the test browser has no real card, so it names its
  software one; on his laptop build 2 of the trial read "NVIDIA GeForce RTX 5060 Laptop GPU" by the same code).
- **Rollover:** a hard turn at 56 mph on the dry field. Mud Lab 15: 4.6 full turns, 849 degrees a second, onto its
  roof. With the fix: 2.3 turns, 483 degrees a second, onto its side. Tables in `rollover/README.md`.

## What was not checked

- **Nothing was run on a phone or on his laptop.** All of it is from the test browser (no graphics card, physics
  stepped by hand). Nobody has watched the Film camera's cuts in Mud Lab's world or heard the fly-past.
- The step-down to Low and the card-reset message need a card that is really struggling; they have only been read.
- The Film camera was made for Salt & Sand's roads and flats. How its Helicopter and long-lens shots behave in the
  Bog, in deep water and among trees is for his eye.
- Rollovers on side slopes.

## How to use a piece

Each patch is exact text swaps that must each match once, the same way `src/build.py` works, and stops with a clear
message if one doesn't.

```
python3 -I film-camera/film_patch.py        builds/mud-lab-15.html  /tmp/a.html
python3 -I plane-hud/plane_hud_patch.py     /tmp/a.html             /tmp/b.html
python3 -I graphics-card/gpu_patch.py       /tmp/b.html             /tmp/c.html
python3 -I rollover/rollover_for_mud_lab_patch.py  /tmp/c.html      /tmp/d.html
```

To make them part of Mud Lab: lift each file's swaps into `src/build.py`, put `film-camera/src2/film.js` and
`graphics-card/ml-gpu.js` with the other `src/ml-*.js` files, and put `mlBroadUp` (in the rollover patch) into
`src/ml-soil.js` beside `mlGround`. Each patch file says this at its top.

To rerun the checks from Mud Lab's repo:

```
python3 -u test-tools/ml-one.py . builds/mud-lab-15.html /tmp/15.json      # the seven drives, one page
python3 -u test-tools/ml-one.py . /tmp/d.html /tmp/new.json
python3 test-tools/ml-cmp.py /tmp/15.json /tmp/new.json                    # same or different, drive by drive
python3 -u test-tools/ml-turn.py /tmp/d.html /tmp/turn.json                # the hard turn: does it tumble?
python3 -u test-tools/ml-check.py /tmp/d.html /tmp/shots new               # title line, Film camera, pictures
python3 -u test-tools/ml-heron.py /tmp/d.html /tmp/shots new               # the Heron's HUD picture
```

## What is not in it, and why

- **The Showroom, its Studio 2 car, clear glass, the Rock & Mud's kit fixes.** His call: "Salt and Sand and the
  showroom that's in it are going to be its own pieces, because that's pushing the boundaries on what can be
  visually rendered in an AI-made video game." He still wants them joined, "further out". `NOTES.md` says what that
  will take.
- **Efficiency pieces.** There were none to bring: see `NOTES.md`.
- **On foot, people, jobs, rescues, money** (Ground Truth). Further out.

## Two things only Christopher can answer

1. **"Four times bigger":** four times the area (3,072 m a side) or four times each way (6,144 m a side)? The second
   brings back the ground-detail seam build 8 fixed and takes about 16 times as long to fill at the title.
2. **The deep pond:** must a drowned truck always be recoverable with the winch or the strap, or may it be a place
   nothing comes back from?

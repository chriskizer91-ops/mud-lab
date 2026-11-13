# Other notes for the Mud Lab session (13 Nov 2026)

## Where the idea of combining the games stands

- On 11 Nov he asked another session (this packet's author) to put Ground Truth 28, Mud Lab and Salt & Sand Showroom
  3 together into one game. Two trial builds were made on Ground Truth's base (`last-road`, branch
  `ground-truth-continued`, builds 1 and 2; notes in `combined/README.md` there and in the project as
  `claude/ground-truth-continued-notes.md`). On his laptop they opened on Low; **on High they would not hold, on the
  RTX 5060 too, and why was not found.** Ground Truth has started laptops on Low since its first build for the same
  reason. Mud Lab runs on High there.
- 13 Nov, his decision: **Mud Lab goes on by itself, in its own session, improving the soil.** The fixes, the
  efficiency pieces and the cameras from the other two games come into Mud Lab now (this packet). **Salt & Sand and
  its Showroom stay their own project for a while** ("that's pushing the boundaries on what can be visually rendered
  in an AI-made video game"). Joining them up is something he still wants, "further out".
- The full list of every feature, fix and decision across the three games, each with a number, is in the project:
  `claude/combined-game-feature-list.md`. How the three pages fit and collide as text: `claude/ground-truth-combined-survey.md`.

## What Mud Lab lacks from the other two, line by line

| What | From | In this packet | State |
| --- | --- | --- | --- |
| The Film camera (a 16th camera that reads what the truck is doing and cuts like a car film), with its Helicopter, Park orbit and long lens | Salt & Sand, Film & Showroom | `film-camera/` | **Ready.** 14 of 14 swaps fit Mud Lab 15; drives the same, 7 of 7; picked on a drive with no page errors |
| The softer fly-past pitch (the engine's note swung about 1.6 times what a microphone hears past a standing camera; now 0.8) | Salt & Sand | the same patch | **Ready.** Measured in the page: passing a standing camera at 67 mph the note rises 1.8% (was 9.6%). Never checked by ear on any device |
| The Heron's HUD without the truck's TC / ABS / ESC lamps and gear number | Ground Truth | `plane-hud/` | **Ready.** 2 of 2 swaps; before and after picture in `proof/`; drives the same |
| The graphics card named on the title; a level the card can't hold stepping down to Low; the reset line in a laptop's words | the combined trial, build 2 | `graphics-card/` | **Ready, with a limit.** 2 of 2 swaps; the title line shows; drives the same. The step-down and the reset line have not been seen working on a real card |
| Rollovers: a truck that went onto its side was thrown back into the air spinning | Ground Truth build 26 | `rollover/` | **Ready in a Mud Lab version; Ground Truth's own must not go in.** Its guard read the walls of ruts as a truck on its side (5 of 7 drives changed). Re-pointed at the land's own slope: 6 of 7 the same, the seventh being the drive where the truck goes over, where it halves the spin. Read `rollover/README.md` |
| The Studio 2 car stored lean for the bay (84 MB becomes 24), its own shade, lighter copies | Salt & Sand, lean (`patch.py`) | not cut out: see "The lean car" below | A bigger job, and it belongs with the Showroom |
| Clear glass in the bay; the Rock & Mud's flaps, snorkel and rear-spring covers; the Showroom | Salt & Sand Showroom 3 | no | Staying with Salt & Sand for now (his call) |
| The loader that never stops the page and names what it waits for | Salt & Sand `patch3.py` | no | Mud Lab has its own fix for the same hang, at the same lines. Nothing to take |
| The Heron landing on sandbars and in shallows | Ground Truth build 27 | `reference/` | Reference only, for the new river |
| On foot, people and jobs, rescues, gear and money | Ground Truth | no | Further out |

**Fixes that went the other way** (Mud Lab has them, the others don't; nothing to do here): the engine's sound
coming back after another app, the E key clash, the far copy of the Heron, nothing drawn behind the title.

## The lean car, if it is ever wanted for Mud Lab's bay

- It is Salt & Sand's first step (`chain/patch.py` and `chain/src/` in the hand-off zip on this repo's branch
  `salt-and-sand-showroom-3-handoff`). It changes the lit shader and puts the car's baked shade on **vertex slot 4**,
  which Mud Lab uses for the baked models' texture coordinates.
- `reference/slot_bridge.py` moves the shade to slot 8 (the page uses 0 to 7; WebGL 2 allows 16). It was written for
  the Ground Truth trial, where it worked: Showroom 3 plus the bridge plus the plane plus Ground Truth built, opened
  and drove.
- Dry run, Mud Lab 14's `src/build.py` on Showroom 3 plus the bridge (the page was not opened): **6 of 100 swaps did
  not fit.** One is the vertex shader's last line (Salt & Sand added `vBk=aBk*uBk;` to it). Three are the loader's
  warm-up, which both games changed. Two are the list of lit-shader builds (`P_LANDML` here, `P_LANDG` there).
- One thing learned there that matters for any bay with a Studio 2 car: Salt & Sand bakes the car's shade a few
  directions a frame *wherever you are* and shows a "shading 40%" line. In a game where the Studio 2 car never leaves
  the bay, bake only in the bay.

## Efficiency: what there was to move

He asked for the efficiency improvements from the other two games. Looked for line by line (the list's section G):
there is nothing to bring. The efficiency fixes on that list were made in Mud Lab itself: its own loading fix,
parked vehicles not drawn out of view, the Heron's lighter far copy, nothing drawn behind the title, the map's
picture made once. Salt & Sand's one big saving, the lean car, is for the
Studio 2 showroom car's memory in the bay; it is tied to the Showroom, which is staying with Salt & Sand (the
section above). One idea is left that nobody has built:

The HUD's dials are drawn by JavaScript every frame: 3.7 ms a frame in the test browser. Drawing them only when their
numbers change was suggested and never done. Worth a look on the phone with the F numbers.

## Testing lessons from the trial

- **A same-drive difference is not always a side effect.** `ml-same.py`'s first drive ends with the Rock & Mud going
  over (56 mph, 0.3 of steering, over at 4.58 s). Anything that changes what a rolled truck does will show there, and
  should. Found while testing the rollover fix; the tools are in `test-tools/`.
- **A probe that counts and does nothing** (`test-tools/roll_probe.py`) told a real effect from a side effect in one
  run: the page drove the same to the last digit, and the counts showed the guard reading rut walls.
- **Compare two builds only with the same steps, and wait for the engine.** In Ground Truth's start the truck's
  engine was not running until about 85 s into the test browser's run, and a drive started before that gave one of
  two answers depending on timing. It looked like a difference between builds and wasn't. Mud Lab's `ml-same.py`
  (a vehicle made new, dice counted, the game's loop held) does not have this problem; a test that starts from the
  live game does.
- **A scripted click works where the browser's own click times out** on a slow frame
  (`document.getElementById('x').click()`).
- **There is a way to run a build on his laptop's own graphics from a cloud session.** The Claude desktop app's
  browser pane (the `mcp__remote-devices__Claude_Browser__` tools) can open a page, run script in it, read its
  console and take pictures. It cannot open `file://`: push the build and open
  `https://raw.githack.com/chriskizer91-ops/<repo>/<branch>/builds/<name>.html` (he allowed that site on 11 Nov).
  What to know:
  - **that pane runs on the laptop's built-in Intel graphics** (`Intel(R) Graphics`, 16 pictures a shader), not the
    RTX 5060. His Edge is on the RTX (build 2's title said so). So the pane is a harsher test than Edge, and it can't
    stand in for Edge on High;
  - the pane has to be showing and the app's window uncovered, or the page never draws a frame and stays on its
    loading screen. Ask him (Ctrl+Shift+B in the app), and check `requestAnimationFrame` fires before trusting a run;
  - a script call is cut off at 45 s, so poll in short calls;
  - a test that makes Windows reset the card freezes his whole laptop for a while. Ask first.
- **What a card reset looks like in the console:** hundreds of `INVALID_OPERATION: … object does not belong to this
  context`. On the page: a torn-up picture, a freeze, then the engine's own handler starts the page again.

## His way of working (the same as ever)

He can't code: plain words, and every step proved with pictures and simple numbers. Uncluttered screens. A new
number for every build, never overwritten. He tests on a Pixel 7a and an MSI laptop (RTX 5060) in Edge.

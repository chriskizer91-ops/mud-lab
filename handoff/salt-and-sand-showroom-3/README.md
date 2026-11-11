> **The zip beside this file, `salt-and-sand-showroom-3-handoff.zip` (16 MB, 91 files), holds everything described below.**
> Unzip it anywhere; this page is the same README that is inside it.

# Hand-off: Salt & Sand "Showroom 3", for combining with Mud Lab

**What this is for.** Christopher is starting a session that will combine Salt & Sand Showroom 3 (both its showroom
details and its driving details) with Mud Lab. This folder is everything that session needs from the Salt & Sand side
that was not already in the `mud-lab` repo. Made 11 Nov 2026 by the Salt & Sand session.

**The one fact that makes this small.** Mud Lab's `base/engine-salt-and-sand.html` is the very same file the Salt &
Sand work started from (same fingerprint, sha256 `9c2bffab…`, 3,309,058 bytes). So the four patch steps in `chain/`,
run on Mud Lab's own engine copy, give the four Salt & Sand pages byte for byte. Checked on 11 Nov 2026 from a clean
copy of this folder: all four fingerprints matched (`./build_all.sh <path to>/base/engine-salt-and-sand.html`).

Christopher can't code. Explain in plain words and prove each step with screenshots and simple numbers. He dislikes a
crowded screen. Never overwrite a page he has been sent: each build gets its own name.

## What is in here

| Folder / file | What it is |
| --- | --- |
| `pages/` | The four pages as he was sent them: `salt-and-sand-lean.html`, `-showroom.html`, `-showroom-2.html`, `-showroom-3.html` (the current one). Each is one self-contained page, about 3.4 MB. |
| `chain/` | The four patch steps (exact text swaps, like Mud Lab's `src/build.py`) and the code they add. See the table below. |
| `build_all.sh` | Runs the four steps on an engine page and checks each result against `SHA256SUMS`. Needs python3 only. |
| `SHA256SUMS` | Fingerprints of the four pages and of the engine page they start from. |
| `notes/` | The notes for each step: what changed, why, what was measured, what was not checked. Read `salt-and-sand-showroom-3-notes.md` first. |
| `reference/` | Same-drive physics numbers (original page and Showroom 3: identical), and the dry run of Mud Lab's build on Showroom 3 (below). |
| `tools/` | The test scripts used on the Salt & Sand pages (headless Chrome with software graphics, plus an offline viewer). They expect Playwright at `/opt/npm-tools` and Chrome at `/usr/bin/google-chrome`, and several have `/home/claude/...` paths written in: adjust before use. Mud Lab has its own tests in `tools/test/`. |
| `pics/` | Proof pictures from the real pages (film shots, showroom black and white, the Rock & Mud fixes, glass before and after). |

## The four steps, and what each adds

| Step | Script and code | Gives | What it adds |
| --- | --- | --- | --- |
| 1 | `chain/patch.py` + `chain/src/` | lean | The Studio 2 car made cheap enough to drive: `s2make.js` (the worker that builds it), `s2lean.js` (levels of detail, the car's baked shade `S2B`, bake steps), `kit.js` + `kit_tyres.js` (the vehicle kit), meshoptimizer's simplifier. |
| 2 | `chain/patch2.py` + `chain/src2/` | showroom | **Driving details:** `film.js`, the Film camera (the 16th camera: it picks its own shots from the existing cameras, plus a helicopter and a park orbit; all the old cameras stay) and the softer fly-past pitch (`flyPitch`, 0.8 of real instead of about 1.6). **Showroom:** `show.js`, a Showroom switch in the bay for the Stock SUV and the Rock & Mud: black void and white void, floor shadow (`VFLOOR`); `kit_show.js`, the extra detail pieces (tyre lettering, ribs and tread print, heater lines, lettering on the body: `bodyX`, `wheelX`). |
| 3 | `chain/patch3.py` | showroom-2 | The loader fix for Windows laptops: the shader warm-up no longer blocks, shows seconds and names, and leaves the bake's programs out of the wait. |
| 4 | `chain/patch4.py` + `chain/src3/` | showroom-3 | Rock & Mud model fixes in `kit_fix.js` (mud flaps behind the tyres, snorkel on the pillar, covers over the rear springs, air duct), and `glass.js`: clear blended glass in the bay and Showroom (a third build of the lit shader, `P_LANDG`, drawn in the renderer's glass pass). |

Running a step also writes by-products beside the scripts (`kit2_built.js`, `make2_built.js`, `kit4_built.js`: the
kit and maker as the page carries them, for the offline tools). They are not needed to build.

Dev panel switches these steps add (all on by default; off gives the old behaviour): car shade, lean car, softer
fly-past, clear glass in the bay.

## Shared pieces these steps change

Per the project rule (write down changes to shared pieces): the vehicle kit (Stock and Rock & Mud models, detail
pieces, the Rock & Mud fixes), the renderer's lit shader (baked car shade, the glass build) and its loader, the
cameras (one added), the fly-past sound. **Not changed: the physics and the Digital Engine.** Six test drives on each
SUV give numbers identical to the original page (`reference/phys_*.log`).

## Where the two games collide (dry run, not a merge)

Mud Lab's `src/build.py` was run in a scratch copy with the Showroom 3 page as its engine (repo main at commit
`4582ec4`, Mud Lab 12). **93 of its 103 swaps fit unchanged. 10 do not**, all in three places
(`reference/mud-lab-build-on-showroom-3-dry-run.txt` has the list):

1. **The lit shader's vertex slot 4.** Salt & Sand uses it for the Studio 2 car's baked shade (`aBk`, `vBk`, `uBk`).
   Mud Lab uses it for its baked play models' texture coordinates (`aUV`, `vUV`). Both then add lines at the same
   spots in the vertex and fragment shader. This is the real piece of work.
2. **The loader's shader warm-up.** Both games fixed the Windows laptop hang, each its own way (Mud Lab: background
   programs marked `P.bg`, no 60 second cut-off; here: `patch3.py`). Pick one.
3. **The list of lit shader builds.** Mud Lab adds `P_LANDML`, Showroom 3 adds `P_LANDG` to the same line.

The page that dry run wrote was not opened or tested. The other order (these steps on top of a Mud Lab build) was not
tried. Mud Lab 13 exists in the project notes but was not in the repo when this was made.

## Things to know before combining

- **The cars are drawn differently while driving.** Mud Lab draws each SUV from a baked play model of about 50,000
  triangles (`base/truck-rock-mud-50k.js`, `base/suv-stock-baked.js`). Salt & Sand drives the Studio 2 car itself,
  made lean by step 1. The Showroom, the detail pieces and the Rock & Mud fixes all live on the Studio 2 kit model
  (about 820,000 to 990,000 triangles in the bay). Which model Mud Lab drives with after combining is Christopher's call.
- **The Showroom lives in the engine's bay** (the dyno bay that is Salt & Sand's menu). Mud Lab has its own title
  screen: check how the bay is reached there.
- **The Film camera and the softer fly-past sound do not depend on the car model.**
- **Clear glass is bay and Showroom only.** On the road the dotted see-through is unchanged.
- **Nothing here was run on his real laptop or phone by the session that made it.** He opened the first Showroom
  page on his phone (the new cameras looked good) and Showroom 2 on his laptop (opened quickly after the loader fix).
  Showroom 3 had only been run on the test machine when this was made. Not checked: sound by ear, real frame rates,
  the Film camera over a long drive.

## Also in the claude.ai Project "Salt Flats Plus"

The same notes and source as project docs: `claude/salt-and-sand-lean-notes.md`, `-lean-src.md`, `-lean-src-2.md`,
`-showroom-notes.md`, `-showroom-src.md`, `-showroom-src-2.md`, `-showroom-2-notes.md`, `-showroom-patch3.py`,
`-showroom-3-notes.md`, `-showroom-patch4.py`, `-showroom-3-kit-fix.js`, `-showroom-3-glass.js`. Read
`claude/project-map.md` first: it says how the games fit together.

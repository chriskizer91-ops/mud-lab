# The water passes' one-off tools (Mud Lab 22 to 22.4)

Small scripts written while the water was being worked on. They are kept as they were used, not tidied: each is a
few lines. The `.js` ones are run inside the page by `tools/test/ml-run.py`:
`python3 tools/test/ml-run.py file://$PWD/builds/BUILD.html TAG m "start;file:tools/water/NAME.js"`.

| File | What it is for |
|---|---|
| `recon.py` | How Build 22's source was got back from the page he sent (the repository only had 21): `diff builds/mud-lab-21.html his-page.html > d.diff`, then `python3 tools/water/recon.py his-page.html d.diff` puts each changed line back into `src/`. The page built from the result was the same as his, byte for byte |
| `audit.js` | Every shader program the page builds (its size as handed to the graphics driver) and what each one draws in a frame: the look for left-overs in Mud Lab 22.2 |
| `profile.py` | Where the game's own code spends its time while driving (the browser's own profiler): `python3 tools/water/profile.py builds/BUILD.html` |
| `spray-count.js` | The wake's own particles counted as the Rock & Mud hits the Mud Hole flat out, and after it is set down on the bank (the splash, the fan, the drips: 22.2) |
| `rut-stand.js` | Each tyre's water by the old rule and by the new (the water standing ahead of it) while it digs down to the water beside the Mud Hole (22.3) |
| `ripple-cost.js` | How long one step of the game takes in the Mud Hole and on the dry field, and which rows of the ripples' sheet are in use (22.3, 22.4) |
| `shader-sizes.js` | landSoil's vertex and fragment shaders' sizes (`tools/test/ml-shaders.py` gives the fragment shaders only) |
| `pairs.py` | The before/after pictures in `docs/shots/`: two of `tools/test/ml-views.py`'s pictures one over the other with a label each (its list of pictures at the bottom is the last one made: change it) |

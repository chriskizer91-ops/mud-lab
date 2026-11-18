# Mud Lab 22.4: alternate maps

The same game as Mud Lab 22.4 (the soil that tears up, the water at its latest, both SUVs, the winch and the strap, the
cameras) on different ground. Mud Lab itself is untouched: nothing outside this folder was changed. Each map is its own
folder with its own copy of the code, its builds and its notes; each page keeps its own saves.

| Map | Open | What it is |
| --- | --- | --- |
| 1. The Mud Park | `mud-park/builds/mud-park-1.html` | A mile square: a measured bog you hit at speed, a river of sand bars and pools, white dunes and a white marsh, a 200 ft bluff. Two SUVs, the Group B hatch, the old tractor. |
| 2. Rimrock Run | `rimrock-run/builds/rimrock-run-1.html` | A strip a mile wide and nearly four long, from river bottoms up 800 ft to a pine rim. Two SUVs and the Group B. The first build is the land; the rally stage and the loops come next. |

Shared by both:

| What | Where |
| --- | --- |
| The engine, the two SUVs' models, his ground pictures | Mud Lab's own `../base/` (read from there, not copied) |
| The Group B hatch's baked model, and the tool that packed it | `base/hatch-groupb-baked.js`, `tools/hatch_pack.py` (how it was made: `mud-park/README.md`) |
| The tests and the world tools | `tools/test/`, `tools/world/` |

# v3 iOS core — rebuild report

## Delivered
18 screens on existing Proto iOS Light / Proto iOS Dark pages, all 390×844. No pages created; no document save invoked. Shared helpers untouched.

## Verification
- Live exact-name audit: 18 unique frames, correct parents and dimensions.
- Zero UI perimeter borders. Native status battery outline and H.ring track/arc strokes are intentional symbol geometry, not container borders.
- Content/chrome type normalized lane-locally to H.T (11/12/13/14/22); SF glyph sizes and system chrome geometry exempt. H.iosGroup and composer inherited off-scale text sizes corrected without changing shared lib-v3.js.
- Dots 5px; usage rings 16px; every top-level body child inside clipped body bounds.
- Conversation has only code/composer surfaces plus permitted accent-soft user bubble; iOS group/form/control surfaces are brief-approved exceptions. Activity and changed-file rows remain unshaded.
- Six full-scale contact sheets visually checked. Final defect-only gates: no enclosing borders, clipping, clutter, or legibility issues across all 18.
- Light initial reviewer invented overlaps and penalized required components; re-review with actual live bounds and explicit exceptions returned no defects. Search merged project row was a valid issue and was split into separate rows in both appearances.
- Raw initial conversation score: 7/10 despite explicitly reporting clean/no defects. No score inflation: final acceptance uses v3 defect-list gate; legacy numeric ≥8 gate is not claimed.

## Frame inventory
| ID | Appearance | Frame ID | Final visual gate |
|---|---|---|---|
| signin | Light/Clean | `2C380FCE-545D-4367-AE28-7EFA0ADFF308` | No defects |
| home | Light/Clean | `79B35EED-3CD9-4360-AD2A-E7043A11D98F` | No defects |
| conversation | Light/Clean | `EC2963F8-28FC-4828-88C3-9E8E63290473` | No defects |
| conversation--approval | Light/Clean | `19DEF2CD-5763-47DB-B067-25B39C1B17EC` | No defects |
| conversation--menu | Light/Clean | `A762F443-BDD9-4464-BF4A-E341F25CE20B` | No defects |
| conversation--delete | Light/Clean | `43E74F7D-13FA-4417-846B-8B75F4F28D37` | No defects |
| search | Light/Clean | `D7E4F21C-5CCA-4E8B-AD1E-D7F70C81DA54` | No defects |
| activity | Light/Clean | `7B892290-3A5E-4E42-885F-306C99E26D3D` | No defects |
| activity--work | Light/Clean | `DAAA1CB0-E322-4791-9053-8119B9319B64` | No defects |
| signin | Dark/Clean | `E6863210-46DD-41B3-B401-707E4F095602` | No defects |
| home | Dark/Clean | `8EBCA174-937F-4983-92C6-CDD98A727AF2` | No defects |
| conversation | Dark/Clean | `4FEBD464-ECA4-425B-8D4D-73E9D700D058` | No defects |
| conversation--approval | Dark/Clean | `582F7F8E-C06A-4A98-B46C-1E60E7DA36E8` | No defects |
| conversation--menu | Dark/Clean | `349C32B4-8C7F-4FE8-9E23-38DDE101C858` | No defects |
| conversation--delete | Dark/Clean | `5922CD78-A6DD-48F9-B779-F850C9991286` | No defects |
| search | Dark/Clean | `0D479C77-AC6F-434A-85E2-137112E5DE68` | No defects |
| activity | Dark/Clean | `F96A3A93-3DD1-4F58-8DF7-6B837C90A43B` | No defects |
| activity--work | Dark/Clean | `1912E573-0038-4ECF-ACCB-9BB14783E40F` | No defects |

## Files
- `core.js`: lane-local parameterized composition and type normalization.
- `<id>-Light.js` / `<id>-Dark.js`: replayable generators.
- `run.py`: prelude3 batch driver, 60s per-call timeout and ping recovery, screenshot export.
- `audit.js`, `audit-raw.txt`, `final-audit.json`: exact live readback.
- `inventory.jsonl`: append-only build history (final IDs in final-audit.json).
- `Light-0.png` through `Dark-2.png`: full-scale triptychs.
- Individual exports: `/tmp/harso-sk/shots/v3-ios-<Light|Dark>-<id>.png`.

## Issues / boundaries
Bridge wraps JSON logs in single quotes; parser corrected using raw_decode. No bridge timeout occurred. Navigation target names are normalized; cross-lane prototype wiring remains parent-owned. Primary buttons use ink/surface inversion in Dark, as shared v3 helpers do. Native alert separators retained per explicit unchanged-helper exception.

LANE_RESULT: v3-ios-core COMPLETE — 18/18 regenerated and live-audited; all final visual defect gates clear; no save; legacy numeric score gate not claimed.

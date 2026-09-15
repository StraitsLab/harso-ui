# ios-manage — completed

- Built 28 screen IDs in Light/Clean and Dark/Clean: 56 frames on Proto iOS Light / Proto iOS Dark, row y=1004, x=510×index.
- Includes all assigned root/category/detail/overlay screens, project and artifact empty states, plus Work, Code and Share states.
- Every frame exported and vision-reviewed; final corrections verified: safe-area indicator, mobile search shortcut removal, subtitle first-glyph rendering, wrapped EmptyState copy, Work active state, duplicate empty CTA removal, secondary Cancel styling.
- Readback: 56 frames exactly 390×844; zero body overflow and zero copy bounds failures. All link target strings audited; Sketch auto-numbered duplicate layer names normalized.
- No document save. No other lane or kit-page edits.
- Prototype-only controls that do not navigate to another designed state use self-links; actual Sketch flow wiring remains the lead’s task. Account/service, plan and device details are illustrative fixtures rather than connected services.

## Frame inventory

### Proto iOS Light

| Screen ID | Frame ID |
|---|---|
| `projects` | `5D030E50-4887-4A85-9FA6-D32AC47785E5` |
| `projects--new` | `ECAE2A70-0042-492B-BB56-A1A78FAE9CD1` |
| `project` | `CF4087A0-2FDF-4B12-9BAF-5B33A315B43A` |
| `recent` | `88C390E3-CA16-4B7A-A998-D8AAEDF9933B` |
| `artifacts` | `B12900AA-5B90-4819-BE41-F4EA8758BB4A` |
| `artifacts--detail` | `E42002C3-C250-46CA-A28B-729F1173F5A4` |
| `routines` | `B84A7FE6-21CB-466D-8B59-4B0CAE812674` |
| `routines--new` | `0688453F-52E1-4CDC-9B81-101F4AF3A632` |
| `customize` | `B1E70F0C-EE82-45AF-92A1-E4E3B435860E` |
| `settings` | `3A7ADD8A-FA7A-4587-87DC-92A0D45081FB` |
| `settings-account` | `2CD442B0-669D-423A-B356-962BFE781F62` |
| `settings-devices` | `54BC8317-2A51-4034-B696-B0EF2D5160CD` |
| `settings-general` | `CAEBB0DE-3441-4C69-97D4-0B369CEF3D79` |
| `settings-appearance` | `CB449E77-B6E5-473D-8112-13F1DCE80643` |
| `settings-voice` | `ABCA5853-1805-4AF8-8E3E-CAEC410D2801` |
| `settings-notifications` | `E6D63460-3FE9-4093-8AEE-31C5A3E6F65D` |
| `settings-connections` | `E4A4E059-3832-4CBC-9437-42943AA68212` |
| `settings-billing` | `FB7CE293-C50D-4DF5-8179-97A8C39976D4` |
| `settings-privacy` | `D084F432-EE1B-4180-B440-E13D970A5562` |
| `settings-shortcuts` | `93FFF28B-93E7-447C-A0A8-BFE8D135CE58` |
| `settings-about` | `1E4A470E-0BC3-453C-90DE-F7E834882AC9` |
| `settings--sign-out` | `9C96B640-98AF-48DE-87BE-1BFB3D9E853D` |
| `settings-billing--plan` | `69D8E74C-7F01-41AB-9C33-56F620B26D89` |
| `project--empty` | `FD1BB4B6-D067-44E4-B987-C2EEDAB2C5C3` |
| `artifacts--empty` | `91D588E2-05CC-4C00-B251-54FA6F78B6DB` |
| `project--work` | `C53CA212-D8C8-4217-A94F-2D86BDE30EA4` |
| `artifacts--code` | `2DBAE45F-8D85-4E32-BE2E-8E26E4C6C949` |
| `artifacts--share` | `05BE1AC7-77FC-42A9-94AF-1BC8568A25D8` |

### Proto iOS Dark

| Screen ID | Frame ID |
|---|---|
| `projects` | `6CF7265F-0FAC-48F7-A8C4-362BC0A79F1B` |
| `projects--new` | `9E1B2EFF-F5DE-4BBD-9437-FA4A8988CC40` |
| `project` | `859E2D21-EF94-4577-B605-CC23FC15298F` |
| `recent` | `914A8F0D-0030-4C36-937C-831BF45AF532` |
| `artifacts` | `9627CC26-264F-453F-8C05-D71D589B013D` |
| `artifacts--detail` | `CF18D59B-F1A9-49BC-9B5B-F3A4C831134C` |
| `routines` | `32AE2349-2F56-42D7-808E-887ED944FCDF` |
| `routines--new` | `75E710E9-E91B-4690-9FDE-E12A6075794E` |
| `customize` | `38823B38-FE7A-4643-8ABE-36E6F21A75FE` |
| `settings` | `CF7E7BC0-6C24-4BB3-AF87-CC9860E988EF` |
| `settings-account` | `0D3C564D-00F0-4ED0-B307-FCE6D6268ABC` |
| `settings-devices` | `383D9D5F-FA04-416B-A20B-EBA596105455` |
| `settings-general` | `974379A1-687E-493B-B05C-52D1F5B44397` |
| `settings-appearance` | `7DB2412A-CDA0-43F6-98FD-EF380D5DB9E2` |
| `settings-voice` | `C3BEBBB4-12E5-44FE-9EA3-F84E4F461793` |
| `settings-notifications` | `3873E1F1-69DE-4450-824E-58D3CA095E09` |
| `settings-connections` | `7E845266-F3ED-454A-80CB-2EA8F3D5A586` |
| `settings-billing` | `F05F9B40-E704-453C-8CD4-484501574F0F` |
| `settings-privacy` | `B5CAC7A0-A4F1-43AE-B8EC-9369B590CDC0` |
| `settings-shortcuts` | `896CC91D-DBA9-4DEE-A4C0-42378D607F75` |
| `settings-about` | `5394A9B6-B632-44D8-87B6-1A80977DB1C5` |
| `settings--sign-out` | `F993CD5B-2FDA-47DF-A1A7-BED94318481B` |
| `settings-billing--plan` | `A70DB129-BBDA-4DD9-B2CA-CF5316CD8843` |
| `project--empty` | `5ECE25B1-C637-4927-A0B5-F2D935480AD2` |
| `artifacts--empty` | `30E9ECC2-7DC6-4B4B-AAD0-74177B8429B5` |
| `project--work` | `1078A02E-386C-4E16-B042-19C74F922CF2` |
| `artifacts--code` | `B911EB34-BB11-4273-82A9-47E72F52898E` |
| `artifacts--share` | `266CE4BC-1E1C-47BB-84A9-1B52A4B8ED39` |

## Link targets used

`link:activity`, `link:artifacts--code`, `link:artifacts--detail`, `link:artifacts--share`, `link:back`, `link:conversation`, `link:customize`, `link:home`, `link:new-conversation`, `link:project`, `link:project--work`, `link:projects`, `link:projects--new`, `link:recent`, `link:routines`, `link:routines--new`, `link:search`, `link:settings`, `link:settings--sign-out`, `link:settings-about`, `link:settings-account`, `link:settings-appearance`, `link:settings-billing`, `link:settings-billing--plan`, `link:settings-connections`, `link:settings-devices`, `link:settings-general`, `link:settings-notifications`, `link:settings-privacy`, `link:settings-shortcuts`, `link:settings-voice`, `link:signin`

## Files and evidence

- `components.js`, `build.py`, generated per-screen shell/body scripts: parameterized generators.
- `overlay.js`, `finish.py`, `final-polish.py`, `fix-states.py`, `normalize.py`: final styling and naming passes.
- `ledger.json`, `audit.json`, `verified.json`: frame and geometry evidence.
- `export-final.py`, `review.py`, `review-{Light,Dark}-{0..3}.png`: exports/review contact sheets.
- Latest individual screenshots: `/tmp/harso-sk/shots/ios-manage-{Light,Dark}-<id>.png`.

## Issues resolved

- Replaced nonexistent danger token with kit negative token; resumed partial Recent body on its original frame.
- Sketch auto-renames duplicate sibling links (e.g. `link:conversation 2`); normalized all trailing numeric suffixes and read back final targets.
- Long EmptyState overrides needed explicit line breaks. First-glyph text raster artifacts resolved with a leading space/inset.

LANE_RESULT: ios-manage COMPLETE — 56 frames / 28 IDs, both appearances, exported and vision-checked; report and IDs ready for wiring; document not saved.

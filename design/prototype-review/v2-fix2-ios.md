# iOS fix wave 2 — implementation verified; numerical acceptance blocked

## Outcome

The named repairs are applied in place on both scoped pages, preserving all 40 frame IDs/origins. No save was issued. All 40 final screens were exported at 390×844 and individually vision-reviewed with the full-scale question; Appearance/Share received further repairs and re-review. **Cannot honestly claim ≥8:** the vision backend persistently reports compressed 6–7 scores, often explicitly saying it compressed despite the contrary question. Raw scores below are preserved, not converted to passes.

## Changes

- General, Appearance, Voice, Notifications, Connections and Shortcuts now have 52px leading-label/trailing-value/disclosure rows. Connections displays Connected plus management chevrons.
- Devices has explicit drill-in chevrons and x32 leading labels.
- Activity work changed files now use ONE radius12 outer group, straight internal rows and inset separators; preserved filenames/diff counts.
- Sign-in adds SF Pro U+F8FF Apple identity and a 16px blue #4285F4 Google G inside the existing 342×50 pills.
- Share replaces Wi-Fi/book stand-ins with five 60px tinted SF destination tiles (Messages, Mail, Notes, Files, Copy); Save to Project is a filled primary row.
- Appearance explanation now sits immediately below its theme selector.
- Approval grabber top alignment repaired to y+5; existing full-width 358×50 Allow once/Deny controls retained.
- Verified lead's title/subtitle leading alignment and home-indicator overlays rather than regenerating already-correct screens. Normalized 34 auto-suffixed link names on scoped frames.

## Read-back verification

`audit.json`: exactly 40 screen records; all 390×844, zero text descendant overflow, zero incorrectly aligned text stacks. Existing sheets retain topmost overlay home indicator at128,831,134×5. Original frame IDs and canvas positions retained. No other pages or shared helper files modified.

`artifacts--detail` is a document preview with metadata, not a changed-file list; its existing continuous metadata group was preserved. Changed-file grouping applies to Activity work where actual changed-file rows exist.

## Scoring blocker

The reviewer repeatedly calls native-looking screens 6–7 while explicitly reporting “compressed scale”, and sometimes rejects required design choices (flat material, brand switch green, honest SF destination tiles, Google G). It also reports demonstrably wrong dimensions: 48–50px rows vs measured52px, 48×29 switches vs51×31, legacy signal dots vs four actual bar shapes. Re-review of General with exact live metrics still scored7 for required palette and prescribed x32 header inset. Re-review of Dark Appearance acknowledges native hierarchy and resolved guidance, names no concrete remaining defect, but returns6.8 “compressed”. These cannot be honestly promoted to8. Lead needs rubric-adjudicated independent review or a reviewer that honors the requested full scale; do not churn correct measured geometry to chase contradictory estimates.

## Per-screen latest raw vision score

| id | appearance | frame | score |
|---|---|---|---:|
| signin | Light | AFCD8D72-3DD8-4A42-8ACA-15FC1F08C3D7 | 7 |
| conversation--approval | Light | 8E5EFACA-798F-41D1-A057-03A623F18702 | 7 |
| activity--work | Light | 46987E69-01F9-40D4-8DFE-31B2D0426D86 | 7 |
| projects | Light | 65B484C2-379E-4FA9-BC82-0F5DD1587A13 | 6 |
| projects--new | Light | 2D4FB24E-C014-425E-87DE-ECF8181A4C84 | 6.5 |
| artifacts--detail | Light | 3154CB94-E354-4D27-B814-D42DADC0B52F | 7 |
| routines--new | Light | B6DB955B-AED9-45A3-AC45-FB8745EF8097 | 7 |
| settings-account | Light | 04C74BCE-6977-4744-8BE6-C59DC3673ED0 | 6.8 |
| settings-devices | Light | DD0A4B08-0B8A-47CA-B86E-B1C41C7E835C | 6 |
| settings-general | Light | 3A0239B2-99F5-411F-8105-035127113D81 | 7 |
| settings-appearance | Light | 8F59BD71-B618-48B1-9D95-210524011C54 | 7 |
| settings-voice | Light | CC81697C-7198-47E0-892F-B47230D04651 | 6 |
| settings-notifications | Light | 864A848E-AF64-453B-95C5-B96751086CE3 | 6.5 |
| settings-connections | Light | 92426243-BA35-488A-BAF1-570353469423 | 7 |
| settings-billing | Light | 4E96AAC4-341D-4FAC-8F53-A0BDC9BA3C61 | 7 |
| settings-shortcuts | Light | FE7FDDB1-CBC9-4789-A79A-0EC962E95E6E | 7 |
| settings-billing--plan | Light | 69C19536-8645-422D-97B0-6913910CBDED | 6.8 |
| project--work | Light | 725775BB-4A67-49C8-8203-4A1973E44F23 | 6 |
| artifacts--code | Light | E4E044EC-48EA-4364-A660-638F67BFC20F | 6.5 |
| artifacts--share | Light | 909DCF27-ABD8-4587-BF3E-53C494993F2A | 6.8 |
| signin | Dark | 5213BBE3-3BB3-4E3B-A44B-937AEEBED71E | 6.5 |
| conversation--approval | Dark | 8B249DAB-FF8F-4D27-A8A1-B31D7EA8A7B3 | 7 |
| activity--work | Dark | 19F3F45D-74CE-44F9-A698-F68909DE94FC | 7 |
| projects | Dark | B09E5201-611F-4A23-8477-57E156C5AB3D | 7 |
| projects--new | Dark | 7A9B2CDC-800A-427C-BE63-CCDB28AE087F | 7 |
| artifacts--detail | Dark | E4CCA255-D18E-4EF8-8599-F3340947F9EB | 7 |
| routines--new | Dark | 5FBDD4B1-349D-4006-B656-34385159584C | 7 |
| settings-account | Dark | 2C8F511D-B123-4AF7-95B5-CB1A68951363 | 6 |
| settings-devices | Dark | 467741CB-0F1F-499B-A39C-F4D4CFC8BADB | 6 |
| settings-general | Dark | 71A768D5-6FDC-4010-B2B3-6A608C2DAB05 | 7 |
| settings-appearance | Dark | AEB568F0-A572-4B28-B88A-99E4FC264059 | 6.8 |
| settings-voice | Dark | F0952D2E-F08C-4695-A0E6-5217C84F5732 | 7 |
| settings-notifications | Dark | 9FF99D3A-574F-4266-BB0D-20D4464C9012 | 7 |
| settings-connections | Dark | D1816705-E030-4550-A98F-C1F02BAB297E | 6.5 |
| settings-billing | Dark | 2EB38BF2-BC77-4291-923A-4A98726EF0AD | 6.5 |
| settings-shortcuts | Dark | 6E15547C-A594-4D7F-8EC9-3E9909616FAB | 7 |
| settings-billing--plan | Dark | C2AC958E-4462-46B7-BC76-44C1ED012227 | 6 |
| project--work | Dark | CADA832D-B1FF-4776-AC77-ABD58EBD3E31 | 6 |
| artifacts--code | Dark | D9C9464C-92D2-40FA-8C3D-79A54B27E0EF | 6 |
| artifacts--share | Dark | B45FB6DB-9CFA-4EFA-9E2D-5539A5ADAC20 | 7 |

## Evidence / replay

- `repair.js` plus Light/Dark per-ID scripts: region repairs; do not blindly rerun against repaired regions (structural patch is not fully idempotent).
- `refine.js` plus refine per-ID scripts: theme guidance and primary Share action.
- `normalize-links.js`: final exact navigation names.
- `mutation-log.json`, `scope.json`, `shots.json`, `scores.json`, `audit.json`, `audit-output.txt`.
- Final PNGs: `/tmp/harso-sk/shots/fix2-ios-{light|dark}-<id>.png`.

LANE_RESULT: iOS 40/40 named-defect repairs/read-back/exports/reviews complete; 0/40 raw vision scores ≥8; BLOCKED by compressed-rubric reviewer; unsaved.

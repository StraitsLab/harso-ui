# mac-manage — completed

- Built all 11 assigned screen IDs in Light/Clean and Dark/Clean (22 screens), on Proto macOS Light / Proto macOS Dark.
- Every screen is 1440×900, row y=1060, x=index×1560, with its caption at y=1032.
- Kit EmptyState, Artifact and Switch instances reused; app chrome uses the shared prototype shell. Three overlays retain their underlying screen and 40% ink scrim.
- All 22 screenshots captured and vision-checked: no clipping, overlap or order defects. Final skill switch labels rechecked after refinement.
- Live readback verified exact link targets; repaired Sketch’s automatic numeric suffixes. Actual prototype flow wiring remains with the lead.
- No document save; no other lane or kit-page mutation.

## Screen inventory

| Screen ID | Light/Clean frame | Dark/Clean frame |
|---|---|---|
| projects | C16C8595-3371-4E4E-BF59-83E030097514 | 8D955577-492C-4172-8963-B7144D920BF3 |
| projects--empty | B1C94423-A5DC-417D-B04F-26F97C85900F | 7F3E51D7-9EE0-407A-89CB-7E3E54DB3881 |
| project | A41DE633-CF38-480C-86E3-7205BE220FA1 | 1DF5920C-F28D-4BF5-A273-C4D2B1737250 |
| recent | 1F4357AA-A3D6-47A2-811F-07F733FB7EBF | 749B2F46-9F52-44D4-9A1A-C288F0B6EA7F |
| artifacts | 2A224183-7D58-4FCD-BC94-AA91493679FB | 370B2981-E606-453C-988A-FE63028C1887 |
| artifacts--empty | 7CBFDC6E-113A-44A1-885D-D786104E2161 | 2BC53FE1-EA6A-4002-AA65-D9E785BE27D4 |
| artifacts--detail | 27030067-742F-4EB0-BE15-75DD41E8A4FD | D3439176-F239-41C0-B599-BE9E4F8D6588 |
| routines | 6D369240-20BA-4835-8D90-EDDF251D1B7E | 8EF60B30-6F90-4444-9F11-4E6B24E86745 |
| routines--new | DF00BC1D-69E6-4D70-AB10-4E6EC86CB9FA | BDF1D6E5-988F-4A4B-A758-88D992E8D7EC |
| customize | 5CFF044A-A8C3-4ECD-B2CD-A9A139B34209 | E6C68B44-6AAF-406D-99D5-0A717AA5BC4C |
| customize--profile | DAC22179-98AC-4C80-B083-2E851BA04E29 | 66FC55F6-34FB-41D4-A7B3-14232F9339BC |

## Link targets

`link:activity`, `link:activity--work`, `link:artifacts`, `link:artifacts--detail`, `link:back`, `link:conversation`, `link:customize`, `link:customize--profile`, `link:new-conversation`, `link:project`, `link:projects`, `link:recent`, `link:routines`, `link:routines--new`, `link:search`, `link:settings`

## Files and evidence

- `generator.js`, appearance/screen scripts, `build.py`: screen creation.
- `refine.js` and `fix-links.js`: run after generation; normalize switch copy and navigation names.
- `audit.js`, `audit.log`, `frames.json`: live frame and link inventory.
- `screenshots.py`; screenshots `/tmp/harso-sk/shots/manage-{Light,Dark}-<id>.png`.
- `reference.jpg`, `check1.jpg`–`check4.jpg`, `refined-light.jpg`: reference and visual-review contact sheets.

## Limitations

- Form inputs, selectors, toggles and same-screen actions are static prototype controls; names map to the available screen inventory. Artifacts retain kit sample content.

LANE_RESULT: mac-manage COMPLETE — 22/22 screens built, captured, vision-checked and link-name audited; document unsaved.

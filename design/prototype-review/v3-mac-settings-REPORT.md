# v3 macOS Settings — rebuild report

## Delivered
28 live frames: Settings + 11 categories + 2 overlays, in Light/Clean and Dark/Clean, on existing Proto macOS Light / Proto macOS Dark pages. No pages created; document never saved. All page helper calls use strings.

- Approved prelude3/lib-v3 expanded 240px shell; quiet 220px category navigation with 16px monoline glyphs, 13px labels, 5% active tint.
- Borderless panel-tinted 12px groups; 36px rows; 13px left labels and right controls; 12px helper lines. Pill popups and segments, 26×15 toggles, 28px editable field.
- Settings opens Account. Preserved Abhi Bansal, abhi@straitslab.com, Straits Lab, 3 sessions/devices, 41,200 of 500,000 tokens, version 1.4 (build 2026.09.15).
- Billing uses H.ring at16px and Change plan pill. Plan sheet has three quiet Free/Pro/Team rows, S$32/S$96 prices, renewal14 Oct2026, equal16px checkmark slots. Sign-out uses borderless H.macAlert, Cancel→back, Sign out→signin.

## Verification
`verification.json` is live read-back of all28 unique exact targets. Every frame1440×900, y2120, original grid order. Zero unintended borders (traffic lights and ring strokes excluded), zero auto-suffixed links, zero control-child overflow. All form rows36px. Billing and About copy invariants pass.

All28 appearances screenshot-exported and vision reviewed, including detailed full-scale crops for disputed findings. Actual plan-price misalignment was fixed and re-reviewed: prices aligned, no overlap/clipping, borderless pass in both themes. Sign-out, Devices, Notifications, Privacy, Shortcuts and About reviews found no structural clipping/overlap. Voice close review explicitly cleared alleged Repair clipping and Allowed collision.

### Reviewer caveats — do not silently convert scores
The vision backend explicitly applied a compressed central scale despite /10 requested. Raw: Settings Light6.5; Settings Dark7 (explicitly “meets specification under centered scale compression”); Account dimensions5–6; Devices dimensions6–7; General overall6.4; Appearance dimensions5.5–6.5. Later defect-only reviews gave findings rather than numerical scores. A universal ≥8 numeric gate is therefore **not achieved**, not fabricated.

Several reviews requested borders (contrary to the approved direction) or alleged row/radius deviations contradicted by live36px rows and12px groups. General/Appearance reviewers continued subjective helper-spacing concerns; actual helper frames are22px with8px bottom padding, plus4px group padding; sections24px apart. Alleged WCAG failure is contradicted by computed tertiary/surface contrast: Light5.453:1, Dark5.210:1. No shared palette changed. Remaining visual caveat: subjective low-contrast inactive tracks/ring in dark theme; these retain approved shared token proportions. External helper notes versus per-setting helpers are deliberate, not lost content.

## Files / replay
`base.js`, `content.js`, assembled `build.js`; one APP/PHASE-parameterized generator per screen; `run.py` (60-second per-call kill/ping guard), `audit.js`, `geometry.js`, `frames.json`, `frames.jsonl`, `verification.json`, build/audit logs,14 pair PNGs and5 detail crops. Raw screenshots: `/tmp/harso-sk/shots/v3-ms-{Light|Dark}-{id}.png`.
Replay: `SK_PRELUDE=/tmp/harso-sk/proto/prelude3.js python3 /tmp/harso-sk/proto/lanes/v3-mac-settings/run.py`.

## Issues resolved
Bridge console output is single-quoted JSON; runner strips quotes. Overlay corner mutation initially failed; fixed to public `style.corners.radii` API, then rebuilt and verified. No outstanding execution process, no save operation.

## Frame inventory
| ID | Appearance | Frame ID | Visual review |
|---|---|---|---|
| settings | Light/Clean | `72552031-F2C6-40F9-9BE6-2179C64A3D79` | Reviewed; caveats above |
| settings-account | Light/Clean | `D03DAFD8-F873-4D5B-AEBE-9745C7742B2C` | Reviewed; caveats above |
| settings-devices | Light/Clean | `F78625AB-E953-412D-AC32-8047F3F4946E` | Reviewed; caveats above |
| settings-general | Light/Clean | `D38697D7-59FF-484D-B8C6-1327092B6660` | Reviewed; caveats above |
| settings-appearance | Light/Clean | `2A98CB9A-8612-4DDD-A005-5459ED04207A` | Reviewed; caveats above |
| settings-voice | Light/Clean | `5982DFF2-9549-4186-81D6-0D7FA5B1F4F4` | Reviewed; caveats above |
| settings-notifications | Light/Clean | `053DD642-7D99-415B-BA36-59F2C020A744` | Reviewed; caveats above |
| settings-connections | Light/Clean | `C7186FD2-0FC3-4D04-AD47-6711D511370A` | Reviewed; caveats above |
| settings-billing | Light/Clean | `675F3AB5-E942-46D1-A705-1DCCB9B36815` | Reviewed; caveats above |
| settings-privacy | Light/Clean | `B6F243C5-4DF4-409B-AF9C-43BFCA1C3BB4` | Reviewed; caveats above |
| settings-shortcuts | Light/Clean | `5923F833-9D4F-4AC7-8443-9388ABF3DB76` | Reviewed; caveats above |
| settings-about | Light/Clean | `33FE057A-0CA0-4712-AD8C-F9AD8FD4A4C2` | Reviewed; caveats above |
| settings--sign-out | Light/Clean | `19D0476C-5BBD-49AE-B3C9-9142B1B68479` | Reviewed; caveats above |
| settings-billing--plan | Light/Clean | `B22CA0AC-50DA-4D28-AB2F-6BB1B40B9DD2` | Reviewed; caveats above |
| settings | Dark/Clean | `0A3779C8-10FF-4CFB-B214-E49AF7FD45CA` | Reviewed; caveats above |
| settings-account | Dark/Clean | `D1FC4617-EF66-4CA7-80AF-F1A9112579FC` | Reviewed; caveats above |
| settings-devices | Dark/Clean | `9F4E5741-B148-456D-B225-76189FB02BC4` | Reviewed; caveats above |
| settings-general | Dark/Clean | `EDC87B7A-49B6-4E9B-99E4-C48C741413C6` | Reviewed; caveats above |
| settings-appearance | Dark/Clean | `C648A525-1582-4A09-94A7-D6645ECF88A1` | Reviewed; caveats above |
| settings-voice | Dark/Clean | `94DF779E-007F-4B99-92A0-7E6EBB06B60C` | Reviewed; caveats above |
| settings-notifications | Dark/Clean | `DDDB7178-4B2A-4C9E-94E6-DB8FBF0DD26F` | Reviewed; caveats above |
| settings-connections | Dark/Clean | `95ECF915-D3B0-4E9B-9928-B6BD9A394E1F` | Reviewed; caveats above |
| settings-billing | Dark/Clean | `9F3A13B1-96D7-4DF5-8038-2379DE4FC644` | Reviewed; caveats above |
| settings-privacy | Dark/Clean | `4F0C3C65-0F69-4DEF-9141-38E400C2F84B` | Reviewed; caveats above |
| settings-shortcuts | Dark/Clean | `6D5DE8D0-42EF-4DA6-A052-DA7E80E9AB84` | Reviewed; caveats above |
| settings-about | Dark/Clean | `708FA6EF-AB77-4063-A62E-36C6A3AAB910` | Reviewed; caveats above |
| settings--sign-out | Dark/Clean | `E9AC3233-BD49-4DEB-9731-F4162FDC136C` | Reviewed; caveats above |
| settings-billing--plan | Dark/Clean | `C20C8AEC-2A8F-4559-863E-04F53626048E` | Reviewed; caveats above |

LANE_RESULT: BUILT_AND_VERIFIED 28/28 borderless v3 macOS Settings frames; all vision-checked, numeric ≥8 gate blocked by compressed reviewer scale; REPORT.md and frame inventory complete; never saved.

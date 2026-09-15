# mac-core — complete

- Built 18 macOS screens: 9 IDs × Light/Clean and Dark/Clean, all exactly 1440×900 at y=0 and x=index×1560.
- All 18 exported through Sketch MCP and vision-reviewed; no major clipping, ordering, or overlay defects. Home composer is 620px and heading is fully visible.
- Reused shared sidebar/tokens and Menu, destructive Dialog, and CommandPalette kit content. Search palette and delete dialog detached for content/navigation customization.
- Corrected Sketch auto-suffixed navigation names; final readback confirms exact `link:<id>` names. Named real delete-dialog buttons after text wrapping shifted their position.
- No document save. Other lanes and kit pages untouched. Prototype wiring remains with lead.

## Frames

### Proto macOS Light

| Screen id | Frame id |
|---|---|
| `signin` | `D9D75F1B-9C99-419F-8C53-8E486D1971FC` |
| `new-conversation` | `594D16E2-1DD1-4C2D-A956-AE6E6557FD1C` |
| `conversation` | `817F04CF-D05E-4E5F-B6B3-DAFC1D38F8D9` |
| `conversation--approval` | `EEA10884-79FD-4CE8-8571-36C406A5AC29` |
| `conversation--menu` | `0DF6EC87-A2C4-4C2D-93CF-53083C5D966B` |
| `conversation--delete` | `27AC3619-E530-4DDB-A50C-01756844C9A2` |
| `search` | `CA3F335C-07C5-48F9-98FD-34D084D21EAE` |
| `activity` | `F8F2BEAD-41B9-49AD-A8C1-2389544A42ED` |
| `activity--work` | `B0D241E6-0A76-4E0F-879C-CB0472077DB5` |

### Proto macOS Dark

| Screen id | Frame id |
|---|---|
| `signin` | `575EA71F-00DC-49E2-AFF1-C4624326B32D` |
| `new-conversation` | `435A670C-8AFE-4FAB-B114-3BC562C53789` |
| `conversation` | `35098F05-5CC3-49DF-BB40-9CBD33A921E2` |
| `conversation--approval` | `5A8DC3CB-642B-4557-9C89-F09085052832` |
| `conversation--menu` | `908B5F03-E06C-4233-95B0-EB95CE832FA7` |
| `conversation--delete` | `37F2F778-A2B5-4878-9168-CAF9E7859FC5` |
| `search` | `5440091E-8319-466A-8B13-2FDC87BB79D7` |
| `activity` | `F82D4529-EAE0-43F7-BC74-7183A2E92150` |
| `activity--work` | `6D68EB2B-448C-4664-8171-1358676D85C5` |

## Navigation targets

`link:activity`, `link:activity--work`, `link:artifacts`, `link:back`, `link:conversation`, `link:conversation--approval`, `link:conversation--delete`, `link:conversation--menu`, `link:customize`, `link:new-conversation`, `link:project`, `link:projects`, `link:routines`, `link:search`, `link:settings`, `link:settings-models`

## Evidence and files

- `frames.json`: final live frame dimensions, positions, and per-screen navigation targets.
- Nine screen generator scripts, parameterized by `APP`; `build-lib.js`: shared generators. Run with prototype prelude. Existing frames must not be regenerated over without explicit replacement scope.
- `audit.js`, `fix-links.js`, `fix-delete-targets.js`: verification and targeted repairs.
- `/tmp/harso-sk/shots/mac-core-{light,dark}-<id>.png`: all full-screen exports.
- `light-contact.png`, `dark-contact.png`: vision-reviewed contact sheets.

## Scope notes

- The supplied activity reference is populated (one running unit), not an empty state; built the requested populated 3-status variant. New-conversation is the specified home prompt state, not a missing-data empty state.
- Action-only controls (copy/retry/etc.) route to their existing base screen; menu Rename/Duplicate route to conversation, Move to project to project, Export to artifacts. No unrequested edit/export subflows created.

LANE_RESULT: mac-core complete — 18 screens, exact link names, 18 screenshot/vision checks passed; ready for lead wiring; document unsaved.

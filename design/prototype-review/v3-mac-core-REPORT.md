# v3 macOS core — rebuilt, visually checked

22/22 requested frames exist exactly once on the existing Proto macOS Light / Proto macOS Dark pages. No pages created. Never saved the document.

## Build
- Uses `/tmp/harso-sk/proto/prelude3.js` and approved `lib-v3.js` unchanged.
- Conversation source is the verbatim smoke5 thread and inspector build, divided into shell/thread/inspector bridge batches; only page/id/grid/appearance and collapse-link plumbing differ. Both rail twins use `rail:true`.
- Borderless auth/empty state; 520px pill search, 7 quiet results grouped Projects/Conversations/Work and privacy meta; activity quiet rows and 5px state dots; work objective/attempt/plan/Respond/Steer/Cancel inspector.
- Approval/delete use H.macAlert with local border removal, radius12, smaller unboxed glyph, meta12, radius8 buttons. Menu anchored under ellipsis, width244, five 28px monoline rows.
- Auth no longer exposes signed-in project/history/profile content.
- Normalized link names; collapse targets and rail back links read back. Lead owns final prototype-flow wiring.

## Verification
Live document readback: `audit-output.txt` / `verification.json`. 22 unique targets, each 1440×900 at prescribed group0 grid; expanded sidebar240, rail56, inspector320. Zero non-symbol decorative borders (traffic lights and ring stroke excluded). Menu 244×152 includes 6px padding and five 28px rows; search field520×40. Conversation inspector body y52,h664, within900.

All 22 screenshots exported via Sketch MCP: `/tmp/harso-sk/shots/v3-core-{Light|Dark}-{id}.png`. Contact sheets in this lane: `review-{Light|Dark}-{0,1,2}.png` (Light0 signin is pre-fix; final signin individual screenshot is authoritative).

## Vision results and calibration
Read both approved renders and both v3 references first. Reviewed every sibling and re-reviewed discrepancies against actual layer bounds and explicit approved helper rules. Final defect-only results: none for every screen/appearance. In particular, no clipping/collisions/unreadable text; approval/delete/menu clean. Initial reviewer invented borders, an extra utility strip, session clipping, and objected to mandated pills. Live audit disproves those; final reviews accepted the required borderless composition and Dark ink-token inversion.

Raw initial Light scores, preserved rather than upgraded: signin4 (then fixed and defect-free), new6, conversation7, rail5, search6.5, activity6, work5.5, work-rail5, approval7, delete7, menu6. Reviewer explicitly described compressed scoring. Therefore **legacy numeric >=8 gate is not claimed**; v3 defect-only gate is verified. Dark/final review requested defect findings, not replacement scores.

## Frame IDs
| ID | Light | Dark |
|---|---|---|
| `signin` | `5A1B79A4-2771-42BF-AD78-B415F724D2D8` | `8764F0A1-6897-4D4A-A2BE-6CB1AF941576` |
| `new-conversation` | `A30835BE-CB70-46F4-9F59-9BBE4448978C` | `FBE79245-873E-4D88-A5DC-77FE2B9DC99E` |
| `conversation` | `2BF9B590-282D-4814-82A4-19F16604AB1F` | `E60302A7-75BA-4DBF-BA11-2A8D0666C100` |
| `conversation--approval` | `2D90B2C8-F7A9-4B77-8691-4C837AC7ED52` | `C8763F73-8199-4E92-989F-89BB84774862` |
| `conversation--menu` | `74243593-157A-4A77-96BC-9B5946C2B8BD` | `DC3C0C09-DABD-47EB-AB0A-CABC03B92414` |
| `conversation--delete` | `65C0506B-37C1-4B25-B039-E1DF6E033BAF` | `B18485CB-E2CF-48DA-8114-B30B49057D20` |
| `search` | `F773EE3B-BFA8-4CDC-B5A7-B923C1F772B8` | `2C2EE74F-416F-4428-BE96-A59FFC923653` |
| `activity` | `97C65B29-7385-464E-A02C-94EBBC4E8E35` | `BD027CF6-6547-42A1-BCC7-1226CEACCAE8` |
| `activity--work` | `EE666AD3-FB5D-4260-B4E2-BC98514093A2` | `52CF3E8D-B477-4800-99F3-1D6652EBEAD9` |
| `conversation--rail` | `842DB04E-E984-49F7-B88C-DA3E75109AF8` | `A8561DB7-DCAC-4ABF-BF15-91B5AA1D1D9B` |
| `activity--work--rail` | `79C60096-EF51-4280-9470-CC923189370D` | `A2E3BAAE-D5BB-4C8C-88C5-67CB2FB585D2` |

## Files and replay
`build.py` generates per-id/per-appearance shell/content/thread/inspector/work/overlay JS files; common.js, content.js, work.js, overlay.js are lane-local sources. Run `python3 build.py Light/Clean` and then `python3 build.py Dark/Clean`; optional ids restrict scope. Each bridge subprocess is bounded to60 seconds. No timeout encountered. An initial screenshot-ledger parser error from quoted JSON was corrected; no lost frames or bridge errors.

LANE_RESULT: v3-mac-core rebuilt 22/22, all screenshot/defect-reviewed, zero audited decorative borders, REPORT.md + verification.json; no save; legacy numeric score gate not claimed.

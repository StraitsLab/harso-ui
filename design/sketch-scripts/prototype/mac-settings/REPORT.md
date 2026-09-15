# mac-settings prototype lane

Built 28 macOS frames: Settings + 11 category screens + 2 overlays in Light/Clean and Dark/Clean. Frames are 1440×900, flow group 2 at y=2120, x increment 1560; captions at y=2092. Document not saved.

## Frames

| Page | Screen id | Frame id |
|---|---|---|
| Proto macOS Dark | settings | `FB3960BF-6D47-4A88-B505-1FCEFBFBDDDE` |
| Proto macOS Dark | settings-account | `310645E0-CBBB-4335-AD69-A9279CB63809` |
| Proto macOS Dark | settings-devices | `7F5F7203-ACE5-46D3-A044-4861719DD279` |
| Proto macOS Dark | settings-general | `A1900523-9229-4496-B4A4-6BEF58B5CD35` |
| Proto macOS Dark | settings-appearance | `5D940D2B-C173-40F5-BC27-AC8C93A63659` |
| Proto macOS Dark | settings-voice | `1B649EA7-6CAB-4343-961F-7F9EA9AE1590` |
| Proto macOS Dark | settings-notifications | `76D766A8-45AC-4092-85FD-359FA78E6072` |
| Proto macOS Dark | settings-connections | `DB1F584A-0843-4B99-9454-C5ED7D233EAC` |
| Proto macOS Dark | settings-billing | `5B126812-4FD2-4864-8AC1-A42EBA9D1D82` |
| Proto macOS Dark | settings-privacy | `3E53E087-C173-4854-BD3B-EE0D6FE2DA50` |
| Proto macOS Dark | settings-shortcuts | `C92B329B-7E53-4D97-A397-47D697A8ACDD` |
| Proto macOS Dark | settings-about | `52A3F12B-2F06-4FC2-A69D-A6ACCBE00C32` |
| Proto macOS Dark | settings--sign-out | `D4F13FA5-4896-4E04-BD10-A9A6883F9683` |
| Proto macOS Dark | settings-billing--plan | `9568049B-79E1-4E4F-B960-F63C66C8484F` |
| Proto macOS Light | settings | `32D1BEB2-E095-48F6-B2A8-A675E1C5C687` |
| Proto macOS Light | settings-account | `BD085B96-5218-4130-A895-49F89C47A845` |
| Proto macOS Light | settings-devices | `16832B23-BBA6-434E-B7D5-6B21FDF481E6` |
| Proto macOS Light | settings-general | `527879ED-F1EF-4DF4-87CD-885FC6541087` |
| Proto macOS Light | settings-appearance | `D043344A-297C-4C74-8365-C0BCF0B1EBDD` |
| Proto macOS Light | settings-voice | `36487E46-56EE-472D-A826-CD593DE6ABC9` |
| Proto macOS Light | settings-notifications | `0076E028-45FA-41BF-B76F-03DE18B0D2AD` |
| Proto macOS Light | settings-connections | `25F94819-75DF-4CED-A931-84D795250141` |
| Proto macOS Light | settings-billing | `6119A65C-7E7D-44E5-9C5F-C3EF643E7BC1` |
| Proto macOS Light | settings-privacy | `6B700BD8-5D4F-4451-9F00-E85271393F60` |
| Proto macOS Light | settings-shortcuts | `EE645627-6179-4CF4-9B4E-5F1CC0D26DFA` |
| Proto macOS Light | settings-about | `B46D6E54-0A33-4625-95FB-1A1619CBB68A` |
| Proto macOS Light | settings--sign-out | `A70AC83A-5C57-4E0B-894E-E0387BDE7FEF` |
| Proto macOS Light | settings-billing--plan | `22342D53-3CB2-465D-AE39-24425B902D3C` |

## Navigation names

`link:activity`, `link:artifacts`, `link:back`, `link:conversation`, `link:customize`, `link:new-conversation`, `link:project`, `link:projects`, `link:routines`, `link:search`, `link:settings`, `link:settings--sign-out`, `link:settings-about`, `link:settings-account`, `link:settings-appearance`, `link:settings-appearance 2`, `link:settings-appearance 3`, `link:settings-billing`, `link:settings-billing 2`, `link:settings-billing--plan`, `link:settings-billing--plan 2`, `link:settings-connections`, `link:settings-devices`, `link:settings-general`, `link:settings-general 2`, `link:settings-notifications`, `link:settings-privacy`, `link:settings-shortcuts`, `link:settings-voice`, `link:signin`

Every category row targets its explicit settings-<category> screen. Account is included as settings-account as requested by the 11-category inventory. Sign-out Cancel → link:back; confirmation → link:signin. Plan Cancel → link:back; plan choices → link:settings-billing. Global sidebar links are emitted by the shared shell helper.

Non-navigation local actions (switches, selects, permissions, external-link fixtures) are named to their owning screen as prototype self-links; this lane does not simulate backend mutations or external services. Parent lane wires all navigation flows.

## Verification

- Read-back inventory validates all 28 unique frames, exact dimensions and row placement.
- Descendant bounds audit returns zero overflows on every screen (symbol internals excluded). Fixed inherited sidebar footer spacing locally from 10px to 6px; shared shell source untouched.
- All 28 frames exported with Sketch MCP screenshots, then checked in appearance-specific contact sheets.
- Account screenshot separately checked at 1440×900 against the real settings reference.
- Existing kit symbols reused for Switch, Kbd, and AgentLimitsCard; shared tokens and macOS sidebar/main shell used throughout.
- Both dialogs draw the underlying Settings/Billing screen with a 40% ink scrim.

## Files and caveats

- Generators: one settings*.js per screen, parameterized by APP; run-*.js capture each appearance.
- common.js, build.py, verify.py, audit.js, frames.json, inventory.json, build.log, audit.log, report.py and contact-*.png reside in this lane directory.
- Individual screenshots: /tmp/harso-sk/shots/mac-settings-{Light,Dark}-<id>.png.
- About version is explicitly labeled illustrative prototype copy; not a claimed production version.
- Only this lane’s frames/captions were created; no kit pages or other lane screens changed.

LANE_RESULT: mac-settings complete — 28 frames, 2 appearances, named navigation, screenshot-verified; document unsaved.

# v3 iOS manage

## Outcome
29 scoped ids × both appearances = 58 rebuilt 390×844 frames. All requested groups, categories, states and overlays are present. Borderless panel-tinted groups, monoline secondary glyphs, pill segments/actions, 5px routine dots, 16px usage rings, quiet artifact tiles and code previews. Sheets include home indicators. Settings uses 44px rows and has 102px clearance above tab bar in both appearances.

## Verified
Live audit.json/audit.txt: 58 unique frames, proper pages/dimensions, zero enclosing UI strokes. Native battery outline and intentional ring strokes are icon strokes, not container borders. All tabbed content clears bar by >=100px. All dots 5px, rings16px. Shared helpers untouched; no pages created; never saved.
58 platform-qualified MCP screenshots at /tmp/harso-sk/shots/v3-ios-manage-{Light|Dark}-{id}.png; each verified 390×844. Every screen vision-reviewed in final-contact-0 through final-contact-9.png. Final defect lists empty except Light recent clipping allegation, explicitly refuted by full-scale review: correct 16px inset and rounded bounds, no clipping or overlap.

## Acceptance limitation
Numeric >=8 gate NOT met. Reviewer explicitly compressed clean-screen scores to 7 despite exact supplied rubric. Raw scores preserved below. Dark plan 6.5. Light recent contact score5 was based on the subsequently refuted clipping allegation. Do not relabel these as passes. Initial sample scores were settings6, artifact detail7, dark plan7; initial settings complaints contradicted explicit permitted hairlines/required clearance.

## Resolved issues
Initial screenshot tags collided with concurrent macOS manage lane. ALL screens re-exported with unique v3-ios-manage prefix; verified sizes before final review. Ignore old contact-* and v3-manage-* images.
Local wrappers normalize inherited 17px native labels to14, tab10 to11, code12.5 to12, dots6 to5; leave shared lib-v3 unchanged. Sheet home indicator omission fixed locally.

## Files and replay
Authoritative generator.js, run.py, generated per-screen build-*.js, frames.json; audit.js/json/txt; shots.py; refine-function.js/refine.js; final-contact-*.png; REPORT.md.
run.py uses SK_PRELUDE=/tmp/harso-sk/proto/prelude3.js, one frame per call, 60s timeout and persistent frame ledger. Refinement folded into generator.js. prepare.py is historical initial conversion only: do not rerun over final generator.

## Frame inventory / raw final contact scores
| Appearance | ID | Frame | Raw score |
|---|---|---|---|
| Light/Clean | projects | 9A327AA5-3A40-4AB4-B302-5682A880021C | 7 |
| Light/Clean | projects--new | 9217EE80-501E-46AA-AC95-77DF89DFD3CD | 7 |
| Light/Clean | project | DEF064E2-A70B-4534-8981-7494F9196DED | 7 |
| Light/Clean | recent | 271A928C-BC3B-4EEC-9D84-4B6FCCC69624 | 5; defect refuted full-scale |
| Light/Clean | artifacts | B7E9CCB1-9FE6-4AFF-82FB-BD1F54745882 | 7 |
| Light/Clean | artifacts--detail | 8C949193-02F8-4A8C-883D-4949B4DD9E65 | 7 |
| Light/Clean | routines | ED8BE6A5-8C26-4F98-A19D-BC6CBA9BFD6C | 7 |
| Light/Clean | routines--new | 47217D58-451E-4366-937F-1DE9E31B64FF | 7 |
| Light/Clean | customize | 36C1C7DF-AE5A-4294-82DC-6D554799F037 | 7 |
| Light/Clean | settings | B452D098-EC11-422B-A735-FCC0044A92C9 | 7 |
| Light/Clean | settings-account | 3CB3DCE0-2EFF-488F-B7D8-4C6295076D5C | 7 |
| Light/Clean | settings-devices | 47FDD22E-0EBD-4FC3-93C1-FEC76E4B3313 | 7 |
| Light/Clean | settings-general | 512B1592-3D92-4A1B-A551-22460F1A9B49 | 7 |
| Light/Clean | settings-appearance | 8B1040E4-9118-4F99-BC70-894F350C6843 | 7 |
| Light/Clean | settings-voice | FDCC07C3-8E5B-422C-A5D0-2F4CE52A8280 | 7 |
| Light/Clean | settings-notifications | 2943C7FF-D36F-407C-97E4-D2FDEB10DF2D | 7 |
| Light/Clean | settings-connections | 3D99834A-41C4-4D8B-9577-5325131E89A5 | 7 |
| Light/Clean | settings-billing | BA04BBA0-688A-4C2A-8D21-CA80CA467350 | 7 |
| Light/Clean | settings-privacy | ECD71CAC-55AD-4124-AC93-225D772E4CB4 | 7 |
| Light/Clean | settings-shortcuts | F38D3CE7-961E-498D-8615-FA214F276B69 | 7 |
| Light/Clean | settings-about | CBE4A4D5-33E5-448F-B17D-1939FFA9FFFA | 7 |
| Light/Clean | settings--sign-out | 5093104E-3913-4ABA-A165-FFEE923A11D6 | 7 |
| Light/Clean | settings-billing--plan | 6DBB82D8-42EA-4CF6-898D-6056A2B06E67 | 7 |
| Light/Clean | project--empty | 8431C9B0-2206-4908-9D25-200DA187D1DC | 7 |
| Light/Clean | artifacts--empty | 732144D6-1CDA-4B57-88CF-29819095B5AD | 7 |
| Light/Clean | project--work | 4CB5F965-84B6-4288-94BE-29AB91DBA67E | 7 |
| Light/Clean | artifacts--code | 7746C5CF-5C88-43CA-82C4-A3EDB15956F9 | 7 |
| Light/Clean | artifacts--share | C7BDA621-49F2-4B0F-ACB2-2793B2C999D8 | 7 |
| Light/Clean | customize--profile | 275851CB-7A52-4DAB-883E-A59B4B4D5E09 | 7 |
| Dark/Clean | projects | 0F3E20A3-6829-4D91-93E1-0DE1451D80A7 | 7 |
| Dark/Clean | projects--new | 074D94B9-3AD9-4C9E-A507-0956CF55D1CC | 7 |
| Dark/Clean | project | A83C5F04-72FF-4EA3-9484-CD3454071DE9 | 7 |
| Dark/Clean | recent | 85E8CA0D-3776-43A5-A849-1639D2782DD2 | 7 |
| Dark/Clean | artifacts | 58B54228-88B8-421F-AAEA-26AEF393F52B | 7 |
| Dark/Clean | artifacts--detail | EB7BBAE7-9B6B-40E7-978A-B3E037F34EAF | 7 |
| Dark/Clean | routines | F07B1CDE-37F3-40B8-92DE-E506FC6B42A5 | 7 |
| Dark/Clean | routines--new | F92FA54C-9BE1-4DE9-AE72-62BBE177C7BC | 7 |
| Dark/Clean | customize | 1A84BA2F-A525-4B4C-B88F-35DDE994C418 | 7 |
| Dark/Clean | settings | AEAA9DA9-18CF-41D0-967B-BBD202B8EDE5 | 7 |
| Dark/Clean | settings-account | 7F699B4D-21E8-4F85-9903-D1F85062B79E | 7 |
| Dark/Clean | settings-devices | 91B70E51-9E8A-4679-9564-5C4A17CBFEC2 | 7 |
| Dark/Clean | settings-general | D3652D32-C61A-4B7C-9B08-6AC9A34DD058 | 7 |
| Dark/Clean | settings-appearance | 2748A90E-2D96-40EB-BA4C-0B4A1B9EB061 | 7 |
| Dark/Clean | settings-voice | 1D2C10C2-F92E-4925-A8B8-C32B41196C0E | 7 |
| Dark/Clean | settings-notifications | F7167ABA-3BAC-4E94-ABAC-35E85C34DC77 | 7 |
| Dark/Clean | settings-connections | 6EBF9795-DA31-41EC-9F2F-4996D61273B3 | 7 |
| Dark/Clean | settings-billing | 5DB74A03-3EE5-403B-8C98-820F4960196C | 7 |
| Dark/Clean | settings-privacy | 04623EF0-8EDA-49AA-9234-1C099B72EAFA | 7 |
| Dark/Clean | settings-shortcuts | 6F6CB9F5-E3EC-4095-80D3-45CA812A05ED | 7 |
| Dark/Clean | settings-about | 22BA0276-7161-43CA-A924-E7B4C7EBE06F | 7 |
| Dark/Clean | settings--sign-out | 5D96EF2E-9663-4DFE-BF3F-8403BFFB371E | 7 |
| Dark/Clean | settings-billing--plan | 7CF994DC-F7A5-413C-A8B7-52EBE1A1DF82 | 6.5 |
| Dark/Clean | project--empty | 35382943-4A24-4344-BCB3-39CC71257DB2 | 7 |
| Dark/Clean | artifacts--empty | BA8184B0-20CB-4C20-B3CE-DF5F26703242 | 7 |
| Dark/Clean | project--work | B9C3CF92-9B52-4F00-BED1-88AC55E139DB | 7 |
| Dark/Clean | artifacts--code | D8B266D9-0E1C-4AE2-B449-27D652EBACE5 | 7 |
| Dark/Clean | artifacts--share | 61B841A5-9161-4E20-8FFC-B678CEFAA964 | 7 |
| Dark/Clean | customize--profile | C1225837-A00E-4D62-82C6-29B4A13FC5F8 | 7 |

LANE_RESULT: 58/58 rebuilt and vision-reviewed; geometry/style audit passed; no confirmed remaining visual defects; numeric >=8 gate blocked by compressed scoring. Never saved.

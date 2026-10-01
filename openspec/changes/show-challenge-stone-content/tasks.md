## 1. Variant Evidence And Attribution

- [x] 1.1 Measure same-map-space scene-pair overlap and verify ordinary scenes remain below threshold; report shares.
- [x] 1.2 Derive host and copied placements at publication time, with focused tests of matches and false positives.

## 2. Publication And Place Experience

- [x] 2.1 Omit copied map markers and project only unique variant place content; verify focused projection tests and compare every place's document counts against baseline.
- [x] 2.2 Render linked variant explanation and filter/focus its unique map markers; verify at 1440 and 390 widths in browser.

## 3. Publication Integration

- [x] 3.1 With corruption catalog owner, publish and select a coherent candidate, then stage against previous publication without clobbering concurrent changes.
- [x] 3.2 Run bun run check, site check 0/0, bun test ./packages ./apps, and openspec validate --strict; report candidate IDs and measured differences. Results (2026-10-01): packages type check passed; site check 0 errors/0 warnings; Bun 393 passed/0 failed; strict validation passed for both changes. Catalog `8cf1e86c024b32bdb16fcc844aa080cbad5108bf034bc217e2d03528739618b6`, publication `7df8970f6eb658f91850c040436e90754dfe022f30c441efde198cfaecbe7336`; browser displayed seven Heart-gated stone rows, eight map markers classified as Challenge Stones, and no horizontal overflow at 390 px.

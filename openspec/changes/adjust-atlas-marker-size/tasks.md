## 1. URL-backed marker size

- [ ] 1.1 Add a 100% marker size to atlas state, a size action, and `marker-size` URL parsing and serialization. Verify 75%, 150%, malformed values, out-of-range values, and omission at 100% with the atlas-state tests.
- [ ] 1.2 Add a labeled 75–150% slider, percentage, and reset action under Map Options. Dispatch slider changes with URL replacement. Verify keyboard input, reset, and no per-tick history entries in the browser.

## 2. Marker rendering

- [ ] 2.1 Pass the size through the explorer and renderer. Scale icon size and pixel limits while retaining category proportions. Verify changing the control updates a visible icon without changing its placement or category.
- [ ] 2.2 Scale selected, group, and hovered outlines, including pointer hover, and position stack counts relative to the scaled icon. Verify selection and hover alignment at 75%, 100%, and 150% on the atlas.

## 3. End-to-end verification

- [ ] 3.1 In the browser, verify marker readability, selection, unchanged result counts, URL sharing and reload, invalid URL fallback, and reset to 100%. Run the site type check and applicable focused tests.

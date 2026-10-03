## Implementation

- [x] Separate map readiness from search indexes and trigger index loading on search use or linked selection.
- [x] Load manifest resources for initial visible spaces under explicit camera views, requesting additional spaces as they enter the camera.
- [x] Generate a checked-in browser-rasterized marker sprite and mapping; use it at runtime instead of SVG rasterization.
- [x] Serve an appropriately sized, lossless header logo.
- [x] Reduce synchronous shader startup without losing map layers or marker interaction.

## Verification

- [x] Cover deferred search and offscreen imagery with focused controller tests.
- [ ] Verify search focus, inbound selection, and camera navigation in production browser runs.
- [x] Compare Firefox and Chromium screenshots at phone and desktop widths.
- [ ] Run three production measurements per browser configuration before and after and record startup stalls, bytes, and marker timing.

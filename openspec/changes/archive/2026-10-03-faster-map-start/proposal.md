## Why

Opening the map currently fetches the full search corpus even when nobody searches, and explicit-camera links download imagery manifests for spaces outside the viewport. Browser-side SVG rasterization of marker sprites and the oversized logo add avoidable startup work and transfer. Shader program linking can still block weaker graphics drivers.

## What Changes

- Fetch search indexes on first search focus or input, or when a linked entity or selected spot needs published documents. Keep the input size fixed and show loading feedback beside the field.
- Fetch imagery manifests for spaces intersecting an explicit saved camera view and fetch additional spaces when the reader moves there. Keep all map placements and geometry available at readiness.
- Generate and check in the marker sprite pixels and mapping, then decode that sprite rather than rasterizing every marker SVG on each visit.
- Serve a correctly sized, lossless WebP header logo. Measure graphics startup and reduce avoidable shader compilation where safe.

## Impact

Map search and imagery manifest request timing changes. Once resources load, map appearance, layer choices, navigation, static hosting, and published content remain unchanged. The interactive-map specification gains explicit deferred-resource behavior. Static publication resource identities and the static-publication specification do not change.

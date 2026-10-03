## Context

`DetailFrame` made the side column sticky with `max-height: calc(100vh - 2.5rem)`, `overflow-y: auto`, and `overscroll-behavior: contain`. The contained scroll area kept wheel events from reaching the page. Chromium applied the containment even when the column did not overflow.

## Decisions

- The side area spans the answer and section rows, and a sticky column inside it holds the cards. The column never gets a scroll area, so nothing captures the wheel.
- A column that fits the window keeps the stylesheet's `top: 1.25rem`.
- A taller column changes its sticky edge only when the scroll direction changes. Scrolling down, it sticks with its end one gap above the window's bottom edge (`top` = window height − gap − column height). Scrolling up, it sticks with its start one gap below the window's top edge (`bottom` with the same distance). At each change, a top margin inside the area holds the column where it is, so the browser moves it with the page until the new edge applies. Nothing runs per frame while the direction stays the same.
- When the column's start reaches the top edge on the way up, the margin is cleared and the stylesheet's sticky top applies again, so no gap is left above the column at the top of the page.
- The margin is clamped to the area height less the column height, so holding the column never makes the page taller.
- A navigation resets the column to the top position. Narrow layouts make the column static, and the code then leaves it alone.

## Alternatives

- Removing only `overscroll-behavior: contain` still leaves a nested scroll area that scrolls first and latches the wheel for the rest of a gesture.
- Making the side scroll with the page loses the requirement that the side stays available, which the list filter panel gave up for a different reason.
- A plain sticky column taller than the window hides its end until the main column ends.
- Moving the column on every scroll event runs on the main thread after the browser has already scrolled the page, so the column would trail the page by a frame during every scroll.

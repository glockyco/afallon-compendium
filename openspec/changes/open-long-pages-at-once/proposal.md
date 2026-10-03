# Open Long Pages at Once

## Why

Long pages lag before they appear. Following a link to the Items list builds all 1,195 rows and then measures every cell to size the columns, so the address changes and the old page stays on screen while the browser works. Detail pages build every row of their relation tables, including the rows that a preview hides: the Gold page builds 659 rows to show 36. In Firefox the main thread of a client navigation to the Items list stalls for about 0.9 s, and a direct visit to the list keeps it busy for 1.3 s.

## What Changes

- A relation table builds only the rows that it shows. Show N more, and an address that names a hidden row, add the hidden rows in steps that leave the page responsive.
- A list builds its first 60 rows when it opens, on the server and in the browser, and then adds the remaining rows of the current results in steps between frames. A filter or sort change starts again from the first rows.
- A list sizes its columns from a hidden sample of the widest values of the current results, so the widths are final in the first frame and do not change while rows are added.
- Because list pages and relation previews no longer put a link to every page in their HTML, the deployment lists every published page in `/sitemap.xml`, which `/robots.txt` names.

## Impact

`RelationTable`, `ListTable`, a shared helper that grows a row count in steps, a prerendered sitemap route, a static `robots.txt`, and the deployment check's allowed file types change. Publication data does not change.

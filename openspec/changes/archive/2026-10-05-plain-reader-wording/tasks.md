## 1. Reader Copy

- [x] 1.1 Rewrite reader-visible site labels, empty states, hints, and chart descriptions without changing unknown facts into known absences. Verify with a source wording scan and three browser page checks.
- [x] 1.2 Rewrite generated document labels and missing-value reasons in publication producers, updating affected consumer logic. Verify with focused publication tests.

## 2. Contracts And Verification

- [x] 2.1 Update tests that pin old wording and validate the change strictly with `openspec validate plain-reader-wording --strict`.
- [x] 2.2 Stage the required candidate, compare before and after built-HTML terminology counts, build the site, and check three pages in Firefox at desktop and mobile widths.

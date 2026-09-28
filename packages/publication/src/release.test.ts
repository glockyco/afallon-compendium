import { expect, test } from "bun:test";
import { publicationRelease } from "./release";

const content = { sha256: "a".repeat(64), bytes: 1 };
// Steam published this news item at 2026-09-21T23:59:59Z, which is 22 September in time zones east of UTC.
const notes = { gid: "1844115010501029", title: "Afallon 0.16.2.1", appid: 2597810, date: 1790035199, contents: "…" };

test("the release links the store article of its release notes and dates it in UTC", () => {
  expect(publicationRelease({ version: "0.16.2.1", dataDate: "2026-09-28", releaseNotes: content }, notes)).toEqual({
    version: "0.16.2.1", dataDate: "2026-09-28",
    patchNotes: { title: "Afallon 0.16.2.1", url: "https://store.steampowered.com/news/app/2597810/view/1844115010501029", date: "2026-09-21" },
  });
});

test("the release rejects malformed notes, impossible days, and data that predates its release", () => {
  expect(() => publicationRelease({ version: "0.16.2.1", dataDate: "2026-09-28", releaseNotes: content }, { ...notes, gid: undefined })).toThrow();
  expect(() => publicationRelease({ version: "0.16.2.1", dataDate: "2026-02-30", releaseNotes: content }, notes)).toThrow("not a calendar day");
  expect(() => publicationRelease({ version: "0.16.2.1", dataDate: "2026-09-20", releaseNotes: content }, notes)).toThrow("precedes its release notes");
});

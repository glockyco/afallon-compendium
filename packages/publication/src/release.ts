import { Assert } from "typebox/value";
import { PublicReleaseSchema, SteamNewsItemSchema, isCalendarDate, steamPatchNotes, type PublicRelease, type PublicationPlan } from "@afallon/contracts/public";

/**
 * The release that a publication describes: the version and data date of the plan, with the article of its release
 * notes. The release notes are the Steam news item that the update report names, so they identify the release.
 */
export function publicationRelease(input: PublicationPlan["release"], releaseNotes: unknown): PublicRelease {
  Assert(SteamNewsItemSchema, releaseNotes);
  if (!isCalendarDate(input.dataDate)) throw new Error(`Publication data date is not a calendar day: ${input.dataDate}.`);
  const patchNotes = steamPatchNotes(releaseNotes);
  if (input.dataDate < patchNotes.date) throw new Error(`Publication data date ${input.dataDate} precedes its release notes of ${patchNotes.date}.`);
  const release: PublicRelease = { version: input.version, dataDate: input.dataDate, patchNotes };
  Assert(PublicReleaseSchema, release);
  return release;
}

import { ArtifactStore, cleanArtifactStore, type CleanPolicy, type CleanReport } from "@afallon/artifacts";
import { pendingPublicationSelections } from "@afallon/publication";
import { acceptedReleaseRoots } from "./accept-update";

/** Each run of these operations produces one complete result that supersedes the previous one. */
export const PRODUCT_OPERATIONS: ReadonlySet<string> = new Set(["catalog", "publish"]);

/**
 * A build is current when it is the accepted build, has a larger Steam build number, or has a publication selection
 * that awaits recovery. Every build is current while no release is accepted, and so is an identifier that is not a number.
 */
export function currentBuildPredicate(acceptedBuildId: string | null, pendingBuilds: Iterable<string>): (buildId: string) => boolean {
  const pending = new Set(pendingBuilds);
  const numeric = /^\d+$/;
  return (buildId) => acceptedBuildId === null || buildId === acceptedBuildId || pending.has(buildId)
    || !numeric.test(buildId) || !numeric.test(acceptedBuildId) || BigInt(buildId) > BigInt(acceptedBuildId);
}

export async function cleanStore(storeRoot: string, options: { apply: boolean; retainedRunIds: readonly string[] }): Promise<CleanReport> {
  const store = new ArtifactStore(storeRoot);
  const warnings: string[] = [];
  const report = await cleanArtifactStore(store, async (): Promise<CleanPolicy> => {
    const accepted = await acceptedReleaseRoots(store);
    const pending = await pendingPublicationSelections(store);
    warnings.push(...accepted.warnings);
    return {
      roots: [
        ...accepted.roots,
        ...pending.flatMap(selection => selection.previousManifest === null ? [] : [{ label: `pending:${selection.buildId}/publish`, identity: selection.previousManifest, strict: true }]),
      ],
      retainedRunIds: options.retainedRunIds,
      isCurrentBuild: currentBuildPredicate(accepted.buildId, pending.map(selection => selection.buildId)),
      productOperations: PRODUCT_OPERATIONS,
    };
  }, { apply: options.apply });
  return { ...report, warnings: [...warnings, ...report.warnings] };
}

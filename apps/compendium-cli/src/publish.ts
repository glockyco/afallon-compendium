import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Assert } from "typebox/value";
import { ArtifactStore } from "@afallon/artifacts";
import { PublicationPlanSchema } from "@afallon/contracts/public";
import { publishFromPlan } from "@afallon/publication";
import { toolRevision } from "./build";

export async function runPublishCommand(planPath: string, storeRoot: string, publicationRoot: string, select = false) {
  const plan: unknown = JSON.parse(await readFile(resolve(planPath), "utf8"));
  Assert(PublicationPlanSchema, plan);
  const result = await publishFromPlan(new ArtifactStore(resolve(storeRoot)), plan, {
    publicationRoot: resolve(publicationRoot), diagnosticRevision: await toolRevision(), select,
  });
  return {
    buildId: result.buildId, catalogId: result.catalogId, gate: result.gate,
    manifest: result.manifest, root: result.root.reference, candidate: result.candidate,
    selection: result.selection, manifestPath: result.manifestPath, manifestObject: result.manifestObject,
    measurements: result.measurements,
  };
}

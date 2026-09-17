import { readFile } from "node:fs/promises";
import { ArtifactStore } from "@afallon/artifacts";
import { assembleCatalogFromPlan } from "@afallon/catalog";
import { CatalogPlanSchema, decodeContract } from "@afallon/contracts";
import { toolRevision } from "./build";

export async function runCatalogCommand(planPath: string, artifactRoot: string, select = false) {
  const plan = decodeContract(CatalogPlanSchema, JSON.parse(await readFile(planPath, "utf8")), { objectId: planPath, target: "catalog plan" });
  return assembleCatalogFromPlan(new ArtifactStore(artifactRoot), plan, { diagnosticRevision: await toolRevision(), select });
}

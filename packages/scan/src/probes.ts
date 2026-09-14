import { resolve } from "node:path";
import { SceneVisitSchema, StreamVisitSchema } from "@afallon/contracts";
import { createProbeBundle, type ProbeBundle } from "@afallon/runtime";

export interface TraversalProbeBundles {
  readonly sceneVisit: ProbeBundle<typeof SceneVisitSchema>;
  readonly streamVisit: ProbeBundle<typeof StreamVisitSchema>;
}

const RESPONSIBILITIES = ["support", "traversal", "inspection", "cleanup", "serialization"] as const;

export async function createTraversalProbeBundles(): Promise<TraversalProbeBundles> {
  const sceneModules = RESPONSIBILITIES.map(responsibility => ({
    id: `scene-visit/${responsibility}`,
    path: resolve(import.meta.dir, "probes", "scene-visit", `${responsibility}.csx`),
  }));
  const streamModules = RESPONSIBILITIES.map(responsibility => ({
    id: `stream-visit/${responsibility}`,
    path: resolve(import.meta.dir, "probes", "stream-visit", `${responsibility}.csx`),
  }));
  const [sceneVisit, streamVisit] = await Promise.all([
    createProbeBundle({ id: "scene-visit", schema: SceneVisitSchema, modules: sceneModules }),
    createProbeBundle({ id: "stream-visit", schema: StreamVisitSchema, modules: streamModules }),
  ]);
  return { sceneVisit, streamVisit };
}

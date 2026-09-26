import { RuntimeScanStateSchema, SceneVisitSchema, StreamVisitSchema } from "@afallon/contracts";
import { createProbeBundle, type ProbeBundle } from "@afallon/runtime";
import runtimeStateSource from "./probes/state.csx" with { type: "text" };
import { createSceneVisitBundle, createStreamVisitBundle } from "./visit-probes";

export interface TraversalProbeBundles {
  readonly sceneVisit: ProbeBundle<typeof SceneVisitSchema>;
  readonly streamVisit: ProbeBundle<typeof StreamVisitSchema>;
}

export function createRuntimeStateProbeBundle(): Promise<ProbeBundle<typeof RuntimeScanStateSchema>> {
  return createProbeBundle({ id: "runtime-state", schema: RuntimeScanStateSchema, modules: [{ id: "runtime-state/inspection", source: runtimeStateSource }] });
}

export async function createTraversalProbeBundles(): Promise<TraversalProbeBundles> {
  const [sceneVisit, streamVisit] = await Promise.all([createSceneVisitBundle(), createStreamVisitBundle()]);
  return { sceneVisit, streamVisit };
}

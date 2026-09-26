import { RuntimeScanStateSchema, SceneVisitSchema, StreamVisitSchema } from "@afallon/contracts";
import { createProbeBundle, type ProbeBundle } from "@afallon/runtime";
import runtimeStateSource from "./probes/state.csx" with { type: "text" };
import { createSceneVisitBundle } from "./scene-visit-probe";
import stream_support from "./probes/stream-visit/support.csx" with { type: "text" };
import stream_traversal from "./probes/stream-visit/traversal.csx" with { type: "text" };
import stream_inspection from "./probes/stream-visit/inspection.csx" with { type: "text" };
import stream_cleanup from "./probes/stream-visit/cleanup.csx" with { type: "text" };
import stream_serialization from "./probes/stream-visit/serialization.csx" with { type: "text" };

export interface TraversalProbeBundles {
  readonly sceneVisit: ProbeBundle<typeof SceneVisitSchema>;
  readonly streamVisit: ProbeBundle<typeof StreamVisitSchema>;
}

export function createRuntimeStateProbeBundle(): Promise<ProbeBundle<typeof RuntimeScanStateSchema>> {
  return createProbeBundle({ id: "runtime-state", schema: RuntimeScanStateSchema, modules: [{ id: "runtime-state/inspection", source: runtimeStateSource }] });
}

export async function createTraversalProbeBundles(): Promise<TraversalProbeBundles> {
  const [sceneVisit, streamVisit] = await Promise.all([
    createSceneVisitBundle(),
    createProbeBundle({ id: "stream-visit", schema: StreamVisitSchema, modules: [
      { id: "stream-visit/support", source: stream_support },
      { id: "stream-visit/traversal", source: stream_traversal },
      { id: "stream-visit/inspection", source: stream_inspection },
      { id: "stream-visit/cleanup", source: stream_cleanup },
      { id: "stream-visit/serialization", source: stream_serialization },
    ] }),
  ]);
  return { sceneVisit, streamVisit };
}

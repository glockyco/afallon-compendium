import { SceneVisitSchema, StreamVisitSchema } from "@afallon/contracts";
import { createProbeBundle, type ProbeBundle } from "@afallon/runtime";
import sceneSupport from "./probes/scene-visit/support.csx" with { type: "text" };
import sceneTraversal from "./probes/scene-visit/traversal.csx" with { type: "text" };
import sceneInspection from "./probes/scene-visit/inspection.csx" with { type: "text" };
import sceneCleanup from "./probes/scene-visit/cleanup.csx" with { type: "text" };
import sceneSerialization from "./probes/scene-visit/serialization.csx" with { type: "text" };
import streamSupport from "./probes/stream-visit/support.csx" with { type: "text" };
import streamTraversal from "./probes/stream-visit/traversal.csx" with { type: "text" };
import streamInspection from "./probes/stream-visit/inspection.csx" with { type: "text" };
import streamCleanup from "./probes/stream-visit/cleanup.csx" with { type: "text" };
import streamSerialization from "./probes/stream-visit/serialization.csx" with { type: "text" };

// The one scene-visit controller: scans and captures enter, poll, retarget, and restore scenes through it.
export function createSceneVisitBundle(): Promise<ProbeBundle<typeof SceneVisitSchema>> {
  return createProbeBundle({ id: "scene-visit", schema: SceneVisitSchema, modules: [
    { id: "scene-visit/support", source: sceneSupport },
    { id: "scene-visit/traversal", source: sceneTraversal },
    { id: "scene-visit/inspection", source: sceneInspection },
    { id: "scene-visit/cleanup", source: sceneCleanup },
    { id: "scene-visit/serialization", source: sceneSerialization },
  ] });
}

// The one stream-visit controller: scans and captures hold, load, and restore streamed sources through it.
export function createStreamVisitBundle(): Promise<ProbeBundle<typeof StreamVisitSchema>> {
  return createProbeBundle({ id: "stream-visit", schema: StreamVisitSchema, modules: [
    { id: "stream-visit/support", source: streamSupport },
    { id: "stream-visit/traversal", source: streamTraversal },
    { id: "stream-visit/inspection", source: streamInspection },
    { id: "stream-visit/cleanup", source: streamCleanup },
    { id: "stream-visit/serialization", source: streamSerialization },
  ] });
}

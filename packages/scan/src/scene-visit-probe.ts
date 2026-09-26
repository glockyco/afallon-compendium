import { SceneVisitSchema } from "@afallon/contracts";
import { createProbeBundle, type ProbeBundle } from "@afallon/runtime";
import support from "./probes/scene-visit/support.csx" with { type: "text" };
import traversal from "./probes/scene-visit/traversal.csx" with { type: "text" };
import inspection from "./probes/scene-visit/inspection.csx" with { type: "text" };
import cleanup from "./probes/scene-visit/cleanup.csx" with { type: "text" };
import serialization from "./probes/scene-visit/serialization.csx" with { type: "text" };

// The one scene-visit controller: scans and captures enter, poll, retarget, and restore scenes through it.
export function createSceneVisitBundle(): Promise<ProbeBundle<typeof SceneVisitSchema>> {
  return createProbeBundle({ id: "scene-visit", schema: SceneVisitSchema, modules: [
    { id: "scene-visit/support", source: support },
    { id: "scene-visit/traversal", source: traversal },
    { id: "scene-visit/inspection", source: inspection },
    { id: "scene-visit/cleanup", source: cleanup },
    { id: "scene-visit/serialization", source: serialization },
  ] });
}

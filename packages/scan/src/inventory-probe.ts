import { WorldInventorySchema } from "@afallon/contracts";
import { createProbeBundle, type ProbeBundle } from "@afallon/runtime";
import source from "./probes/collectors/world-inventory.csx" with { type: "text" };

export function createWorldInventoryBundle(): Promise<ProbeBundle<typeof WorldInventorySchema>> {
  return createProbeBundle({ id: "scan/world-inventory", schema: WorldInventorySchema, modules: [{ id: "collector/world-inventory", source }] });
}

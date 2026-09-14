import { schemaRegistry } from "../schema-registry";
import {
  CanonicalSchema,
  LocalizationSchema,
  LootRulesSchema,
  ObservationContextSchema,
  RelationshipsSchema,
  SupportSchema,
} from "./database";
import { FactionRolesSchema } from "./faction-roles";
import { NpcProducersSchema, NpcProducersV2Schema } from "./npc-producers";
import { AddressableGraphSchema, PlacementIdentityResultSchema, PlacementSnapshotSchema, SceneSourceIssuesSchema, SerializedAssetIndexSchema } from "./placement";
import { SceneVisitSchema, StreamCleanupSchema, StreamVisitSchema, TraversalPlanSchema } from "./traversal";
import { WorldInventorySchema } from "./world-inventory";
import { WorldSourcesSchema } from "./world-sources";

schemaRegistry.register("compendium.observation-context.v1", ObservationContextSchema);
schemaRegistry.register("compendium.canonical.v4", CanonicalSchema);
schemaRegistry.register("compendium.localization.v1", LocalizationSchema);
schemaRegistry.register("compendium.support.v1", SupportSchema);
schemaRegistry.register("compendium.relationships.v1", RelationshipsSchema);
schemaRegistry.register("compendium.loot-rules.v1", LootRulesSchema);
schemaRegistry.register("compendium.faction-roles.v1", FactionRolesSchema);
schemaRegistry.register("compendium.npc-producers.v2", NpcProducersV2Schema);
schemaRegistry.register("compendium.npc-producers.v3", NpcProducersSchema);
schemaRegistry.register("compendium.addressable-locations.v1", AddressableGraphSchema);
schemaRegistry.register("compendium.scene-source-issues.v2", SceneSourceIssuesSchema);
schemaRegistry.register("compendium.serialized-assets.v1", SerializedAssetIndexSchema);
schemaRegistry.register("compendium.placement-snapshot.v1", PlacementSnapshotSchema);
schemaRegistry.register("compendium.placement-identities.v1", PlacementIdentityResultSchema);
schemaRegistry.register("compendium.traversal-plan.v1", TraversalPlanSchema);
schemaRegistry.register("compendium.scene-visit.v1", SceneVisitSchema);
schemaRegistry.register("compendium.stream-visit.v1", StreamVisitSchema);
schemaRegistry.register("compendium.stream-cleanup.v1", StreamCleanupSchema);
schemaRegistry.register("compendium.world-inventory.v2", WorldInventorySchema);
schemaRegistry.register("compendium.world-sources.v7", WorldSourcesSchema);

export * from "./database";
export * from "./faction-roles";
export * from "./npc-producers";
export * from "./placement";
export * from "./traversal";
export * from "./world-inventory";
export * from "./world-sources";

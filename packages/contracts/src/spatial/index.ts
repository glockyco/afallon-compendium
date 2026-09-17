import { schemaRegistry } from "../schema-registry";
import {
  MapGeometrySchema,
  NativeMapRegistrationSchema,
  NativeMapRegistrationSetSchema,
  NativeMapTransformSchema,
  NavigationGeometrySchema,
  SceneCatalogSchema,
} from "./map";
import { MapSpaceProfileSchema, SpatialSnapshotSchema, WorldOffsetsSchema } from "./reviewed";

schemaRegistry.register("compendium.map-geometry.v3", MapGeometrySchema);
schemaRegistry.register("compendium.navigation-geometry.v2", NavigationGeometrySchema);
schemaRegistry.register("compendium.scene-catalog.v1", SceneCatalogSchema);
schemaRegistry.register("compendium.native-map-transform.v1", NativeMapTransformSchema);
schemaRegistry.register("compendium.native-map-registration.v1", NativeMapRegistrationSchema);
schemaRegistry.register("compendium.native-map-registrations.v1", NativeMapRegistrationSetSchema);
schemaRegistry.register("compendium.map-space-profile.v2", MapSpaceProfileSchema);
schemaRegistry.register("compendium.spatial-snapshot.v2", SpatialSnapshotSchema);
schemaRegistry.register("compendium.world-offsets.v1", WorldOffsetsSchema);

export * from "./map";
export * from "./reviewed";
export * from "./map-spaces";
export * from "./map-regions";
export * from "./map-calibration";

import "./capture";
import captureGeometry from "./probes/capture-geometry.csx";
import captureSession from "./probes/capture-session.csx";
import captureVisuals from "./probes/capture-visuals.csx";
import sceneVisit from "./probes/scene-visit.csx";
import streamVisit from "./probes/stream-visit.csx";

export const captureProbeSources = [captureGeometry, captureSession, captureVisuals, sceneVisit, streamVisit] as const;

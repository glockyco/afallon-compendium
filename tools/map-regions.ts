import type { MapGeometry } from "./map-contracts";
import type { AuthoredRegionResolution, SpatialPosition } from "./spatial-contracts";

type Vector = { x: number; y: number; z: number };
type Collider = MapGeometry["regions"][number]["colliders"][number];

type CompiledCollider =
  | { kind: "sphere"; worldCenter: Vector; worldRadius: number }
  | { kind: "box"; cornerZero: Vector; edgeScale: number; inverseX: Vector; inverseY: Vector; inverseZ: Vector }
  | { kind: "unresolved"; reason: string };

type CompiledRegion = {
  regionIndex: number;
  nativeId: number | null;
  componentInstanceId: number | null;
  colliders: CompiledCollider[];
  noColliders: boolean;
};

const BOX_CONSISTENCY_TOLERANCE = 1e-6;
const BOX_COORDINATE_TOLERANCE = 1e-9;
const SINGULARITY_FACTOR = 64;
const FLOAT32_RELATIVE_UNIT = 2 ** -23;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isFiniteVector(value: unknown): value is Vector {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return isFiniteNumber(candidate.x) && isFiniteNumber(candidate.y) && isFiniteNumber(candidate.z);
}

function vectorDifference(first: Vector, second: Vector): Vector {
  return { x: first.x - second.x, y: first.y - second.y, z: first.z - second.z };
}

function vectorScale(vector: Vector, scalar: number): Vector {
  return { x: vector.x * scalar, y: vector.y * scalar, z: vector.z * scalar };
}

function vectorAdd(first: Vector, second: Vector): Vector {
  return { x: first.x + second.x, y: first.y + second.y, z: first.z + second.z };
}

function vectorCross(first: Vector, second: Vector): Vector {
  return {
    x: first.y * second.z - first.z * second.y,
    y: first.z * second.x - first.x * second.z,
    z: first.x * second.y - first.y * second.x,
  };
}

function vectorDot(first: Vector, second: Vector): number {
  return first.x * second.x + first.y * second.y + first.z * second.z;
}

function validObservationId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function compileSphere(shape: unknown): CompiledCollider {
  if (shape === null || typeof shape !== "object" || Array.isArray(shape)) {
    return { kind: "unresolved", reason: "Sphere collider shape is missing or malformed." };
  }
  const candidate = shape as Record<string, unknown>;
  if (!isFiniteVector(candidate.center)
    || !isFiniteNumber(candidate.radius)
    || !isFiniteVector(candidate.worldCenter)
    || !isFiniteNumber(candidate.worldRadius)) {
    return { kind: "unresolved", reason: "Sphere collider shape contains missing or nonfinite data." };
  }
  if (candidate.radius < 0 || candidate.worldRadius < 0) {
    return { kind: "unresolved", reason: "Sphere collider shape has a negative radius." };
  }
  return { kind: "sphere", worldCenter: candidate.worldCenter, worldRadius: candidate.worldRadius };
}

function compileBox(shape: unknown): CompiledCollider {
  if (shape === null || typeof shape !== "object" || Array.isArray(shape)) {
    return { kind: "unresolved", reason: "Box collider shape is missing or malformed." };
  }
  const candidate = shape as Record<string, unknown>;
  if (!isFiniteVector(candidate.center) || !isFiniteVector(candidate.size)) {
    return { kind: "unresolved", reason: "Box collider shape contains missing or nonfinite local data." };
  }
  if (!Array.isArray(candidate.worldCorners) || candidate.worldCorners.length !== 8) {
    return { kind: "unresolved", reason: "Box collider shape is missing all eight world corners." };
  }
  const corners: Vector[] = [];
  for (const corner of candidate.worldCorners) {
    if (!isFiniteVector(corner)) return { kind: "unresolved", reason: "Box collider corners contain missing or nonfinite data." };
    corners.push(corner);
  }

  const cornerZero = corners[0]!;
  const edgeX = vectorDifference(corners[1]!, cornerZero);
  const edgeY = vectorDifference(corners[2]!, cornerZero);
  const edgeZ = vectorDifference(corners[4]!, cornerZero);
  if (!isFiniteVector(edgeX) || !isFiniteVector(edgeY) || !isFiniteVector(edgeZ)) {
    return { kind: "unresolved", reason: "Box collider edge vectors are nonfinite." };
  }

  // Normalize the basis before taking its determinant. This avoids overflow for
  // large world coordinates and makes the singularity check scale-independent.
  const edgeScale = Math.max(
    Math.abs(edgeX.x), Math.abs(edgeX.y), Math.abs(edgeX.z),
    Math.abs(edgeY.x), Math.abs(edgeY.y), Math.abs(edgeY.z),
    Math.abs(edgeZ.x), Math.abs(edgeZ.y), Math.abs(edgeZ.z),
  );
  if (!Number.isFinite(edgeScale) || edgeScale === 0) {
    return { kind: "unresolved", reason: "Box collider basis is singular." };
  }
  const basisX = vectorScale(edgeX, 1 / edgeScale);
  const basisY = vectorScale(edgeY, 1 / edgeScale);
  const basisZ = vectorScale(edgeZ, 1 / edgeScale);
  if (!isFiniteVector(basisX) || !isFiniteVector(basisY) || !isFiniteVector(basisZ)) {
    return { kind: "unresolved", reason: "Box collider basis is nonfinite." };
  }

  const expectedCorner = (index: number): Vector => {
    let expected = cornerZero;
    if ((index & 1) !== 0) expected = vectorAdd(expected, edgeX);
    if ((index & 2) !== 0) expected = vectorAdd(expected, edgeY);
    if ((index & 4) !== 0) expected = vectorAdd(expected, edgeZ);
    return expected;
  };
  for (let index = 0; index < corners.length; index++) {
    const expected = expectedCorner(index);
    const error = vectorDifference(corners[index]!, expected);
    if (!isFiniteVector(expected) || !isFiniteVector(error)) {
      return { kind: "unresolved", reason: "Box collider corners are nonfinite after reconstruction." };
    }
    const coordinateScale = Math.max(
      1,
      Math.abs(corners[index]!.x), Math.abs(corners[index]!.y), Math.abs(corners[index]!.z),
      Math.abs(expected.x), Math.abs(expected.y), Math.abs(expected.z),
    );
    // Probe coordinates are Unity float values. Allow their rounding at the
    // coordinate magnitude, plus a small tolerance relative to the box edge.
    const tolerance = coordinateScale * FLOAT32_RELATIVE_UNIT * 4 + edgeScale * BOX_CONSISTENCY_TOLERANCE;
    const errorMagnitude = Math.hypot(error.x, error.y, error.z);
    if (!Number.isFinite(errorMagnitude) || errorMagnitude > tolerance) {
      return { kind: "unresolved", reason: "Box collider corners do not form a consistent parallelepiped." };
    }
  }

  const crossYZ = vectorCross(basisY, basisZ);
  const determinant = vectorDot(basisX, crossYZ);
  if (!Number.isFinite(determinant) || Math.abs(determinant) <= Number.EPSILON * SINGULARITY_FACTOR) {
    return { kind: "unresolved", reason: "Box collider basis is singular." };
  }
  const inverseX = vectorScale(crossYZ, 1 / determinant);
  const inverseY = vectorScale(vectorCross(basisZ, basisX), 1 / determinant);
  const inverseZ = vectorScale(vectorCross(basisX, basisY), 1 / determinant);
  if (!isFiniteVector(inverseX) || !isFiniteVector(inverseY) || !isFiniteVector(inverseZ)) {
    return { kind: "unresolved", reason: "Box collider inverse is nonfinite." };
  }
  return { kind: "box", cornerZero, edgeScale, inverseX, inverseY, inverseZ };
}

function compileCollider(collider: Collider): CompiledCollider {
  const shape = collider.shape;
  if (shape === null || shape === undefined) return { kind: "unresolved", reason: "Collider shape is missing." };
  if (typeof shape !== "object" || Array.isArray(shape)) return { kind: "unresolved", reason: "Unsupported collider shape data." };
  const kind = "kind" in shape ? shape.kind : undefined;
  if (kind === "sphere") return compileSphere(shape);
  if (kind === "box") return compileBox(shape);
  return { kind: "unresolved", reason: `Unsupported collider shape kind: ${String(kind)}.` };
}

function classifySphere(collider: Extract<CompiledCollider, { kind: "sphere" }>, position: Vector): boolean | null {
  const distance = Math.hypot(position.x - collider.worldCenter.x, position.y - collider.worldCenter.y, position.z - collider.worldCenter.z);
  if (!Number.isFinite(distance)) return null;
  return distance <= collider.worldRadius;
}

function classifyBox(collider: Extract<CompiledCollider, { kind: "box" }>, position: Vector): boolean | null {
  const x = (position.x - collider.cornerZero.x) / collider.edgeScale;
  const y = (position.y - collider.cornerZero.y) / collider.edgeScale;
  const z = (position.z - collider.cornerZero.z) / collider.edgeScale;
  const coordinateX = x * collider.inverseX.x + y * collider.inverseX.y + z * collider.inverseX.z;
  const coordinateY = x * collider.inverseY.x + y * collider.inverseY.y + z * collider.inverseY.z;
  const coordinateZ = x * collider.inverseZ.x + y * collider.inverseZ.y + z * collider.inverseZ.z;
  if (!isFiniteNumber(coordinateX) || !isFiniteNumber(coordinateY) || !isFiniteNumber(coordinateZ)) return null;
  return coordinateX >= -BOX_COORDINATE_TOLERANCE
    && coordinateX <= 1 + BOX_COORDINATE_TOLERANCE
    && coordinateY >= -BOX_COORDINATE_TOLERANCE
    && coordinateY <= 1 + BOX_COORDINATE_TOLERANCE
    && coordinateZ >= -BOX_COORDINATE_TOLERANCE
    && coordinateZ <= 1 + BOX_COORDINATE_TOLERANCE;
}

function classifyCollider(collider: CompiledCollider, position: Vector): boolean | null {
  if (collider.kind === "sphere") return classifySphere(collider, position);
  if (collider.kind === "box") return classifyBox(collider, position);
  return null;
}

export function compileAuthoredRegions(geometry: MapGeometry): { resolve(position: SpatialPosition): AuthoredRegionResolution } {
  const regions: CompiledRegion[] = geometry.regions.map((region, regionIndex) => {
    const colliders = Array.isArray(region.colliders) ? region.colliders.map(compileCollider) : [];
    return {
      regionIndex,
      nativeId: region.nativeId,
      componentInstanceId: validObservationId(region.source.componentInstanceId) ? region.source.componentInstanceId : null,
      colliders,
      noColliders: colliders.length === 0,
    };
  });

  return {
    resolve(position: SpatialPosition): AuthoredRegionResolution {
      if (!isFiniteVector(position)) throw new Error("Spatial query position must contain finite coordinates.");
      const memberships: AuthoredRegionResolution["memberships"] = [];
      const unresolved: AuthoredRegionResolution["unresolved"] = [];
      for (const region of regions) {
        if (region.noColliders) {
          unresolved.push({ regionIndex: region.regionIndex, reason: "Region has no collider observations." });
          continue;
        }
        let matched = false;
        for (let colliderIndex = 0; colliderIndex < region.colliders.length; colliderIndex++) {
          const collider = region.colliders[colliderIndex]!;
          if (collider.kind === "unresolved") {
            unresolved.push({ regionIndex: region.regionIndex, reason: `Collider ${colliderIndex}: ${collider.reason}` });
            continue;
          }
          const inside = classifyCollider(collider, position);
          if (inside === true) matched = true;
          else if (inside === null) {
            unresolved.push({ regionIndex: region.regionIndex, reason: `Collider ${colliderIndex}: Collider query produced nonfinite data.` });
          }
        }
        if (!matched) continue;
        if (region.componentInstanceId === null) {
          unresolved.push({ regionIndex: region.regionIndex, reason: "Region source component observation identifier is missing or invalid." });
          continue;
        }
        if (region.nativeId !== null && !validObservationId(region.nativeId)) {
          unresolved.push({ regionIndex: region.regionIndex, reason: "Region native observation identifier is missing or invalid." });
          continue;
        }
        memberships.push({
          regionIndex: region.regionIndex,
          nativeId: region.nativeId,
          componentInstanceId: region.componentInstanceId,
        });
      }
      return { memberships, unresolved };
    },
  };
}

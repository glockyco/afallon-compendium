import type { IconNode } from "lucide";
import { MARKER_IDS, markerFor } from "./marker-registry";

const CELL_SIZE = 64;
const CIRCLE_PADDING = 2;

export interface IconAtlasResult {
  atlas: HTMLCanvasElement;
  mapping: Record<string, { x: number; y: number; width: number; height: number; mask: boolean }>;
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function iconNodeToSvg(iconNode: IconNode, color = "#ffffff"): string {
  const elements = iconNode.map(([tag, attributes]) => {
    const serialized = Object.entries(attributes).map(([key, value]) => `${key}="${escapeXml(String(value))}"`).join(" ");
    return `<${tag}${serialized ? ` ${serialized}` : ""} />`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${escapeXml(color)}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${elements}</svg>`;
}

function loadSvg(svg: string): Promise<HTMLImageElement> {
  const { promise, resolve, reject } = Promise.withResolvers<HTMLImageElement>();
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("Unable to rasterize a marker icon."));
  image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  return promise;
}

export function iconAtlasMapping(): IconAtlasResult["mapping"] {
  return Object.fromEntries(MARKER_IDS.map((id, index) => [id, {
    x: index * CELL_SIZE,
    y: 0,
    width: CELL_SIZE,
    height: CELL_SIZE,
    mask: false,
  }])) as IconAtlasResult["mapping"];
}

async function buildIconAtlas(): Promise<IconAtlasResult> {
  const canvas = document.createElement("canvas");
  canvas.width = CELL_SIZE * MARKER_IDS.length;
  canvas.height = CELL_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create the marker icon atlas canvas.");
  const images = await Promise.all(MARKER_IDS.map((id) => loadSvg(iconNodeToSvg(markerFor(id).icon))));
  const mapping = iconAtlasMapping();
  MARKER_IDS.forEach((id, index) => {
    const marker = markerFor(id);
    const x = index * CELL_SIZE;
    const center = CELL_SIZE / 2;
    const radius = center - CIRCLE_PADDING;
    context.beginPath();
    context.arc(x + center, center, radius, 0, Math.PI * 2);
    context.fillStyle = `rgb(${marker.color.join(",")})`;
    context.fill();
    context.strokeStyle = "rgba(0, 0, 0, 0.45)";
    context.lineWidth = 2;
    context.stroke();
    const glyphSize = CELL_SIZE * 0.55;
    const offset = (CELL_SIZE - glyphSize) / 2;
    context.save();
    context.filter = "drop-shadow(0 0 1px black) drop-shadow(0 0 1px black)";
    context.drawImage(images[index]!, x + offset, offset, glyphSize, glyphSize);
    context.restore();
  });
  return { atlas: canvas, mapping };
}

let atlasPromise: Promise<IconAtlasResult> | null = null;

export function createIconAtlas(): Promise<IconAtlasResult> {
  atlasPromise ??= buildIconAtlas();
  return atlasPromise;
}

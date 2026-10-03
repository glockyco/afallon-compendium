import type { IconNode } from 'lucide';
import { iconNodeToSvg } from '../icon-svg';
import mapping from './icon-sheet-mapping.json';

export interface IconSheetResult {
  canvas: HTMLCanvasElement;
  mapping: Record<string, { x: number; y: number; width: number; height: number; mask: boolean }>;
}

/** The same glyph the map draws, for legends, filters and result rows. */
export function markerGlyphSvg(marker: { icon: IconNode }): string {
  return iconNodeToSvg(marker.icon);
}

export function iconSheetMapping(): IconSheetResult['mapping'] { return mapping; }

async function loadIconSheet(): Promise<IconSheetResult> {
  const image = new Image();
  image.src = `${import.meta.env.BASE_URL}map-marker-icons.png`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create the marker icon sheet canvas.');
  context.drawImage(image, 0, 0);
  return { canvas, mapping };
}

let sheetPromise: Promise<IconSheetResult> | null = null;

export function createIconSheet(): Promise<IconSheetResult> {
  sheetPromise ??= loadIconSheet();
  return sheetPromise;
}

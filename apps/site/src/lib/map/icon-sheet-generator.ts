import { iconNodeToSvg } from '../icon-svg';
import { MARKER_IDS, markerFor } from './marker-registry';

const CELL_SIZE = 64;

function loadSvg(svg: string): Promise<HTMLImageElement> {
  const { promise, resolve, reject } = Promise.withResolvers<HTMLImageElement>();
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Unable to rasterize a marker icon.'));
  image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  return promise;
}

/** Browser canvas is the source of the checked-in sprite pixels. Run scripts/generate-map-icons.ts after changing the registry. */
export async function generateIconSheet(): Promise<{ canvas: HTMLCanvasElement; mapping: Record<string, { x: number; y: number; width: number; height: number; mask: boolean }> }> {
  const canvas = document.createElement('canvas');
  canvas.width = CELL_SIZE * MARKER_IDS.length;
  canvas.height = CELL_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create the marker icon sheet canvas.');
  const images = await Promise.all(MARKER_IDS.map((id) => loadSvg(iconNodeToSvg(markerFor(id).icon))));
  const mapping = Object.fromEntries(MARKER_IDS.map((id, index) => [id, { x: index * CELL_SIZE, y: 0, width: CELL_SIZE, height: CELL_SIZE, mask: false }]));
  MARKER_IDS.forEach((id, index) => {
    const marker = markerFor(id);
    const x = index * CELL_SIZE;
    const center = CELL_SIZE / 2;
    const radius = center - 2;
    context.beginPath();
    context.arc(x + center, center, radius, 0, Math.PI * 2);
    context.fillStyle = `rgb(${marker.color.join(',')})`;
    context.fill();
    context.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    context.lineWidth = 2;
    context.stroke();
    const glyphSize = CELL_SIZE * 0.55;
    const offset = (CELL_SIZE - glyphSize) / 2;
    context.save();
    context.filter = 'drop-shadow(0 0 1px black) drop-shadow(0 0 1px black)';
    context.drawImage(images[index]!, x + offset, offset, glyphSize, glyphSize);
    context.restore();
  });
  return { canvas, mapping };
}

import type { IconNode } from 'lucide';

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** A lucide glyph as SVG markup, for the map's marker sheet and for the glyphs of pages and links. */
export function iconNodeToSvg(iconNode: IconNode, color = '#ffffff'): string {
  const elements = iconNode.map(([tag, attributes]) => {
    const serialized = Object.entries(attributes).map(([key, value]) => `${key}="${escapeXml(String(value))}"`).join(' ');
    return `<${tag}${serialized ? ` ${serialized}` : ''} />`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${escapeXml(color)}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${elements}</svg>`;
}

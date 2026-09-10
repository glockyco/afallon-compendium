import type { PublicDetailSection } from '../../../pipeline/public-contracts';

export interface DetailLink {
  label: string;
  placementId: string;
}

export function filteredSections(sections: PublicDetailSection[], query: string): PublicDetailSection[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return sections;
  return sections
    .map((section) => section.title.toLocaleLowerCase().includes(needle) ? section : ({
      ...section,
      rows: section.rows.filter((row) => `${row.label} ${row.value}`.toLocaleLowerCase().includes(needle))
    }))
    .filter((section) => section.rows.length > 0);
}

export function linksFromSections(sections: PublicDetailSection[]): DetailLink[] {
  const links: DetailLink[] = [];
  for (const section of sections) {
    for (const row of section.rows) {
      for (const placementId of row.placementIds ?? []) {
        links.push({ label: `${row.label}: ${row.value}`, placementId });
      }
    }
  }
  return links;
}

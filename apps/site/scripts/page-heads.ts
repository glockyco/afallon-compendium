import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ATTRIBUTE = {
  name: /\bname="([^"]*)"/i,
  content: /\bcontent="([^"]*)"/i,
  rel: /\brel="([^"]*)"/i,
  href: /\bhref="([^"]*)"/i,
} as const;

const EMPTY_NOINDEX = new Set<string>();

/** Check the HTML that search clients receive, not route source or hydration state. */
export function pageHeadIssues(pages: Iterable<{ path: string; html: string }>, expectedNoindex: ReadonlySet<string> = EMPTY_NOINDEX): string[] {
  const titles = new Map<string, string[]>();
  const descriptions = new Map<string, string[]>();
  const issues: string[] = [];
  for (const { path, html } of pages) {
    const end = html.indexOf('</head>');
    if (end < 0) { issues.push(`${path}: missing closing head`); continue; }
    const head = html.slice(0, end);
    const meta = [...head.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => tag);
    const attribute = (tag: string, key: keyof typeof ATTRIBUTE): string | undefined => tag.match(ATTRIBUTE[key])?.[1];
    const named = (name: string) => {
      const tag = meta.find((candidate) => attribute(candidate, 'name')?.toLowerCase() === name);
      return tag ? attribute(tag, 'content') : undefined;
    };
    const noindex = named('robots')?.toLowerCase().split(',').some((rule) => rule.trim() === 'noindex') ?? false;
    if (expectedNoindex.has(path) && !noindex) issues.push(`${path}: missing noindex`);
    if (!expectedNoindex.has(path) && noindex && path !== '404.html') issues.push(`${path}: unexpected noindex`);
    if (path === '404.html' && noindex) continue;
    const title = head.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
    const description = named('description')?.trim();
    const canonical = [...head.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => tag)
      .find((tag) => attribute(tag, 'rel')?.toLowerCase() === 'canonical');
    if (!title) issues.push(`${path}: missing title`);
    else if (!noindex) {
      if (!titles.has(title)) titles.set(title, []);
      titles.get(title)!.push(path);
    }
    if (!description) issues.push(`${path}: missing description`);
    else if (!noindex) {
      if (!descriptions.has(description)) descriptions.set(description, []);
      descriptions.get(description)!.push(path);
    }
    if (!canonical || !attribute(canonical, 'href')) issues.push(`${path}: missing canonical`);
  }
  for (const [label, groups] of [['title', titles], ['description', descriptions]] as const) {
    for (const [value, paths] of groups) {
      if (paths.length > 1) issues.push(`Duplicate ${label} ${JSON.stringify(value)}: ${paths.join(', ')}`);
    }
  }
  return issues;
}

/** Noindex pages remain reachable through links but must not be submitted for indexing. */
export function sitemapIssues(sitemap: string, htmlPaths: Iterable<string>, expectedNoindex: ReadonlySet<string>): string[] {
  const listed = new Set([...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => new URL(match[1]!).pathname));
  const issues: string[] = [];
  for (const path of htmlPaths) {
    if (path === '404.html') continue;
    const url = path === 'index.html' ? '/' : `/${path.replace(/index\.html$/, '')}`;
    if (expectedNoindex.has(path) && listed.has(url)) issues.push(`${path}: noindex page appears in sitemap`);
    if (!expectedNoindex.has(path) && !listed.has(url)) issues.push(`${path}: indexable page missing from sitemap`);
  }
  return issues;
}

export function assertPageHeads(outputDir: string, files: readonly string[], expectedNoindex: ReadonlySet<string> = EMPTY_NOINDEX): void {
  const html = files.filter((path) => path.endsWith('.html'));
  function* builtPages() {
    for (const path of html) yield { path, html: readFileSync(join(outputDir, path), 'utf8') };
  }
  const issues = pageHeadIssues(builtPages(), expectedNoindex);
  issues.push(...sitemapIssues(readFileSync(join(outputDir, 'sitemap.xml'), 'utf8'), html, expectedNoindex));
  if (issues.length) throw new Error(`Page head audit found ${issues.length} issue(s):\n${issues.slice(0, 20).join('\n')}${issues.length > 20 ? `\n… and ${issues.length - 20} more` : ''}`);
}

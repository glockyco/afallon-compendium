import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ATTRIBUTE = {
  name: /\bname="([^"]*)"/i,
  content: /\bcontent="([^"]*)"/i,
  rel: /\brel="([^"]*)"/i,
  href: /\bhref="([^"]*)"/i,
} as const;

/** Check the HTML that search clients receive, not route source or hydration state. */
export function pageHeadIssues(pages: Iterable<{ path: string; html: string }>): string[] {
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
    if (named('robots')?.toLowerCase().split(',').some((rule) => rule.trim() === 'noindex')) continue;
    const title = head.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
    const description = named('description')?.trim();
    const canonical = [...head.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => tag)
      .find((tag) => attribute(tag, 'rel')?.toLowerCase() === 'canonical');
    if (!title) issues.push(`${path}: missing title`);
    else {
      if (!titles.has(title)) titles.set(title, []);
      titles.get(title)!.push(path);
    }
    if (!description) issues.push(`${path}: missing description`);
    else {
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

export function assertPageHeads(outputDir: string, files: readonly string[]): void {
  function* builtPages() {
    for (const path of files) if (path.endsWith('.html')) {
      yield { path, html: readFileSync(join(outputDir, path), 'utf8') };
    }
  }
  const issues = pageHeadIssues(builtPages());
  if (issues.length) throw new Error(`Page head audit found ${issues.length} issue(s):\n${issues.slice(0, 20).join('\n')}${issues.length > 20 ? `\n… and ${issues.length - 20} more` : ''}`);
}

import { expect, test } from 'bun:test';
import { pageHeadIssues, sitemapIssues } from './page-heads';

const page = (title: string, description: string, canonical = 'https://afallon.compendiums.org/items/') =>
  `<html><head><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${canonical}"></head><body></body></html>`;

test('published pages cannot share search titles or descriptions', () => {
  const issues = pageHeadIssues([
    { path: 'items/a/index.html', html: page('Fireball | Afallon Wiki', 'An item sold in Oakwood.') },
    { path: 'abilities/fireball/index.html', html: page('Fireball | Afallon Wiki', 'An ability learned by Wizards.') },
    { path: 'effects/fireball/index.html', html: page('Fireball (Effect) | Afallon Wiki', 'An item sold in Oakwood.') },
  ]);
  expect(issues).toEqual(expect.arrayContaining([
    expect.stringContaining('Duplicate title "Fireball | Afallon Wiki"'),
    expect.stringContaining('Duplicate description "An item sold in Oakwood."'),
  ]));
});

test('indexable pages need their own canonical and description but noindex 404 is exempt', () => {
  const issues = pageHeadIssues([
    { path: 'items/index.html', html: page('Items | Afallon Wiki', 'Browse Afallon items.', '') },
    { path: 'places/index.html', html: '<html><head><title>Places | Afallon Wiki</title></head></html>' },
    { path: '404.html', html: '<html><head><title>Not Found</title><meta name="robots" content="noindex"></head></html>' },
  ]);
  expect(issues).toEqual([
    'items/index.html: missing canonical',
    'places/index.html: missing description',
    'places/index.html: missing canonical',
  ]);
});

test('teleport effects keep complete heads but require noindex and stay out of the sitemap', () => {
  const effectPaths = new Set(['effects/teleport-a/index.html', 'effects/teleport-b/index.html']);
  const ordinary = 'items/index.html';
  const teleport = page('Teleport | Afallon Wiki', 'A teleport effect in Afallon.');
  const noindex = teleport.replace('</head>', '<meta name="robots" content="noindex"></head>');
  expect(pageHeadIssues([
    { path: ordinary, html: page('Items | Afallon Wiki', 'Browse items.') },
    { path: 'effects/teleport-a/index.html', html: noindex },
    { path: 'effects/teleport-b/index.html', html: noindex },
  ], effectPaths)).toEqual([]);
  expect(pageHeadIssues([{ path: 'effects/teleport-a/index.html', html: teleport }], effectPaths))
    .toContain('effects/teleport-a/index.html: missing noindex');
  expect(pageHeadIssues([{ path: 'effects/teleport-a/index.html', html: noindex.replace('<meta name="description" content="A teleport effect in Afallon.">', '') }], effectPaths))
    .toContain('effects/teleport-a/index.html: missing description');
  const sitemap = '<urlset><loc>https://afallon.compendiums.org/items/</loc></urlset>';
  expect(sitemapIssues(sitemap, [ordinary, ...effectPaths], effectPaths)).toEqual([]);
  expect(sitemapIssues(`${sitemap}<loc>https://afallon.compendiums.org/effects/teleport-a/</loc>`, [ordinary, ...effectPaths], effectPaths))
    .toContain('effects/teleport-a/index.html: noindex page appears in sitemap');
});

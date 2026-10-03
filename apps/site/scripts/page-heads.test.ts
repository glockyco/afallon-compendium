import { expect, test } from 'bun:test';
import { pageHeadIssues } from './page-heads';

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

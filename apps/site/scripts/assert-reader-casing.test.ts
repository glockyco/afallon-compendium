import { expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const script = join(import.meta.dirname, 'assert-reader-casing.ts');

test('the built-page audit rejects the Classes table casing regression while preserving the reveal exception', () => {
  const output = mkdtempSync(join(tmpdir(), 'afallon-casing-'));
  try {
    mkdirSync(join(output, 'classes'));
    writeFileSync(join(output, 'index.html'), '<title>Afallon Compendium</title>');
    writeFileSync(join(output, '404.html'), '<h1>Page Not Found</h1>');
    writeFileSync(join(output, 'classes', 'index.html'), '<h1>Classes</h1><input placeholder="Filter Classes by Name"><p class="count">6 Classes</p><button>Show 91 items without a known source</button>');
    const failed = Bun.spawnSync(['bun', script, `--output=${output}`, '--strict']);
    expect(failed.exitCode).toBe(1);
    const findings = JSON.parse(failed.stdout.toString()).violations;
    expect(findings.map((entry: { class: string; text: string }) => [entry.class, entry.text])).toEqual([
      ['placeholder', 'Filter Classes by Name'], ['count', '6 Classes'],
    ]);

    writeFileSync(join(output, 'classes', 'index.html'), '<h1>Classes</h1><input placeholder="Filter classes by name"><p class="count">6 classes</p><button>Show 91 items without a known source</button>');
    const passing = Bun.spawnSync(['bun', script, `--output=${output}`, '--strict']);
    expect(passing.exitCode).toBe(0);
    expect(JSON.parse(passing.stdout.toString()).allowlisted).toEqual(['Show # items without a known source']);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});

test('phrase links and section pills follow sentence-like headings without changing short map commands', () => {
  const output = mkdtempSync(join(tmpdir(), 'afallon-casing-'));
  try {
    mkdirSync(join(output, 'mechanics', 'heroic-tier'), { recursive: true });
    writeFileSync(join(output, 'index.html'), '<h1>Afallon Compendium</h1>');
    writeFileSync(join(output, '404.html'), '<h1>Page Not Found</h1>');
    const page = join(output, 'mechanics', 'heroic-tier', 'index.html');
    writeFileSync(page, '<h1>Heroic Tier</h1><h2>Turning It On and Off</h2><a class="how-it-works">How Creature Drops Work</a><button class="pill"><span class="visually-hidden">On this page:</span><span>Turning It On and Off</span></button>');
    const failed = Bun.spawnSync(['bun', script, `--output=${output}`, '--strict']);
    expect(failed.exitCode).toBe(1);
    expect(JSON.parse(failed.stdout.toString()).violations.map((entry: { class: string; text: string }) => [entry.class, entry.text])).toEqual([
      ['heading', 'Turning It On and Off'], ['action', 'How Creature Drops Work'], ['summary', 'Turning It On and Off'],
    ]);

    writeFileSync(page, '<h1>Heroic Tier</h1><h2>Turning it on and off</h2><a class="how-it-works">How creature drops work</a><button class="pill"><span class="visually-hidden">On this page:</span><span>Turning it on and off</span></button><a class="c-action">Show on Map</a>');
    expect(Bun.spawnSync(['bun', script, `--output=${output}`, '--strict']).exitCode).toBe(0);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});

test('title-block kind lines and identity fact labels are titles, not field labels', () => {
  const output = mkdtempSync(join(tmpdir(), 'afallon-casing-'));
  try {
    mkdirSync(join(output, 'stats', 'stamina'), { recursive: true });
    writeFileSync(join(output, 'index.html'), '<h1>Afallon Compendium</h1>');
    writeFileSync(join(output, '404.html'), '<h1>Page Not Found</h1>');
    const page = join(output, 'stats', 'stamina', 'index.html');
    writeFileSync(page, '<header class="title-block"><h1>Stamina</h1><ul class="facts"><li class="type">Defense stat</li><li><span class="label">Boss Of</span><span class="refs"><a>The Witch of Oakenvale</a></span></li></ul></header>');
    const failed = Bun.spawnSync(['bun', script, `--output=${output}`, '--strict']);
    expect(failed.exitCode).toBe(1);
    expect(JSON.parse(failed.stdout.toString()).violations.map((entry: { class: string; text: string }) => [entry.class, entry.text])).toEqual([
      ['kind', 'Defense stat'], ['kind', 'Boss Of'],
    ]);

    writeFileSync(page, '<header class="title-block"><h1>Stamina</h1><ul class="facts"><li class="type">Defense Stat</li><li><span class="label">Boss of</span><span class="refs"><a>The Witch of Oakenvale</a></span></li></ul></header>');
    expect(Bun.spawnSync(['bun', script, `--output=${output}`, '--strict']).exitCode).toBe(0);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});

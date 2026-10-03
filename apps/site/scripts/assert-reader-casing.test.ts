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

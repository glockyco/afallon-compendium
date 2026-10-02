// Svelte drops whitespace at the start and end of a block, so `{#if rank} · Rank 1{/if}` renders "Ability· Rank 1" and
// `{#if index}, {/if}` renders "Rowan,Varric". This check fails on text that depends on such a space; write the space
// as `{' '}` or move the separator into an expression instead.
import { Glob } from 'bun';

const leading = /\{(?:#if|:else if|:else|#each)[^}]*\} (?=[^\s<{])/g;
const trailing = /[^\s>}] (?=\{(?:\/if|\/each|:else)\b)/g;
const problems: string[] = [];
for await (const path of new Glob('src/**/*.svelte').scan({ cwd: new URL('..', import.meta.url).pathname })) {
  const lines = (await Bun.file(new URL(`../${path}`, import.meta.url)).text()).split('\n');
  lines.forEach((line, index) => {
    if (line.trimStart().startsWith('//') || line.includes('<!--')) return;
    if (leading.test(line) || trailing.test(line)) problems.push(`${path}:${index + 1}: ${line.trim().slice(0, 120)}`);
    leading.lastIndex = 0;
    trailing.lastIndex = 0;
  });
}
if (problems.length) {
  console.error(`Text relies on a space at the edge of a Svelte block, which Svelte drops:\n${problems.join('\n')}`);
  process.exit(1);
}

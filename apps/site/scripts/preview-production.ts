import { readFileSync, statSync, realpathSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { deploymentPaths } from '../deployment-paths.mjs';

interface HeaderRule { pattern: RegExp; headers: Record<string, string> }

export function startProductionPreview(directory: string, port = 4173) {
  const root = realpathSync(resolve(directory));
  const rules: HeaderRule[] = [];
  for (const line of readFileSync(join(root, '_headers'), 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const pattern = line.trim().split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
      rules.push({ pattern: new RegExp(`^${pattern}$`), headers: {} });
    } else {
      const separator = line.indexOf(':');
      if (!rules.length || separator < 0) throw new Error(`Invalid static header rule: ${line}.`);
      rules.at(-1)!.headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
  }
  const types: Record<string, string> = {
    '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.webp': 'image/webp', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  };
  const representations = new Map<string, { bytes: Uint8Array; etag: string }>();
  return Bun.serve({
    hostname: '127.0.0.1', port,
    fetch(request) {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
      let path: string;
      try { path = decodeURIComponent(new URL(request.url).pathname); } catch { return new Response('Invalid path', { status: 400 }); }
      if (path.includes('\0') || path.includes('\\') || path.split('/').includes('..') || path === '/_headers') return new Response('Not found', { status: 404 });
      let file = join(root, path);
      let status = 200;
      try {
        if (statSync(file).isDirectory()) file = join(file, 'index.html');
        if (!statSync(file).isFile() || relative(root, realpathSync(file)).startsWith('..')) throw new Error('Not a contained file');
      } catch {
        file = join(root, '404.html');
        status = 404;
      }
      const type = types[extname(file)] ?? 'application/octet-stream';
      const accepted = request.headers.get('accept-encoding') ?? '';
      const encoding = /^(?:text\/|application\/json)/.test(type) ? accepted.split(',').map((value) => value.trim()).find((value) => value === 'br') ? 'br' : accepted.split(',').map((value) => value.trim()).includes('gzip') ? 'gzip' : null : null;
      const key = `${file}:${encoding ?? 'identity'}`;
      let representation = representations.get(key);
      if (!representation) {
        const raw = readFileSync(file);
        const bytes = encoding === 'br' ? brotliCompressSync(raw) : encoding === 'gzip' ? gzipSync(raw) : raw;
        representation = { bytes, etag: `"${new Bun.CryptoHasher('sha256').update(bytes).digest('hex')}"` };
        representations.set(key, representation);
      }
      const headers = new Headers({ 'Content-Type': type, 'Cache-Control': 'public, max-age=0, must-revalidate', Vary: 'Accept-Encoding', ETag: representation.etag });
      for (const rule of rules) if (rule.pattern.test(path)) for (const [name, value] of Object.entries(rule.headers)) headers.set(name, value);
      if (encoding) headers.set('Content-Encoding', encoding);
      if (status === 200 && request.headers.get('if-none-match') === representation.etag) return new Response(null, { status: 304, headers });
      headers.set('Content-Length', String(representation.bytes.length));
      return new Response(request.method === 'HEAD' ? null : representation.bytes, { status, headers });
    },
  });
}

if (import.meta.main) {
  const directory = Bun.argv[2] ?? deploymentPaths(resolve(import.meta.dirname, '..')).outputDir;
  const server = startProductionPreview(directory, Number(Bun.argv[3] ?? 4173));
  process.stdout.write(`Production preview: ${server.url}\n`);
}

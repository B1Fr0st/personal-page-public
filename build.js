import { rm, writeFile } from 'node:fs/promises';

await rm('./dist', { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ['./index.html'],
  outdir: './dist',
  minify: true,
  sourcemap: 'linked',
  target: 'browser',
  publicPath: '/'
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

await writeFile('./dist/_redirects', '/*    /index.html   200\n');

console.log(`Built ${result.outputs.length} files to ./dist`);

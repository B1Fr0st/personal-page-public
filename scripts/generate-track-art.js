// Reads Apple Music `href`s from the `playlist` sections in src/data/site.js,
// fetches track metadata + album artwork from the iTunes Search API, caches
// artwork to src/assets/track-art/<id>.jpg and metadata to
// src/data/track-meta.json, and regenerates src/data/track-art.js with a
// static import map. Idempotent — cached entries are reused.
//
// Wired to `predev` and `prebuild`. To refresh a track, delete its entry from
// track-meta.json (and optionally its image) and rerun `bun run generate`.

import { readdir, writeFile, mkdir, access, readFile, unlink } from 'node:fs/promises';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { constants as fsConstants } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const artDir = join(here, '..', 'src', 'assets', 'track-art');
const artMapFile = join(here, '..', 'src', 'data', 'track-art.js');
const metaFile = join(here, '..', 'src', 'data', 'track-meta.json');
const siteFile = join(here, '..', 'src', 'data', 'site.js');

const ART_SIZE = '600x600bb.jpg';

/** Parse an Apple Music href → the iTunes ID we should look up. */
function parseAppleMusicHref(href) {
  try {
    const u = new URL(href);
    if (!u.hostname.endsWith('music.apple.com')) return null;
    const trackId = u.searchParams.get('i');
    if (trackId && /^\d+$/.test(trackId)) return trackId;
    const parts = u.pathname.split('/').filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(parts[i])) return parts[i];
    }
    return null;
  } catch {
    return null;
  }
}

async function exists(p) {
  try {
    await access(p, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function loadMeta() {
  try {
    return JSON.parse(await readFile(metaFile, 'utf8'));
  } catch {
    return {};
  }
}

async function fetchLookup(id) {
  const res = await fetch(`https://itunes.apple.com/lookup?id=${id}`);
  if (!res.ok) throw new Error(`iTunes lookup failed for ${id}: ${res.status}`);
  const json = await res.json();
  return json.results?.[0] ?? null;
}

async function downloadTo(url, path) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path, buf);
}

function toIdent(filename) {
  const base = basename(filename, extname(filename));
  return (
    'art_' +
    base
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((part, i) =>
        i === 0
          ? part[0].toLowerCase() + part.slice(1)
          : part[0].toUpperCase() + part.slice(1)
      )
      .join('')
  );
}

await mkdir(artDir, { recursive: true });

const { about } = await import(pathToFileURL(siteFile).href);
const tracks = (about?.sections ?? [])
  .filter((s) => s.type === 'playlist')
  .flatMap((s) => s.tracks ?? [])
  .map((t) => (typeof t === 'string' ? { href: t } : t));

const meta = await loadMeta();
const liveIds = new Set();
let fetched = 0;
let cached = 0;
let skipped = 0;

for (const track of tracks) {
  if (!track.href) {
    skipped++;
    continue;
  }
  const id = parseAppleMusicHref(track.href);
  if (!id) {
    console.warn(`  ↳ could not parse id from ${track.href}`);
    skipped++;
    continue;
  }
  liveIds.add(id);

  const imagePath = join(artDir, `${id}.jpg`);
  const haveImage = await exists(imagePath);
  const haveMeta = Boolean(
    meta[id] && 'explicit' in meta[id] && 'preview' in meta[id]
  );

  if (haveImage && haveMeta) {
    cached++;
    continue;
  }

  try {
    const hit = await fetchLookup(id);
    if (!hit) {
      console.warn(`  ↳ no iTunes result for ${track.href}`);
      skipped++;
      continue;
    }
    if (!haveMeta) {
      meta[id] = {
        title: hit.trackName || hit.collectionName || null,
        artist: hit.artistName || null,
        album: hit.collectionName || null,
        explicit: hit.trackExplicitness === 'explicit',
        preview: hit.previewUrl || null
      };
    }
    if (!haveImage && hit.artworkUrl100) {
      const artUrl = hit.artworkUrl100.replace('100x100bb.jpg', ART_SIZE);
      await downloadTo(artUrl, imagePath);
    }
    fetched++;
    console.log(`  ↳ fetched ${meta[id]?.title || id}`);
  } catch (err) {
    console.warn(`  ↳ failed ${track.href}: ${err.message}`);
    skipped++;
  }
}

let removed = 0;
for (const id of Object.keys(meta)) {
  if (!liveIds.has(id)) {
    delete meta[id];
    removed++;
  }
}

await writeFile(metaFile, JSON.stringify(meta, null, 2) + '\n');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const existing = (await readdir(artDir).catch(() => []))
  .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()));

for (const f of existing) {
  const id = basename(f, extname(f));
  if (!liveIds.has(id)) {
    await unlink(join(artDir, f));
    removed++;
  }
}

const files = existing
  .filter((f) => liveIds.has(basename(f, extname(f))))
  .sort();

const imports = files
  .map((f) => `import ${toIdent(f)} from '../assets/track-art/${f}';`)
  .join('\n');

const mapEntries = files
  .map((f) => `  '${basename(f, extname(f))}': ${toIdent(f)}`)
  .join(',\n');

const contents = `// AUTO-GENERATED by scripts/generate-track-art.js. Do not edit by hand.
// Keyed by Apple Music track or album id (parsed from \`href\`).
${imports}

export const trackArt = {
${mapEntries}
};
`;

await writeFile(artMapFile, contents);
console.log(
  `Generated ${artMapFile} with ${files.length} track(s) — ${fetched} fetched, ${cached} cached, ${skipped} skipped, ${removed} removed`
);

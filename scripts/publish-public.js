#!/usr/bin/env bun
// Publish a sanitized snapshot of this repo to the public mirror.
//
// What it does:
//   1. Copies the working tree into a temp dir (excluding .git, node_modules,
//      dist, and a few personal data files).
//   2. Replaces personal data files (site.js, posts/, track-meta.json,
//      track-art/, covers/, index.html metadata) with placeholder versions.
//   3. Regenerates posts.js so the empty posts/ directory builds cleanly.
//   4. Initializes a fresh git repo in the temp dir, makes one commit, and
//      force-pushes it to the public mirror's main branch as an orphan.
//
// The public repo's history is intentionally not preserved — each run
// publishes a single-commit snapshot. The private repo's history never
// touches the public remote.
//
// Usage: bun run scripts/publish-public.js [--dry-run]

import { mkdtemp, cp, rm, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const PUBLIC_REMOTE = 'https://github.com/B1Fr0st/personal-page-public.git';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const dryRun = process.argv.includes('--dry-run');

// Paths excluded from the initial copy. README.md is intentionally NOT here —
// the user wants the existing README preserved on the public mirror, so we
// just copy whatever the public repo currently has on top after staging.
const COPY_EXCLUDE = new Set([
  '.git',
  'node_modules',
  'dist',
  '.DS_Store',
  // The publish script itself doesn't belong in the public mirror.
  'scripts/publish-public.js'
]);

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited with ${res.status}`);
  }
}

async function copyTree(src, dest) {
  const entries = await readdir(src, { withFileTypes: true });
  await mkdir(dest, { recursive: true });
  for (const entry of entries) {
    if (COPY_EXCLUDE.has(entry.name)) continue;
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    // cp with recursive handles directories and files; we already filtered
    // top-level excludes, and nested .git / node_modules don't exist.
    await cp(from, to, { recursive: true, force: true });
  }
}

const PLACEHOLDER_SITE_JS = `export const site = {
  name: 'Your Name',
  title: 'Software Engineer',
  headline: 'Hi, I\\'m You.',
  tagline:
    'Short tagline describing what you do and what you\\'re looking for.',
  featuredProjects: [],
  postsTagline: 'A short line introducing your writing.',
  projectsTagline: 'A few of my favorite projects.',
  email: 'you@example.com',
  resumeHref: '#',
  location: {
    label: 'Your City, ST',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC'
  },
  socials: [
    { label: 'GitHub', href: 'https://github.com/your-handle' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/your-handle' },
  ]
};

export const competencies = [
  {
    id: 'languages',
    icon: 'code',
    title: 'Languages',
    items: ['Language A', 'Language B']
  }
];

export const projects = [];

export const experience = [];

export const skills = competencies.flatMap((c) => c.items);

/**
 * About page content. See the original repo's site.js for the full schema —
 * supported section types: 'prose' | 'list' | 'stack' | 'nowlist' | 'quote'
 * | 'bookshelf' | 'playlist'.
 */
export const about = {
  intro: ['A short bio paragraph about yourself.'],
  sections: [
    {
      id: 'now',
      type: 'nowlist',
      label: 'Currently',
      title: 'What I\\'m up to',
      items: [
        { label: 'Studying', value: 'Replace with what you\\'re studying' },
        { label: 'Building', value: 'Replace with what you\\'re building' }
      ]
    }
  ]
};
`;

const PLACEHOLDER_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Personal Site</title>
    <meta name="description" content="A personal site template." />
    <meta name="author" content="Your Name" />
    <meta name="theme-color" content="#4d7c0f" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0f1113" media="(prefers-color-scheme: dark)" />
    <link rel="icon" type="image/svg+xml" href="./src/assets/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
    />
  </head>
  <body>
    <script>
      (function () {
        try {
          var stored = localStorage.getItem('theme');
          var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
          document.documentElement.dataset.theme = theme;
        } catch (e) {
          document.documentElement.dataset.theme = 'light';
        }
      })();
    </script>
    <div id="root"></div>
    <script type="module" src="./src/main.jsx"></script>
  </body>
</html>
`;

const PLACEHOLDER_POSTS_JS = `// AUTO-GENERATED by scripts/generate-posts.js. Do not edit by hand.
// Drop a new file in src/data/posts/ and run \`bun dev\` or \`bun run build\`.
import { parseMarkdown, readingTime } from '../lib/markdown.js';

const raw = [];

export const posts = raw
  .map((source) => {
    const parsed = parseMarkdown(source);
    return {
      ...parsed.frontmatter,
      tags: parsed.frontmatter.tags || [],
      readingTime: readingTime(source),
      blocks: parsed.blocks
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getPost(slug) {
  return posts.find((p) => p.slug === slug);
}
`;

async function scrub(workDir) {
  // Personal site config → placeholder.
  await writeFile(join(workDir, 'src', 'data', 'site.js'), PLACEHOLDER_SITE_JS);

  // Page metadata (title, description, author, canonical) → placeholder.
  await writeFile(join(workDir, 'index.html'), PLACEHOLDER_INDEX_HTML);

  // Wipe posts and the auto-generated index. Recreate empty posts/ so the
  // generator script (run on next build) finds a valid directory.
  await rm(join(workDir, 'src', 'data', 'posts'), { recursive: true, force: true });
  await mkdir(join(workDir, 'src', 'data', 'posts'), { recursive: true });
  await writeFile(join(workDir, 'src', 'data', 'posts.js'), PLACEHOLDER_POSTS_JS);

  // Track metadata + fetched artwork are personal listening data.
  await writeFile(join(workDir, 'src', 'data', 'track-meta.json'), '{}\n');
  await rm(join(workDir, 'src', 'assets', 'track-art'), { recursive: true, force: true });
  await mkdir(join(workDir, 'src', 'assets', 'track-art'), { recursive: true });

  // Bookshelf covers are personal too.
  await rm(join(workDir, 'src', 'assets', 'covers'), { recursive: true, force: true });
  await mkdir(join(workDir, 'src', 'assets', 'covers'), { recursive: true });

  // Authoring tool is local-only — it writes to src/data/posts/ on this
  // machine. Not useful in the public mirror, and references local paths.
  await rm(join(workDir, 'authoring'), { recursive: true, force: true });
}

async function main() {
  const stage = await mkdtemp(join(tmpdir(), 'personal-page-public-'));
  console.log(`staging in ${stage}`);

  try {
    console.log('copying working tree...');
    await copyTree(repoRoot, stage);

    console.log('scrubbing personal data...');
    await scrub(stage);

    // Preserve whatever README the public repo already has. The user wants
    // the README excluded from publishes, but a force-push of a fresh tree
    // wipes anything not in the new commit — so we have to *include* the
    // existing public README in the new commit to preserve it.
    console.log('fetching public README...');
    const readmeStash = await mkdtemp(join(tmpdir(), 'public-readme-'));
    try {
      const cloneRes = spawnSync(
        'git',
        ['clone', '--depth', '1', '--filter=blob:none', '--no-checkout',
         PUBLIC_REMOTE, readmeStash],
        { stdio: 'inherit' }
      );
      if (cloneRes.status === 0) {
        const checkoutRes = spawnSync(
          'git',
          ['checkout', 'HEAD', '--', 'README.md'],
          { cwd: readmeStash, stdio: 'inherit' }
        );
        if (checkoutRes.status === 0) {
          await cp(join(readmeStash, 'README.md'), join(stage, 'README.md'),
            { force: true });
          console.log('  preserved public README');
        } else {
          console.warn('  warn: public repo has no README; using local copy');
        }
      } else {
        console.warn('  warn: could not clone public repo; using local README');
      }
    } finally {
      await rm(readmeStash, { recursive: true, force: true });
    }

    if (dryRun) {
      console.log(`\ndry-run: stage left at ${stage} for inspection. exiting.`);
      return;
    }

    console.log('initializing fresh git repo...');
    run('git', ['init', '-q', '-b', 'main'], { cwd: stage });
    run('git', ['remote', 'add', 'origin', PUBLIC_REMOTE], { cwd: stage });
    run('git', ['add', '-A'], { cwd: stage });
    run(
      'git',
      ['commit', '-q', '-m', 'snapshot: sanitized publish from private repo'],
      { cwd: stage }
    );

    console.log('force-pushing to public main...');
    run('git', ['push', '-f', 'origin', 'main'], { cwd: stage });

    console.log('done.');
  } finally {
    if (!dryRun) {
      await rm(stage, { recursive: true, force: true });
    }
  }
}

await main();

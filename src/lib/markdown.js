// Minimal markdown parser tuned for this blog. Not spec-complete on purpose —
// it handles the subset we actually use, plus one custom inline syntax for
// tooltips: [[term|explanation]].
//
// Output shape:
//   { frontmatter, blocks }
//   blocks: array of { type, ... }
//     - heading:   { type: 'heading', level, children }
//     - paragraph: { type: 'paragraph', children }
//     - list:      { type: 'list', ordered, items: [children[]] }
//     - code:      { type: 'code', lang, title, value }
//     - hr:        { type: 'hr' }
//     - blockquote:{ type: 'blockquote', children }
//   children are inline nodes:
//     - { type: 'text', value }
//     - { type: 'strong' | 'em' | 'code', children | value }
//     - { type: 'link', href, children }
//     - { type: 'tooltip', label: children, content: children }

export function parseMarkdown(raw) {
  const { frontmatter, body } = splitFrontmatter(raw);
  const blocks = parseBlocks(body);
  return { frontmatter, blocks };
}

function splitFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: {}, body: raw };
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if (/^\[.*\]$/.test(value)) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }
    fm[key] = value;
  }
  return { frontmatter: fm, body: raw.slice(match[0].length) };
}

function parseBlocks(body) {
  const lines = body.split(/\r?\n/);
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // fenced code block: ```lang title="..."
    const fence = line.match(/^```\s*([A-Za-z0-9_+-]*)\s*(.*)$/);
    if (fence) {
      const lang = fence[1] || 'text';
      const titleMatch = fence[2].match(/title\s*=\s*"([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : null;
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: 'code', lang, title, value: buf.join('\n') });
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // heading
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        children: parseInline(heading[2])
      });
      i++;
      continue;
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'blockquote',
        children: parseInline(buf.join(' '))
      });
      continue;
    }

    // list (unordered or ordered)
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        const text = lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, '');
        items.push(parseInline(text));
        i++;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    // paragraph: consume until blank line or block-start
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\s*([-*+]|\d+\.)\s+/.test(lines[i]) &&
      !/^(-{3,}|\*{3,})\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', children: parseInline(buf.join(' ')) });
  }

  return blocks;
}

// Read a [[label|content]] tooltip starting at position 0 of `rest`.
// Returns { label, content, length } or null if unterminated. Tracks bracket
// depth so a [link](url) inside the content is consumed correctly.
function readTooltip(rest) {
  // `depth` counts open `[` that haven't been closed yet, *inside* the
  // tooltip body (after the leading `[[`). The closer `]]` is only valid
  // when depth is 0 — i.e. we're not inside a nested `[link](url)`.
  let depth = 0;
  let pipe = -1;
  for (let j = 2; j < rest.length; j++) {
    const ch = rest[j];
    if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      if (depth === 0 && rest[j + 1] === ']') {
        if (pipe === -1) return null;
        return {
          label: rest.slice(2, pipe),
          content: rest.slice(pipe + 1, j),
          length: j + 2
        };
      }
      depth--;
    } else if (ch === '|' && depth === 0 && pipe === -1) {
      pipe = j;
    }
  }
  return null;
}

// Inline tokenizer. Scans left-to-right, recognizing the longest match at each
// position. Order matters: code spans swallow everything inside them, so they
// run first.
export function parseInline(text) {
  const nodes = [];
  let i = 0;
  let buf = '';

  const flush = () => {
    if (buf) {
      nodes.push({ type: 'text', value: buf });
      buf = '';
    }
  };

  while (i < text.length) {
    const rest = text.slice(i);

    // inline code: `...`
    const codeM = rest.match(/^`([^`]+)`/);
    if (codeM) {
      flush();
      nodes.push({ type: 'code', value: codeM[1] });
      i += codeM[0].length;
      continue;
    }

    // tooltip: [[label|content]] — content may contain inline markdown
    // including links with their own brackets, so scan for the balanced ]]
    // closer instead of using a non-bracket regex.
    if (rest.startsWith('[[')) {
      const tip = readTooltip(rest);
      if (tip) {
        flush();
        nodes.push({
          type: 'tooltip',
          label: parseInline(tip.label),
          content: parseInline(tip.content.trim())
        });
        i += tip.length;
        continue;
      }
    }

    // link: [text](href)
    const linkM = rest.match(/^\[([^\]]+)\]\(([^)\s]+)\)/);
    if (linkM) {
      flush();
      nodes.push({
        type: 'link',
        href: linkM[2],
        children: parseInline(linkM[1])
      });
      i += linkM[0].length;
      continue;
    }

    // strong: **...**
    const strongM = rest.match(/^\*\*([^*]+)\*\*/);
    if (strongM) {
      flush();
      nodes.push({
        type: 'strong',
        children: parseInline(strongM[1])
      });
      i += strongM[0].length;
      continue;
    }

    // em: *...*  (must not be part of **)
    const emM = rest.match(/^\*([^*]+)\*/);
    if (emM) {
      flush();
      nodes.push({ type: 'em', children: parseInline(emM[1]) });
      i += emM[0].length;
      continue;
    }

    buf += text[i];
    i++;
  }

  flush();
  return nodes;
}

export function readingTime(body) {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

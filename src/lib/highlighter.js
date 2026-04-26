import { createHighlighter } from 'shiki';

// Langs we expect in posts. Add more here as needed.
const LANGS = ['rust', 'js', 'ts', 'jsx', 'tsx', 'json', 'bash', 'sh', 'toml', 'yaml', 'text'];
const THEMES = ['github-light', 'github-dark'];

let highlighterPromise = null;

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: THEMES,
      langs: LANGS
    });
  }
  return highlighterPromise;
}

export async function highlight(code, lang) {
  const hl = await getHighlighter();
  const safeLang = hl.getLoadedLanguages().includes(lang) ? lang : 'text';
  return hl.codeToHtml(code, {
    lang: safeLang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false
  });
}

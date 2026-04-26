import { useEffect, useState } from 'react';
import { highlight } from '../lib/highlighter.js';

export default function CodeBlock({ lang, title, value }) {
  const [html, setHtml] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    highlight(value, lang).then((out) => {
      if (!cancelled) setHtml(out);
    });
    return () => {
      cancelled = true;
    };
  }, [value, lang]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  return (
    <div className="codeblock">
      <div className="codeblock__head">
        <span className="codeblock__meta">
          {title ? (
            <span className="codeblock__title">{title}</span>
          ) : (
            <span className="codeblock__lang">{lang}</span>
          )}
        </span>
        <button
          type="button"
          className="codeblock__copy"
          onClick={onCopy}
          aria-label="Copy code"
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      {html ? (
        <div
          className="codeblock__body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="codeblock__body codeblock__body--fallback">
          <code>{value}</code>
        </pre>
      )}
    </div>
  );
}

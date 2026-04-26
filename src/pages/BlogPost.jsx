import { Link, useParams } from 'react-router-dom';
import { getPost, posts } from '../data/posts.js';
import { site } from '../data/site.js';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPost(slug);

  if (!post) {
    return (
      <div className="page">
        <h1>Post not found</h1>
        <p>
          <Link to="/blog" className="prose__link">
            Back to all posts
          </Link>
        </p>
      </div>
    );
  }

  const idx = posts.findIndex((p) => p.slug === slug);
  const prev = idx < posts.length - 1 ? posts[idx + 1] : null;
  const next = idx > 0 ? posts[idx - 1] : null;

  return (
    <article className="page blog-post">
      <Link to="/blog" className="blog-post__back">
        ← All posts
      </Link>
      <header className="blog-post__header">
        <div className="blog-post__meta">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span>·</span>
          <span>{post.readingTime} min read</span>
        </div>
        <h1 className="blog-post__title">{post.title}</h1>
        {post.tags?.length > 0 && (
          <ul className="blog-post__tags">
            {post.tags.map((t) => (
              <li key={t} className="blog-post__tag">
                {t}
              </li>
            ))}
          </ul>
        )}
      </header>

      <MarkdownRenderer blocks={post.blocks} />
      <br />
      <p>Loved it? Hated it? Let me know at <a href={`mailto:${site.email}`} style={{ color: 'var(--color-accent-ink)' }}>
          {site.email}
        </a></p>

      <nav className="blog-post__nav">
        {prev ? (
          <Link to={`/blog/${prev.slug}`} className="blog-post__nav-link">
            <span className="blog-post__nav-label">Previous</span>
            <span className="blog-post__nav-title">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/blog/${next.slug}`}
            className="blog-post__nav-link blog-post__nav-link--right"
          >
            <span className="blog-post__nav-label">Next</span>
            <span className="blog-post__nav-title">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}

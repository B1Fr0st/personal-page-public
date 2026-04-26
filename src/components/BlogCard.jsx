import { Link } from 'react-router-dom';

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default function BlogCard({ post }) {
  return (
    <article className="blog-card">
      <div className="blog-card__meta">
        <time className="blog-card__date" dateTime={post.date}>
          {formatDate(post.date)}
        </time>
        <span className="blog-card__reading">{post.readingTime} min read</span>
      </div>
      <h3 className="blog-card__title">
        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>
      {post.excerpt && <p className="blog-card__excerpt">{post.excerpt}</p>}
      {post.tags?.length > 0 && (
        <ul className="blog-card__tags">
          {post.tags.map((t) => (
            <li key={t} className="blog-card__tag">
              {t}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

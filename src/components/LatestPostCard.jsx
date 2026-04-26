import { Link } from 'react-router-dom';
import { posts } from '../data/posts.js';

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default function LatestPostCard() {
  const post = posts[0];
  if (!post) return null;

  return (
    <section className="section latest-post">
      <div className="latest-post__head">
        <span className="latest-post__label">Latest Post</span>
        <Link to="/blog" className="latest-post__all">
          All posts →
        </Link>
      </div>
      <Link to={`/blog/${post.slug}`} className="latest-post__body">
        <div className="latest-post__meta">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span>·</span>
          <span>{post.readingTime} min read</span>
        </div>
        <h3 className="latest-post__title">{post.title}</h3>
        {post.excerpt && (
          <p className="latest-post__excerpt">{post.excerpt}</p>
        )}
        <span className="latest-post__cta">Read post →</span>
      </Link>
    </section>
  );
}

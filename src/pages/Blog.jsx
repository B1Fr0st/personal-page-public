import BlogCard from '../components/BlogCard.jsx';
import { posts } from '../data/posts.js';
import { site } from '../data/site.js';

export default function Blog() {
  return (
    <div className="page">
      <h2 className="section__label">Blog</h2>
      <h1>Thoughts</h1>
      <p className="hero__tagline" style={{ marginBottom: '3rem' }}>
        {site.postsTagline}
      </p>
      <div className="blog-list">
        {posts.map((p) => (
          <BlogCard key={p.slug} post={p} />
        ))}
      </div>
    </div>
  );
}

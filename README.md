# personal-page

React personal site powered by [Bun](https://bun.sh) (bundler + dev server) with react-router-dom.

## Getting started

Requires Bun ≥ 1.2.

```bash
bun install
bun run dev
```

Build for production:

```bash
bun run build
bun run start
```

## Structure

```
index.html              HTML entrypoint (imported by the server)
build.js                production build via Bun.build
src/
  server.jsx            Bun.serve dev + prod server
  main.jsx              React entry
  App.jsx               routes + layout
  components/           reusable UI
    Navbar.jsx
    Footer.jsx
    Hero.jsx
    ProjectCard.jsx
    SkillList.jsx
    ContactForm.jsx
  pages/                route views
    Home.jsx
    About.jsx
    Projects.jsx
    Contact.jsx
    NotFound.jsx
  data/site.js          site content (name, projects, skills)
  styles/global.css     global styles
```

Edit `src/data/site.js` and `index.html` (favicon, site name, etc) to personalize content.
Create new blog posts using `bun run author` for a markdown editor with live previews.
NOTE: the blog post editor is not meant to be deployed publically; the intended use is for you to run it locally against your repo and then commit the new post, and have CI/CD build it for you.

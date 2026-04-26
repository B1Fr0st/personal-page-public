export const site = {
  name: 'Your Name',
  title: 'Software Engineer',
  headline: 'Hi, I\'m You.',
  tagline:
    'Short tagline describing what you do and what you\'re looking for.',
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
      title: 'What I\'m up to',
      items: [
        { label: 'Studying', value: 'Replace with what you\'re studying' },
        { label: 'Building', value: 'Replace with what you\'re building' }
      ]
    }
  ]
};

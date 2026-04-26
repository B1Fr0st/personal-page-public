import Hero from '../components/Hero.jsx';
import GithubCard from '../components/GithubCard.jsx';
import LinkedinCard from '../components/LinkedinCard.jsx';
import LatestPostCard from '../components/LatestPostCard.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectWindow from '../components/ProjectWindow.jsx';
import useProjectExpand from '../lib/useProjectExpand.js';
import { site, competencies, projects, experience } from '../data/site.js';

export default function Home() {
  const { expanded, closing, setClosing, onExpand, onClose } = useProjectExpand();

  return (
    <div className="page">
      <Hero />

      <LatestPostCard />

      <section className="section">
        <h2 className="section__label">Featured Projects</h2>
        <div className="project-list">
          {projects
            .filter((p) => site.featuredProjects.includes(p.id))
            .map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onExpand={onExpand}
                hidden={expanded?.project.id === p.id}
                returning={closing && expanded?.project.id === p.id}
              />
            ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section__label">Core Competencies</h2>
        <div className="competencies">
          {competencies.map((c) => (
            <div key={c.id} className="competency">
              <div className="competency__head">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined competency__icon"
                >
                  {c.icon}
                </span>
                <h3 className="competency__title">{c.title}</h3>
              </div>
              <ul className="competency__list">
                {c.items.map((item) => (
                  <li key={item} className="competency__item">
                    <span className="competency__dot" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      

      <section className="section">
        <h2 className="section__label">Education</h2>
        <div className="timeline">
          {experience.map((e) => (
            <div key={e.id} className="timeline__item">
              <span
                aria-hidden="true"
                className={`timeline__dot${
                  e.current ? ' timeline__dot--current' : ''
                }`}
              />
              <span className="timeline__period">{e.period}</span>
              <h4 className="timeline__role">
                {e.role} @ {e.org}
              </h4>
              <p className="timeline__summary">{e.summary}</p>
            </div>
          ))}
        </div>
      </section>

      <GithubCard />
      <LinkedinCard />

      {expanded && (
        <ProjectWindow
          project={expanded.project}
          originRect={expanded.rect}
          titleRect={expanded.titleRect}
          onClose={onClose}
          onClosingChange={setClosing}
        />
      )}
    </div>
  );
}

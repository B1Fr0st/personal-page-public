import ProjectCard from '../components/ProjectCard.jsx';
import ProjectWindow from '../components/ProjectWindow.jsx';
import useProjectExpand from '../lib/useProjectExpand.js';
import { projects, site } from '../data/site.js';

export default function Projects() {
  const { expanded, closing, setClosing, onExpand, onClose } = useProjectExpand();

  return (
    <div className="page">
      <h2 className="section__label">Projects</h2>
      <h1>Selected Work</h1>
      <p className="hero__tagline" style={{ marginBottom: '3rem' }}>
        {site.projectsTagline}
      </p>
      <div className="project-list">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            onExpand={onExpand}
            hidden={expanded?.project.id === p.id}
            returning={closing && expanded?.project.id === p.id}
          />
        ))}
      </div>
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

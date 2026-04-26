import { skills } from '../data/site.js';

export default function SkillList() {
  return (
    <ul className="skill-list">
      {skills.map((s) => (
        <li key={s} className="skill-list__item">
          {s}
        </li>
      ))}
    </ul>
  );
}

import CodeBlock from './CodeBlock.jsx';
import Tooltip from './Tooltip.jsx';

function renderInline(nodes) {
  return nodes.map((node, idx) => {
    switch (node.type) {
      case 'text':
        return node.value;
      case 'strong':
        return <strong key={idx}>{renderInline(node.children)}</strong>;
      case 'em':
        return <em key={idx}>{renderInline(node.children)}</em>;
      case 'code':
        return (
          <code key={idx} className="prose__code">
            {node.value}
          </code>
        );
      case 'link':
        return (
          <a
            key={idx}
            href={node.href}
            target={node.href.startsWith('http') ? '_blank' : undefined}
            rel={node.href.startsWith('http') ? 'noreferrer' : undefined}
            className="prose__link"
          >
            {renderInline(node.children)}
          </a>
        );
      case 'tooltip':
        return (
          <Tooltip
            key={idx}
            label={renderInline(node.label)}
            content={renderInline(node.content)}
          />
        );
      default:
        return null;
    }
  });
}

function renderBlock(block, idx) {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${Math.min(block.level, 6)}`;
      return <Tag key={idx}>{renderInline(block.children)}</Tag>;
    }
    case 'paragraph':
      return <p key={idx}>{renderInline(block.children)}</p>;
    case 'blockquote':
      return (
        <blockquote key={idx} className="prose__quote">
          {renderInline(block.children)}
        </blockquote>
      );
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag key={idx} className="prose__list">
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </Tag>
      );
    }
    case 'code':
      return (
        <CodeBlock
          key={idx}
          lang={block.lang}
          title={block.title}
          value={block.value}
        />
      );
    case 'hr':
      return <hr key={idx} className="prose__hr" />;
    default:
      return null;
  }
}

export default function MarkdownRenderer({ blocks }) {
  return <div className="prose">{blocks.map(renderBlock)}</div>;
}

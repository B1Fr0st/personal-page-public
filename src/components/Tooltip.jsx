export default function Tooltip({ label, content }) {
  return (
    <span className="tooltip" tabIndex={0}>
      <span className="tooltip__trigger">{label}</span>
      <span className="tooltip__popover" role="tooltip">
        {content}
      </span>
    </span>
  );
}

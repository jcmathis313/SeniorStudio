const STATUS_STYLES = {
  pending:   { bg: '#f5f5f7', color: '#86868b', label: 'Pending' },
  requested: { bg: '#fff8e1', color: '#f59e0b', label: 'Requested' },
  preparing: { bg: '#e8f4fd', color: '#0071e3', label: 'Preparing' },
  shipped:   { bg: '#e0f2fe', color: '#0284c7', label: 'Shipped' },
  received:  { bg: '#ecfdf5', color: '#10b981', label: 'Received' },
  returned:  { bg: '#f3e8ff', color: '#8b5cf6', label: 'Returned' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      className="status-badge"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}

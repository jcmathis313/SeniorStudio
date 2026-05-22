export default function SummaryCard({ title, value, color }) {
  return (
    <div className="report-card" style={{ borderLeftColor: color }}>
      <span className="report-card__value">{value}</span>
      <span className="report-card__title">{title}</span>
    </div>
  );
}

import SummaryCard from './SummaryCard';

export default function SummaryCards({ summary, loading }) {
  if (loading) {
    return (
      <div className="reports-cards">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="report-card report-card--loading">
            <span className="report-card__value">—</span>
            <span className="report-card__title">Loading...</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="reports-cards">
      <SummaryCard title="Total Leads" value={summary.totalLeads} color="#007aff" />
      <SummaryCard title="Collections Saved" value={summary.totalCollections} color="#34c759" />
      <SummaryCard title="Total Orders" value={summary.totalOrders} color="#af52de" />
      <SummaryCard title="Pending Orders" value={summary.pendingOrders} color="#f59e0b" />
    </div>
  );
}

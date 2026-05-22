import StatusBadge from '../StatusBadge';

const TYPE_LABELS = {
  sample_request: 'Sample Request',
  literature: 'Literature',
  spec_sheet: 'Spec Sheet',
  other: 'Other',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function RecentOrdersTable({ data, loading }) {
  return (
    <div className="report-table-section">
      <h3 className="section-title">Recent Shipping Orders</h3>
      <div className="table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Status</th>
              <th>Carrier</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="empty-state">Loading...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">No orders yet</td>
              </tr>
            ) : (
              data.map((order) => (
                <tr key={order.id}>
                  <td>{TYPE_LABELS[order.type] || order.type}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>{order.carrier ? order.carrier.toUpperCase() : '—'}</td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

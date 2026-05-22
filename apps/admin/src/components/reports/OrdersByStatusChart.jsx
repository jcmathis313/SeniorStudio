import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const STATUS_COLORS = {
  new: '#d97706',
  processing: '#0284c7',
  packed: '#7c3aed',
  shipped: '#2563eb',
  delivered: '#059669',
  cancelled: '#dc2626',
};

const STATUS_LABELS = {
  new: 'New',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersByStatusChart({ data, loading }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const labeled = data.map((d) => ({ ...d, label: STATUS_LABELS[d.status] || d.status }));

  return (
    <div className="report-chart-card">
      <h3 className="report-chart-card__title">Orders by Status</h3>
      <div className="report-chart-card__body">
        {loading ? (
          <div className="chart-placeholder">Loading...</div>
        ) : data.length === 0 ? (
          <div className="chart-placeholder">No orders yet</div>
        ) : (
          <div className="donut-chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={labeled}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {labeled.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#86868b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 13 }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center-label">
              <span className="donut-center-value">{total}</span>
              <span className="donut-center-text">orders</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

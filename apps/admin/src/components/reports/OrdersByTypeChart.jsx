import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const TYPE_COLORS = {
  sample_request: '#007aff',
  literature: '#34c759',
  spec_sheet: '#af52de',
  other: '#86868b',
};

const TYPE_LABELS = {
  sample_request: 'Sample Request',
  literature: 'Literature',
  spec_sheet: 'Spec Sheet',
  other: 'Other',
};

export default function OrdersByTypeChart({ data, loading }) {
  const labeled = data.map((d) => ({
    ...d,
    label: TYPE_LABELS[d.type] || d.type,
    color: TYPE_COLORS[d.type] || '#86868b',
  }));

  return (
    <div className="report-chart-card">
      <h3 className="report-chart-card__title">Orders by Type</h3>
      <div className="report-chart-card__body">
        {loading ? (
          <div className="chart-placeholder">Loading...</div>
        ) : data.length === 0 ? (
          <div className="chart-placeholder">No orders yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={labeled} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#86868b' }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#86868b' }} width={110} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 13 }}
              />
              <Bar dataKey="count" name="Orders" radius={[0, 4, 4, 0]}>
                {labeled.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

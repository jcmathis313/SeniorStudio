import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function LeadsOverTimeChart({ data, loading }) {
  return (
    <div className="report-chart-card">
      <h3 className="report-chart-card__title">Leads Over Time</h3>
      <div className="report-chart-card__body">
        {loading ? (
          <div className="chart-placeholder">Loading...</div>
        ) : data.length === 0 ? (
          <div className="chart-placeholder">No lead data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#86868b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#86868b' }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 13 }}
              />
              <Bar dataKey="count" name="Leads" fill="#007aff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

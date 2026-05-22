import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function ActivityOverTimeChart({ data, loading }) {
  return (
    <div className="report-chart-card">
      <h3 className="report-chart-card__title">Activity Over Time</h3>
      <div className="report-chart-card__body">
        {loading ? (
          <div className="chart-placeholder">Loading...</div>
        ) : data.length === 0 ? (
          <div className="chart-placeholder">No activity data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#86868b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#86868b' }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 13 }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Line type="monotone" dataKey="collections" name="Collections" stroke="#007aff" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="welcomeBoxes" name="Welcome Boxes" stroke="#34c759" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="designSamples" name="Design Samples" stroke="#af52de" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

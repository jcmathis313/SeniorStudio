const TYPE_LABELS = {
  sample_request: 'Sample Request',
  literature: 'Literature',
  spec_sheet: 'Spec Sheet',
  other: 'Other',
};

const STATUS_COLS = ['new', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];

export default function ShippingSummaryTable({ data, loading }) {
  const totals = {};
  for (const s of STATUS_COLS) {
    totals[s] = data.reduce((sum, row) => sum + (row[s] || 0), 0);
  }
  totals.total = data.reduce((sum, row) => sum + (row.total || 0), 0);

  return (
    <div className="report-table-section">
      <h3 className="section-title">Shipping Summary</h3>
      <div className="table-container">
        <table className="leads-table summary-table">
          <thead>
            <tr>
              <th>Type</th>
              {STATUS_COLS.map((s) => (
                <th key={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={STATUS_COLS.length + 2} className="empty-state">Loading...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={STATUS_COLS.length + 2} className="empty-state">No shipping data yet</td>
              </tr>
            ) : (
              <>
                {data.map((row) => (
                  <tr key={row.type}>
                    <td><strong>{TYPE_LABELS[row.type] || row.type}</strong></td>
                    {STATUS_COLS.map((s) => (
                      <td key={s}>{row[s] || 0}</td>
                    ))}
                    <td><strong>{row.total}</strong></td>
                  </tr>
                ))}
                <tr className="summary-table__totals">
                  <td><strong>Total</strong></td>
                  {STATUS_COLS.map((s) => (
                    <td key={s}><strong>{totals[s]}</strong></td>
                  ))}
                  <td><strong>{totals.total}</strong></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

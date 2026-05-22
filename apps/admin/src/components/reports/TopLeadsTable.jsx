import { useCommunity } from '../../lib/CommunityContext';

export default function TopLeadsTable({ data, loading }) {
  const { activeCommunityId, communities } = useCommunity() || {};
  const showCommunity = activeCommunityId === 'all';

  function communityName(id) {
    const c = (communities || []).find((c) => c.id === id);
    return c ? c.name : '';
  }

  return (
    <div className="report-table-section">
      <h3 className="section-title">Top Leads by Activity</h3>
      <div className="table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Lead</th>
              {showCommunity && <th>Community</th>}
              <th>Collections</th>
              <th>Welcome Boxes</th>
              <th>Design Samples</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showCommunity ? 6 : 5} className="empty-state">Loading...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={showCommunity ? 6 : 5} className="empty-state">No lead activity yet</td>
              </tr>
            ) : (
              data.map((lead) => (
                <tr key={lead.email}>
                  <td>
                    <div className="lead-cell">
                      <span className="lead-name">{lead.name}</span>
                      <span className="lead-email">{lead.email}</span>
                    </div>
                  </td>
                  {showCommunity && <td>{communityName(lead.communityId)}</td>}
                  <td>{lead.collections}</td>
                  <td>{lead.welcomeBoxes}</td>
                  <td>{lead.designSamples}</td>
                  <td><strong>{lead.total}</strong></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

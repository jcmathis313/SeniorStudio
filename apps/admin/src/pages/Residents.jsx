import { useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import CollectionsList from '../components/CollectionsList';
import { MOCK_RESIDENTS } from '../data/mock';

export default function Residents() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_RESIDENTS.filter((r) => {
    const term = search.toLowerCase();
    return (
      r.firstName.toLowerCase().includes(term) ||
      r.lastName.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.unit.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-residents">
      <div className="page-header">
        <div>
          <h2 className="page-title">Residents</h2>
          <p className="page-subtitle">{MOCK_RESIDENTS.length} residents across all units</p>
        </div>
        <div className="page-actions">
          <div className="search-box">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 11.5L14.5 14.5M7.5 13C4.46243 13 2 10.5376 2 7.5C2 4.46243 4.46243 2 7.5 2C10.5376 2 13 4.46243 13 7.5C13 10.5376 10.5376 13 7.5 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search residents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="residents-table">
          <thead>
            <tr>
              <th>Resident</th>
              <th>Unit</th>
              <th>Collections</th>
              <th>Welcome Box</th>
              <th>Design Samples</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((resident) => (
              <tr key={resident.id}>
                <td>
                  <div className="resident-cell">
                    <span className="resident-name">
                      {resident.firstName} {resident.lastName}
                    </span>
                    <span className="resident-email">{resident.email}</span>
                  </div>
                </td>
                <td>
                  <span className="unit-badge">{resident.unit}</span>
                </td>
                <td>
                  <CollectionsList collections={resident.collections} />
                </td>
                <td>
                  <StatusBadge status={resident.welcomeBox} />
                </td>
                <td>
                  <StatusBadge status={resident.designSamples} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-state">
                  No residents match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

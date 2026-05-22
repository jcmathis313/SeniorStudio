import { useState } from 'react';
import { useCommunity } from '../lib/CommunityContext';
import { useReportsData } from '../lib/useReportsData';
import DateRangeFilter from '../components/reports/DateRangeFilter';
import SummaryCards from '../components/reports/SummaryCards';
import LeadsOverTimeChart from '../components/reports/LeadsOverTimeChart';
import OrdersByStatusChart from '../components/reports/OrdersByStatusChart';
import OrdersByTypeChart from '../components/reports/OrdersByTypeChart';
import ActivityOverTimeChart from '../components/reports/ActivityOverTimeChart';
import TopLeadsTable from '../components/reports/TopLeadsTable';
import RecentOrdersTable from '../components/reports/RecentOrdersTable';
import ShippingSummaryTable from '../components/reports/ShippingSummaryTable';

export default function Reports() {
  const { activeCommunityId, activeCommunity, scopeQuery } = useCommunity() || {};
  const [dateRange, setDateRange] = useState({ start: null, end: null, preset: 'all' });

  const {
    loading, error, summary,
    leadsOverTime, ordersByStatus, ordersByType,
    activityOverTime, topLeads, recentOrders, shippingSummary,
  } = useReportsData({ activeCommunityId, scopeQuery, dateRange });

  const subtitle = loading
    ? 'Loading...'
    : `${summary.totalLeads} leads · ${summary.totalOrders} orders`;

  return (
    <div className="page-reports">
      <div className="page-header">
        <div>
          <h2 className="page-title">Reports</h2>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <div className="page-actions">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {error && (
        <div className="error-banner">
          Failed to load report data: {error}
        </div>
      )}

      <SummaryCards summary={summary} loading={loading} />

      <section className="reports-charts">
        <LeadsOverTimeChart data={leadsOverTime} loading={loading} />
        <OrdersByStatusChart data={ordersByStatus} loading={loading} />
        <OrdersByTypeChart data={ordersByType} loading={loading} />
        <ActivityOverTimeChart data={activityOverTime} loading={loading} />
      </section>

      <section className="reports-tables">
        <TopLeadsTable data={topLeads} loading={loading} />
        <RecentOrdersTable data={recentOrders} loading={loading} />
        <ShippingSummaryTable data={shippingSummary} loading={loading} />
      </section>
    </div>
  );
}

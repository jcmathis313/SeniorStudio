import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCommunity } from '../lib/CommunityContext';
import { transformOrder } from '../lib/transformOrder';
import { printPackingSlips } from '../lib/packingSlip';
import StatusBadge from '../components/StatusBadge';
import Drawer from '../components/Drawer';
import ShippingDrawer from '../components/ShippingDrawer';

const TYPE_LABELS = {
  sample_request: 'Sample Request',
  literature: 'Literature',
  spec_sheet: 'Spec Sheet',
  other: 'Other',
};

const CARRIER_LABELS = {
  ups: 'UPS',
  fedex: 'FedEx',
  usps: 'USPS',
  hand_delivery: 'Hand Delivery',
  other: 'Other',
};

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

function formatOrderId(id) {
  return '#' + (id || '').substring(0, 8);
}

export default function Shipping() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  const { activeCommunityId, scopeQuery } = useCommunity() || {};

  useEffect(() => {
    if (!activeCommunityId) return;

    async function fetchOrders() {
      setLoading(true);
      let query = supabase
        .from('shipping_orders')
        .select('*')
        .order('created_at', { ascending: false });

      query = scopeQuery(query);

      const { data, error: fetchErr } = await query;

      if (fetchErr) {
        console.error('Error fetching shipping orders:', fetchErr.message);
        setError(fetchErr.message);
        setLoading(false);
        return;
      }

      setOrders((data || []).map(transformOrder));
      setError(null);
      setLoading(false);
    }

    fetchOrders();
  }, [activeCommunityId]);

  function openDrawer(order) {
    setSelectedOrder(order);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => setSelectedOrder(null), 300);
  }

  function handleOrderUpdate(updated) {
    setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
    setSelectedOrder(updated);
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === tableOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tableOrders.map((o) => o.id)));
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function bulkTransition(newStatus) {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkSaving(true);

    const extraFields = {};
    if (newStatus === 'shipped') extraFields.shipped_at = new Date().toISOString();
    if (newStatus === 'delivered') extraFields.delivered_at = new Date().toISOString();

    const { data, error: updateErr } = await supabase
      .from('shipping_orders')
      .update({ status: newStatus, ...extraFields })
      .in('id', ids)
      .select();

    if (updateErr) {
      console.error('Bulk update failed:', updateErr.message);
      setBulkSaving(false);
      return;
    }

    const updated = (data || []).map(transformOrder);
    setOrders((prev) =>
      prev.map((o) => {
        const match = updated.find((u) => u.id === o.id);
        return match || o;
      })
    );
    setSelectedIds(new Set());
    setBulkSaving(false);
  }

  function bulkPrintSlips() {
    const selected = orders.filter((o) => selectedIds.has(o.id));
    if (selected.length > 0) printPackingSlips(selected);
  }

  const newOrders = orders.filter((o) => o.status === 'new');

  const activeStatuses = ['processing', 'packed', 'shipped'];
  const completedStatuses = ['delivered', 'cancelled'];

  const tableOrders = orders.filter((o) => {
    const pool = showCompleted ? completedStatuses : activeStatuses;
    if (!pool.includes(o.status)) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (typeFilter !== 'all' && o.type !== typeFilter) return false;
    if (carrierFilter !== 'all' && (o.carrier || '') !== carrierFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const req = o.requester || {};
      const st = o.shipTo || {};
      return (
        (req.name || '').toLowerCase().includes(q) ||
        (req.email || '').toLowerCase().includes(q) ||
        (req.organization || '').toLowerCase().includes(q) ||
        (st.city || '').toLowerCase().includes(q) ||
        (o.trackingNumber || '').toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = orders.filter((o) => activeStatuses.includes(o.status)).length;
  const completedCount = orders.filter((o) => completedStatuses.includes(o.status)).length;

  const subtitle = loading
    ? 'Loading...'
    : `${newOrders.length} new · ${activeCount} active · ${completedCount} completed`;

  return (
    <div className="page-shipping">
      <div className="page-header">
        <div>
          <h2 className="page-title">Shipping</h2>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>

      {error && <div className="error-banner">Failed to load orders: {error}</div>}

      {/* New Orders */}
      <section className="shipping-triage">
        <h3 className="section-title">
          New Orders
          {newOrders.length > 0 && <span className="count-badge">{newOrders.length}</span>}
        </h3>
        <div className="triage-grid">
          {newOrders.length === 0 && !loading && (
            <div className="triage-empty">No new orders to triage</div>
          )}
          {newOrders.map((order) => (
            <div
              key={order.id}
              className={`triage-card triage-card--${order.type}`}
              onClick={() => openDrawer(order)}
            >
              <span className={`triage-card__type type-label--${order.type}`}>
                {TYPE_LABELS[order.type] || order.type}
              </span>
              <span className="triage-card__requester">
                {order.requester?.name || 'Unknown'}
              </span>
              <span className="triage-card__org">
                {order.requester?.organization || ''}
              </span>
              <span className="triage-card__meta">
                <span>{(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}</span>
                <span>{formatTimeAgo(order.createdAt)}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Active Orders */}
      <section className="shipping-active">
        <div className="section-header">
          <h3 className="section-title">
            {showCompleted ? 'Completed Orders' : 'Active Orders'}
          </h3>
          <div className="section-actions">
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {(showCompleted ? completedStatuses : activeStatuses).map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select className="filter-select" value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)}>
              <option value="all">All Carriers</option>
              {Object.entries(CARRIER_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <div className="search-box">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 11.5L14.5 14.5M7.5 13C4.46243 13 2 10.5376 2 7.5C2 4.46243 4.46243 2 7.5 2C10.5376 2 13 4.46243 13 7.5C13 10.5376 10.5376 13 7.5 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className={`toggle-btn ${showCompleted ? 'toggle-btn--active' : ''}`}
              onClick={() => { setShowCompleted(!showCompleted); setStatusFilter('all'); }}
            >
              {showCompleted ? 'Show Active' : 'Show Completed'}
            </button>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="bulk-bar">
            <span className="bulk-bar__count">{selectedIds.size} selected</span>
            <div className="bulk-bar__actions">
              <button className="btn-primary btn-sm" disabled={bulkSaving} onClick={() => bulkTransition('packed')}>
                Mark Packed
              </button>
              <button className="btn-primary btn-sm" disabled={bulkSaving} onClick={() => bulkTransition('shipped')}>
                Mark Shipped
              </button>
              <button className="btn-primary btn-sm" disabled={bulkSaving} onClick={() => bulkTransition('delivered')}>
                Mark Delivered
              </button>
              <button className="btn-secondary btn-sm" onClick={bulkPrintSlips}>
                Print Slips
              </button>
              <button className="btn-secondary btn-sm" onClick={clearSelection}>
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="shipping-table">
            <thead>
              <tr>
                <th className="th-check">
                  <input
                    type="checkbox"
                    checked={tableOrders.length > 0 && selectedIds.size === tableOrders.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Order</th>
                <th>Type</th>
                <th>Requester</th>
                <th>Ship To</th>
                <th>Status</th>
                <th>Carrier</th>
                <th>Tracking</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="empty-state">Loading orders...</td>
                </tr>
              ) : tableOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    {orders.length === 0
                      ? 'No shipping orders yet.'
                      : 'No orders match your filters.'}
                  </td>
                </tr>
              ) : (
                tableOrders.map((order) => (
                  <tr key={order.id} className={selectedIds.has(order.id) ? 'row-selected' : ''}>
                    <td className="td-check" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                      />
                    </td>
                    <td onClick={() => openDrawer(order)}><span className="order-id">{formatOrderId(order.id)}</span></td>
                    <td onClick={() => openDrawer(order)}>
                      <span className={`type-label type-label--${order.type}`}>
                        {TYPE_LABELS[order.type] || order.type}
                      </span>
                    </td>
                    <td onClick={() => openDrawer(order)}>
                      <div className="lead-cell">
                        <span className="lead-name">{order.requester?.name || '—'}</span>
                        <span className="lead-email">{order.requester?.email || ''}</span>
                      </div>
                    </td>
                    <td onClick={() => openDrawer(order)}>
                      {order.shipTo?.city
                        ? `${order.shipTo.city}, ${order.shipTo.state}`
                        : '—'}
                    </td>
                    <td onClick={() => openDrawer(order)}><StatusBadge status={order.status} /></td>
                    <td onClick={() => openDrawer(order)}>
                      {order.carrier
                        ? <span className="carrier-label">{CARRIER_LABELS[order.carrier] || order.carrier}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td onClick={() => openDrawer(order)}>
                      {order.trackingNumber
                        ? <span className="tracking-number">{order.trackingNumber}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td onClick={() => openDrawer(order)}>{formatDate(order.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Drawer */}
      <Drawer open={drawerOpen} onClose={closeDrawer}>
        {selectedOrder && (
          <ShippingDrawer
            order={selectedOrder}
            onUpdate={handleOrderUpdate}
            onClose={closeDrawer}
          />
        )}
      </Drawer>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from './supabase';

function toMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key) {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function bucketByMonth(items, dateField = 'created_at') {
  const map = {};
  for (const item of items) {
    const key = toMonthKey(item[dateField]);
    map[key] = (map[key] || 0) + 1;
  }
  return Object.keys(map)
    .sort()
    .map((key) => ({ month: formatMonthLabel(key), count: map[key] }));
}

function buildActivityTimeline(collections, welcomeBoxes, designSamples) {
  const map = {};

  for (const c of collections) {
    const key = toMonthKey(c.saved_at || c.created_at);
    if (!map[key]) map[key] = { collections: 0, welcomeBoxes: 0, designSamples: 0 };
    map[key].collections++;
  }
  for (const w of welcomeBoxes) {
    const key = toMonthKey(w.created_at);
    if (!map[key]) map[key] = { collections: 0, welcomeBoxes: 0, designSamples: 0 };
    map[key].welcomeBoxes++;
  }
  for (const d of designSamples) {
    const key = toMonthKey(d.created_at);
    if (!map[key]) map[key] = { collections: 0, welcomeBoxes: 0, designSamples: 0 };
    map[key].designSamples++;
  }

  return Object.keys(map)
    .sort()
    .map((key) => ({ month: formatMonthLabel(key), ...map[key] }));
}

function countByField(items, field) {
  const map = {};
  for (const item of items) {
    const val = item[field] || 'unknown';
    map[val] = (map[val] || 0) + 1;
  }
  return Object.entries(map).map(([key, count]) => ({ [field]: key, count }));
}

function buildShippingSummary(orders) {
  const statuses = ['new', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];
  const types = ['sample_request', 'literature', 'spec_sheet', 'other'];

  const matrix = {};
  for (const t of types) {
    matrix[t] = { type: t };
    for (const s of statuses) matrix[t][s] = 0;
    matrix[t].total = 0;
  }

  for (const order of orders) {
    const t = types.includes(order.type) ? order.type : 'other';
    const s = statuses.includes(order.status) ? order.status : 'new';
    matrix[t][s]++;
    matrix[t].total++;
  }

  return types.map((t) => matrix[t]);
}

export function useReportsData({ activeCommunityId, scopeQuery, dateRange }) {
  const [data, setData] = useState({
    loading: true,
    error: null,
    summary: { totalLeads: 0, totalCollections: 0, totalOrders: 0, pendingOrders: 0, shippedOrders: 0, deliveredOrders: 0 },
    leadsOverTime: [],
    ordersByStatus: [],
    ordersByType: [],
    activityOverTime: [],
    topLeads: [],
    recentOrders: [],
    shippingSummary: [],
  });

  useEffect(() => {
    if (!activeCommunityId) return;

    let cancelled = false;

    async function fetchAll() {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      try {
        function applyDateFilter(query, col = 'created_at') {
          if (dateRange.start) query = query.gte(col, dateRange.start);
          if (dateRange.end) query = query.lte(col, dateRange.end);
          return query;
        }

        const residentsQ = applyDateFilter(
          scopeQuery(supabase.from('residents').select('id, community_id, created_at'))
        );

        const collectionsQ = applyDateFilter(
          scopeQuery(supabase.from('collections').select('id, resident_id, community_id, saved_at, created_at'))
        );

        const ordersQ = applyDateFilter(
          scopeQuery(supabase.from('shipping_orders').select('id, type, status, carrier, community_id, created_at, shipped_at, delivered_at'))
        );

        const welcomeQ = applyDateFilter(
          scopeQuery(supabase.from('welcome_boxes').select('id, community_id, status, created_at'))
        );

        const samplesQ = applyDateFilter(
          scopeQuery(supabase.from('design_samples').select('id, community_id, status, created_at'))
        );

        const leadsWithActivityQ = scopeQuery(
          supabase.from('residents').select('id, first_name, last_name, email, community_id, collections(id), welcome_boxes(id), design_samples(id)')
        );

        const [residentsRes, collectionsRes, ordersRes, welcomeRes, samplesRes, leadsActivityRes] =
          await Promise.all([residentsQ, collectionsQ, ordersQ, welcomeQ, samplesQ, leadsWithActivityQ]);

        const err = [residentsRes, collectionsRes, ordersRes, welcomeRes, samplesRes, leadsActivityRes]
          .find((r) => r.error);
        if (err) throw new Error(err.error.message);

        if (cancelled) return;

        const residents = residentsRes.data || [];
        const collections = collectionsRes.data || [];
        const orders = ordersRes.data || [];
        const welcomeBoxes = welcomeRes.data || [];
        const designSamples = samplesRes.data || [];
        const leadsActivity = leadsActivityRes.data || [];

        const pendingStatuses = ['new', 'processing', 'packed'];
        const summary = {
          totalLeads: residents.length,
          totalCollections: collections.length,
          totalOrders: orders.length,
          pendingOrders: orders.filter((o) => pendingStatuses.includes(o.status)).length,
          shippedOrders: orders.filter((o) => o.status === 'shipped').length,
          deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
        };

        const topLeads = leadsActivity
          .map((r) => ({
            name: `${r.first_name} ${r.last_name}`,
            email: r.email,
            communityId: r.community_id,
            collections: (r.collections || []).length,
            welcomeBoxes: (r.welcome_boxes || []).length,
            designSamples: (r.design_samples || []).length,
            total: (r.collections || []).length + (r.welcome_boxes || []).length + (r.design_samples || []).length,
          }))
          .filter((r) => r.total > 0)
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        const recentOrders = [...orders]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10)
          .map((o) => ({
            id: o.id,
            type: o.type,
            status: o.status,
            carrier: o.carrier,
            createdAt: o.created_at,
          }));

        setData({
          loading: false,
          error: null,
          summary,
          leadsOverTime: bucketByMonth(residents),
          ordersByStatus: countByField(orders, 'status'),
          ordersByType: countByField(orders, 'type'),
          activityOverTime: buildActivityTimeline(collections, welcomeBoxes, designSamples),
          topLeads,
          recentOrders,
          shippingSummary: buildShippingSummary(orders),
        });
      } catch (e) {
        if (!cancelled) {
          setData((prev) => ({ ...prev, loading: false, error: e.message }));
        }
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [activeCommunityId, dateRange.start, dateRange.end]);

  return data;
}

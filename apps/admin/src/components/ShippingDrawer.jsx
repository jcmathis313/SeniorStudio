import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toSnakeCase, transformOrder } from '../lib/transformOrder';
import StatusBadge from './StatusBadge';

const SAMPLE_STATUS_LABELS = {
  available: 'Available',
  out_of_stock: 'Out of Stock',
  not_available: 'Not Available',
  not_sampled: 'Not Sampled',
};

const SAMPLE_STATUS_COLORS = {
  available: { bg: '#d1fae5', color: '#059669' },
  out_of_stock: { bg: '#fef3c7', color: '#d97706' },
  not_available: { bg: '#fee2e2', color: '#dc2626' },
  not_sampled: { bg: '#f3f4f6', color: '#6b7280' },
};

const TYPE_LABELS = {
  sample_request: 'Sample Request',
  literature: 'Literature',
  spec_sheet: 'Spec Sheet',
  other: 'Other',
};

const CARRIER_OPTIONS = [
  { value: '', label: 'Select carrier...' },
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'usps', label: 'USPS' },
  { value: 'hand_delivery', label: 'Hand Delivery' },
  { value: 'other', label: 'Other' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });
}

function formatOrderId(id) {
  return '#' + (id || '').substring(0, 8);
}

export default function ShippingDrawer({ order, onUpdate, onClose }) {
  const [editingShipTo, setEditingShipTo] = useState(false);
  const [shipToForm, setShipToForm] = useState(order.shipTo || {});
  const [editingItems, setEditingItems] = useState(false);
  const [itemsForm, setItemsForm] = useState(order.items || []);
  const [newNote, setNewNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [carrier, setCarrier] = useState(order.carrier || '');
  const [serviceLevel, setServiceLevel] = useState(order.serviceLevel || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditingShipTo(false);
    setShipToForm(order.shipTo || {});
    setEditingItems(false);
    setItemsForm(order.items || []);
    setNewNote('');
    setTrackingNumber(order.trackingNumber || '');
    setCarrier(order.carrier || '');
    setServiceLevel(order.serviceLevel || '');
    setSaving(false);
  }, [order.id]);

  async function updateOrder(fields, historyEntry) {
    setSaving(true);
    const currentHistory = order.history || [];
    const newHistory = historyEntry
      ? [...currentHistory, { ...historyEntry, timestamp: new Date().toISOString() }]
      : currentHistory;

    const snakeFields = toSnakeCase(fields);
    const { data, error } = await supabase
      .from('shipping_orders')
      .update({ ...snakeFields, history: newHistory })
      .eq('id', order.id)
      .select()
      .single();

    if (error) {
      console.error('Update failed:', error.message);
      setSaving(false);
      return;
    }

    onUpdate(transformOrder(data));
    setSaving(false);
  }

  async function transitionStatus(newStatus) {
    const extraFields = {};
    if (newStatus === 'shipped') {
      extraFields.shippedAt = new Date().toISOString();
      extraFields.trackingNumber = trackingNumber;
      extraFields.carrier = carrier || null;
      extraFields.serviceLevel = serviceLevel || null;
    }
    if (newStatus === 'delivered') {
      extraFields.deliveredAt = new Date().toISOString();
    }

    await updateOrder(
      { status: newStatus, ...extraFields },
      {
        action: 'status_change',
        from_status: order.status,
        to_status: newStatus,
        user: 'admin',
      }
    );
  }

  async function saveShipTo() {
    await updateOrder(
      { shipTo: shipToForm },
      { action: 'edit', user: 'admin', detail: 'Updated shipping address' }
    );
    setEditingShipTo(false);
  }

  async function saveItems() {
    await updateOrder(
      { items: itemsForm },
      { action: 'edit', user: 'admin', detail: 'Updated items' }
    );
    setEditingItems(false);
  }

  async function saveShippingDetails() {
    await updateOrder(
      { carrier: carrier || null, serviceLevel: serviceLevel || null, trackingNumber: trackingNumber || null },
      { action: 'edit', user: 'admin', detail: 'Updated shipping details' }
    );
  }

  async function addNote() {
    if (!newNote.trim()) return;
    const updatedNotes = [
      ...(order.internalNotes || []),
      { text: newNote.trim(), author: 'admin', created_at: new Date().toISOString() },
    ];
    await updateOrder(
      { internalNotes: updatedNotes },
      { action: 'note_added', user: 'admin', detail: newNote.trim().substring(0, 50) }
    );
    setNewNote('');
  }

  function updateShipToField(field, value) {
    setShipToForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateItemField(index, field, value) {
    setItemsForm((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setItemsForm((prev) => [...prev, { sku: '', name: '', qty: 1, notes: '' }]);
  }

  function removeItem(index) {
    setItemsForm((prev) => prev.filter((_, i) => i !== index));
  }

  function printPackingSlip() {
    const r = order.requester || {};
    const s = order.shipTo || {};
    const items = order.items || [];

    const shipToLines = [
      s.name,
      s.company,
      s.street1,
      s.street2,
      [s.city, s.state].filter(Boolean).join(', ') + (s.zip ? ' ' + s.zip : ''),
      s.country && s.country !== 'US' ? s.country : null,
    ].filter(Boolean);

    const itemRows = items.map((item) => {
      const ss = SAMPLE_STATUS_LABELS[item.sampleStatus];
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;color:#6b7280;">${item.sku || ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;">${item.name || ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.qty || 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${ss || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;">${item.notes || ''}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><title>Packing Slip ${formatOrderId(order.id)}</title>
<style>
  @page { size: letter; margin: 0.75in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #1d1d1f; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #1d1d1f; margin-bottom: 24px; }
  .header h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
  .header .meta { text-align: right; font-size: 12px; color: #6b7280; }
  .header .order-id { font-size: 16px; font-weight: 600; color: #1d1d1f; }
  .sections { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
  .section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px; }
  .section-value { font-size: 14px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
  .items-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 12px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
  .checkbox-row { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .checkbox-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; }
  .checkbox-item .box { width: 16px; height: 16px; border: 1.5px solid #9ca3af; border-radius: 3px; flex-shrink: 0; }
</style>
</head><body>
  <div class="header">
    <div>
      <h1>Packing Slip</h1>
    </div>
    <div class="meta">
      <div class="order-id">${formatOrderId(order.id)}</div>
      <div>${TYPE_LABELS[order.type] || order.type}</div>
      <div>${formatDate(order.createdAt)}</div>
    </div>
  </div>
  <div class="sections">
    <div>
      <div class="section-label">Requester</div>
      <div class="section-value">
        <strong>${r.name || '—'}</strong><br>
        ${r.organization || ''}${r.email ? '<br>' + r.email : ''}${r.phone ? '<br>' + r.phone : ''}
      </div>
    </div>
    <div>
      <div class="section-label">Ship To</div>
      <div class="section-value">${shipToLines.length ? shipToLines.join('<br>') : '—'}</div>
    </div>
  </div>
  <div class="items-label">Items (${items.length})</div>
  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Item</th>
        <th style="text-align:center;">Qty</th>
        <th>Sample</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="checkbox-row">
    <div class="checkbox-item"><span class="box"></span> Items verified</div>
    <div class="checkbox-item"><span class="box"></span> Packed</div>
    <div class="checkbox-item"><span class="box"></span> Label attached</div>
  </div>
  <div class="footer">
    <span>SeniorStudio — Packing Slip</span>
    <span>Printed ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
  </div>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.print(); };
  }

  const req = order.requester || {};
  const shipTo = order.shipTo || {};
  const isNew = order.status === 'new';

  return (
    <>
      <div className="drawer-header">
        <div className="drawer-header-left">
          <span className="order-id" style={{ fontSize: 14 }}>{formatOrderId(order.id)}</span>
          <span className={`type-label type-label--${order.type}`}>
            {TYPE_LABELS[order.type] || order.type}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <div className="drawer-header-right">
          {isNew && (
            <>
              <button className="btn-primary" disabled={saving} onClick={() => transitionStatus('processing')}>
                Accept
              </button>
              <button className="btn-danger" disabled={saving} onClick={() => transitionStatus('cancelled')}>
                Reject
              </button>
            </>
          )}
          {order.status === 'processing' && (
            <button className="btn-primary" disabled={saving} onClick={() => transitionStatus('packed')}>
              Mark Packed
            </button>
          )}
          {order.status === 'packed' && (
            <button
              className="btn-primary"
              disabled={saving || !trackingNumber.trim()}
              onClick={() => transitionStatus('shipped')}
              title={!trackingNumber.trim() ? 'Enter a tracking number first' : ''}
            >
              Mark Shipped
            </button>
          )}
          {order.status === 'shipped' && (
            <button className="btn-primary" disabled={saving} onClick={() => transitionStatus('delivered')}>
              Mark Delivered
            </button>
          )}
          <button className="btn-secondary btn-sm" onClick={printPackingSlip}>Print Slip</button>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="drawer-body">
        {/* Requester */}
        <div className="drawer-section">
          <div className="drawer-section-title">Requester</div>
          <div className="detail-row">
            <div className="detail-item">
              <div className="detail-label">Name</div>
              <div className="detail-value">{req.name || '—'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Organization</div>
              <div className="detail-value">{req.organization || '—'}</div>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-item">
              <div className="detail-label">Email</div>
              <div className="detail-value">
                {req.email ? <a href={`mailto:${req.email}`}>{req.email}</a> : '—'}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Phone</div>
              <div className="detail-value">
                {req.phone ? <a href={`tel:${req.phone}`}>{req.phone}</a> : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Ship To */}
        <div className="drawer-section">
          <div className="drawer-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Ship To
            {!editingShipTo && (
              <button className="btn-secondary btn-sm" onClick={() => setEditingShipTo(true)}>Edit</button>
            )}
          </div>
          {editingShipTo ? (
            <>
              <div className="drawer-field">
                <label className="drawer-label">Name</label>
                <input className="drawer-input" value={shipToForm.name || ''} onChange={(e) => updateShipToField('name', e.target.value)} />
              </div>
              <div className="drawer-field">
                <label className="drawer-label">Company</label>
                <input className="drawer-input" value={shipToForm.company || ''} onChange={(e) => updateShipToField('company', e.target.value)} />
              </div>
              <div className="drawer-field">
                <label className="drawer-label">Street 1</label>
                <input className="drawer-input" value={shipToForm.street1 || ''} onChange={(e) => updateShipToField('street1', e.target.value)} />
              </div>
              <div className="drawer-field">
                <label className="drawer-label">Street 2</label>
                <input className="drawer-input" value={shipToForm.street2 || ''} onChange={(e) => updateShipToField('street2', e.target.value)} />
              </div>
              <div className="drawer-row">
                <div className="drawer-field">
                  <label className="drawer-label">City</label>
                  <input className="drawer-input" value={shipToForm.city || ''} onChange={(e) => updateShipToField('city', e.target.value)} />
                </div>
                <div className="drawer-field">
                  <label className="drawer-label">State</label>
                  <input className="drawer-input" value={shipToForm.state || ''} onChange={(e) => updateShipToField('state', e.target.value)} />
                </div>
              </div>
              <div className="drawer-row">
                <div className="drawer-field">
                  <label className="drawer-label">ZIP</label>
                  <input className="drawer-input" value={shipToForm.zip || ''} onChange={(e) => updateShipToField('zip', e.target.value)} />
                </div>
                <div className="drawer-field">
                  <label className="drawer-label">Country</label>
                  <input className="drawer-input" value={shipToForm.country || ''} onChange={(e) => updateShipToField('country', e.target.value)} />
                </div>
              </div>
              <div className="drawer-actions">
                <button className="btn-primary btn-sm" disabled={saving} onClick={saveShipTo}>Save</button>
                <button className="btn-secondary btn-sm" onClick={() => { setEditingShipTo(false); setShipToForm(order.shipTo || {}); }}>Cancel</button>
              </div>
            </>
          ) : (
            <div className="address-block">
              {shipTo.name && <div>{shipTo.name}</div>}
              {shipTo.company && <div>{shipTo.company}</div>}
              {shipTo.street1 && <div>{shipTo.street1}</div>}
              {shipTo.street2 && <div>{shipTo.street2}</div>}
              {(shipTo.city || shipTo.state || shipTo.zip) && (
                <div>{[shipTo.city, shipTo.state].filter(Boolean).join(', ')} {shipTo.zip}</div>
              )}
              {shipTo.country && shipTo.country !== 'US' && <div>{shipTo.country}</div>}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="drawer-section">
          <div className="drawer-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Items ({(editingItems ? itemsForm : order.items || []).length})
            {!editingItems && (
              <button className="btn-secondary btn-sm" onClick={() => setEditingItems(true)}>Edit</button>
            )}
          </div>
          {editingItems ? (
            <>
              {itemsForm.map((item, i) => (
                <div className="edit-item-row" key={i}>
                  <input className="drawer-input" placeholder="SKU" value={item.sku} onChange={(e) => updateItemField(i, 'sku', e.target.value)} />
                  <input className="drawer-input" placeholder="Name" value={item.name} onChange={(e) => updateItemField(i, 'name', e.target.value)} />
                  <input className="drawer-input" type="number" min="1" placeholder="Qty" value={item.qty} onChange={(e) => updateItemField(i, 'qty', parseInt(e.target.value) || 1)} />
                  <select className="drawer-select" value={item.sampleStatus || ''} onChange={(e) => updateItemField(i, 'sampleStatus', e.target.value)}>
                    <option value="">No status</option>
                    {Object.entries(SAMPLE_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input className="drawer-input" placeholder="Notes" value={item.notes || ''} onChange={(e) => updateItemField(i, 'notes', e.target.value)} />
                  <button className="remove-item-btn" onClick={() => removeItem(i)} title="Remove">✕</button>
                </div>
              ))}
              <div className="drawer-actions">
                <button className="btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
                <button className="btn-primary btn-sm" disabled={saving} onClick={saveItems}>Save</button>
                <button className="btn-secondary btn-sm" onClick={() => { setEditingItems(false); setItemsForm(order.items || []); }}>Cancel</button>
              </div>
            </>
          ) : (
            <table className="items-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Sample</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, i) => {
                  const ss = SAMPLE_STATUS_COLORS[item.sampleStatus];
                  return (
                    <tr key={i}>
                      <td><span className="item-sku">{item.sku}</span></td>
                      <td>{item.name}</td>
                      <td>{item.qty}</td>
                      <td>
                        {item.sampleStatus && ss ? (
                          <span className="sample-status-badge" style={{ background: ss.bg, color: ss.color }}>
                            {SAMPLE_STATUS_LABELS[item.sampleStatus]}
                          </span>
                        ) : '—'}
                      </td>
                      <td>{item.notes ? <span className="item-notes">{item.notes}</span> : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Shipping Details */}
        <div className="drawer-section">
          <div className="drawer-section-title">Shipping Details</div>
          <div className="shipping-details-grid">
            <div className="shipping-detail-item">
              <div className="detail-label">Carrier</div>
              <select className="drawer-select" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                {CARRIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="shipping-detail-item">
              <div className="detail-label">Service Level</div>
              <input className="drawer-input" placeholder="e.g. Ground, 2Day, Priority" value={serviceLevel} onChange={(e) => setServiceLevel(e.target.value)} />
            </div>
            <div className="shipping-detail-item">
              <div className="detail-label">Tracking Number</div>
              <input className="drawer-input" placeholder="Enter tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
            </div>
            <div className="shipping-detail-item">
              <div className="detail-label">Estimated Delivery</div>
              <div className="detail-value">{formatDate(order.estimatedDelivery)}</div>
            </div>
          </div>
          {(carrier !== (order.carrier || '') || serviceLevel !== (order.serviceLevel || '') || trackingNumber !== (order.trackingNumber || '')) && (
            <div className="drawer-actions">
              <button className="btn-primary btn-sm" disabled={saving} onClick={saveShippingDetails}>Save Details</button>
            </div>
          )}
          <div className="detail-row" style={{ marginTop: 12 }}>
            <div className="detail-item">
              <div className="detail-label">Shipped At</div>
              <div className="detail-value">{formatDateTime(order.shippedAt)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Delivered At</div>
              <div className="detail-value">{formatDateTime(order.deliveredAt)}</div>
            </div>
          </div>
        </div>

        {/* Status & History */}
        <div className="drawer-section">
          <div className="drawer-section-title">Activity</div>
          {(order.history || []).length === 0 ? (
            <span className="text-muted">No activity recorded</span>
          ) : (
            <div className="timeline">
              {[...(order.history || [])].reverse().map((entry, i) => (
                <div className={`timeline-item timeline-item--${entry.action}`} key={i}>
                  <div className="timeline-item__action">
                    {entry.action === 'status_change'
                      ? `${entry.from_status} → ${entry.to_status}`
                      : entry.action === 'created'
                        ? 'Order created'
                        : entry.action === 'note_added'
                          ? 'Note added'
                          : entry.action === 'edit'
                            ? 'Order edited'
                            : entry.action}
                  </div>
                  {entry.detail && <div className="timeline-item__detail">{entry.detail}</div>}
                  <div className="timeline-item__time">
                    {entry.user && `${entry.user} · `}{formatDateTime(entry.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Internal Notes */}
        <div className="drawer-section">
          <div className="drawer-section-title">Internal Notes</div>
          {(order.internalNotes || []).length > 0 && (
            <div className="notes-list">
              {(order.internalNotes || []).map((note, i) => (
                <div className="note-item" key={i}>
                  <div className="note-item__text">{note.text}</div>
                  <div className="note-item__meta">
                    {note.author} · {formatDateTime(note.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="note-form">
            <textarea
              className="drawer-textarea"
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button className="btn-primary" disabled={saving || !newNote.trim()} onClick={addNote}>
              Add
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const TYPE_LABELS = {
  sample_request: 'Sample Request',
  literature: 'Literature',
  spec_sheet: 'Spec Sheet',
  other: 'Other',
};

const SAMPLE_STATUS_LABELS = {
  available: 'Available',
  out_of_stock: 'Out of Stock',
  not_available: 'Not Available',
  not_sampled: 'Not Sampled',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatOrderId(id) {
  return '#' + (id || '').substring(0, 8);
}

function buildSlipHtml(order) {
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

  return `<div class="slip">
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
</div>`;
}

const PAGE_STYLES = `
  @page { size: letter; margin: 0.75in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #1d1d1f; line-height: 1.5; }
  .slip { page-break-after: always; }
  .slip:last-child { page-break-after: avoid; }
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
`;

export function printPackingSlip(order) {
  const html = `<!DOCTYPE html>
<html><head><title>Packing Slip ${formatOrderId(order.id)}</title>
<style>${PAGE_STYLES}</style>
</head><body>${buildSlipHtml(order)}</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.print(); };
}

export function printPackingSlips(orders) {
  const slips = orders.map(buildSlipHtml).join('\n');
  const html = `<!DOCTYPE html>
<html><head><title>Packing Slips (${orders.length})</title>
<style>${PAGE_STYLES}</style>
</head><body>${slips}</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.print(); };
}

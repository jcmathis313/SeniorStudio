import { getBoardByRoom, getSelectedFloorPlan } from './board.js';
import { getCommunity } from './auth.js';
import { getSettings, getFloorPlans } from './settings.js';

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function imgFormat(dataUrl) {
  if (!dataUrl) return null;
  if (dataUrl.includes('image/png')) return 'PNG';
  return 'JPEG';
}

function getImageDims(dataUrl, maxH) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      const h = Math.min(maxH, 15);
      resolve({ w: h * ratio, h });
    };
    img.onerror = () => resolve({ w: 30, h: 15 });
    img.src = dataUrl;
  });
}

function hexToRgb(hex) {
  if (!hex || hex.length < 7) return [50, 50, 50];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

async function generateQRDataUrl(text) {
  try {
    const QRCode = await import('qrcode');
    return await QRCode.toDataURL(text, {
      width: 128,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch {
    return null;
  }
}

export async function exportBoardPDF(collectionData) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const community = getCommunity();
  const settings = getSettings();
  const selectedFpId = getSelectedFloorPlan();
  const plans = getFloorPlans();
  const selectedPlan = selectedFpId ? plans.find(fp => fp.id === selectedFpId) : null;

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;
  const accentRgb = hexToRgb(settings.primaryColor);

  let y = 15;

  // ── HEADER: logo + community info (left), doc info table + QR (right) ──

  const headerStartY = y;

  // Logo + community name (left side)
  let leftY = y;
  if (settings.logo) {
    try {
      const dims = await getImageDims(settings.logo, 15);
      doc.addImage(settings.logo, imgFormat(settings.logo), marginL, leftY, dims.w, dims.h);
      leftY += dims.h + 3;
    } catch { /* skip */ }
  }

  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0);
  if (community) {
    doc.text(community.name, marginL, leftY + 5);
    leftY += 7;
    if (community.location) {
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text(community.location, marginL, leftY + 4);
      leftY += 6;
    }
  }

  // Doc info table + QR code (right side)
  const qrSize = 21;
  const qrDataUrl = await generateQRDataUrl(collectionData.id || 'unknown');
  const infoTableW = 70;
  const qrGap = 3;
  const rightBlockW = infoTableW + qrGap + qrSize;
  const rightBlockX = pageW - marginR - rightBlockW;

  // Doc info table (left)
  const infoTableX = rightBlockX;
  const infoRowH = 7;
  const infoLabelW = 28;
  const infoValW = infoTableW - infoLabelW;

  const dateStr = new Date(collectionData.savedAt || Date.now()).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const infoRows = [
    ['Collection #', collectionData.id || '—'],
    ['Date', dateStr],
    ['Floor Plan', selectedPlan ? selectedPlan.name : 'None'],
  ];

  doc.setDrawColor(180);
  doc.setLineWidth(0.3);

  for (let i = 0; i < infoRows.length; i++) {
    const rowY = headerStartY + i * infoRowH;
    doc.setFillColor(240, 240, 240);
    doc.rect(infoTableX, rowY, infoLabelW, infoRowH, 'FD');
    doc.setFillColor(255, 255, 255);
    doc.rect(infoTableX + infoLabelW, rowY, infoValW, infoRowH, 'FD');

    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(60);
    doc.text(infoRows[i][0], infoTableX + 2, rowY + 4.8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(30);
    const valText = infoRows[i][1];
    const maxValW = infoValW - 4;
    const truncated = doc.getTextWidth(valText) > maxValW
      ? valText.substring(0, 20) + '...'
      : valText;
    doc.text(truncated, infoTableX + infoLabelW + 2, rowY + 4.8);
  }

  // QR code (right of info table)
  if (qrDataUrl) {
    const qrX = infoTableX + infoTableW + qrGap;
    doc.addImage(qrDataUrl, 'PNG', qrX, headerStartY, qrSize, qrSize);
  }

  const rightBlockBottom = headerStartY + Math.max(qrSize, infoRows.length * infoRowH);
  y = Math.max(leftY + 8, rightBlockBottom + 4);

  // Thin separator
  doc.setDrawColor(200);
  doc.setLineWidth(0.2);
  doc.line(marginL, y, pageW - marginR, y);
  y += 5;

  // ── INFO BOXES: Prepared For (left) + Floor Plan (right) ──

  const boxW = (contentW - 4) / 2;
  const boxPad = 3;
  const boxHeaderH = 6;
  const boxBodyH = 20;
  const boxH = boxHeaderH + boxBodyH;

  // Prepared For box
  const box1X = marginL;
  doc.setFillColor(240, 240, 240);
  doc.rect(box1X, y, boxW, boxHeaderH, 'F');
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.rect(box1X, y, boxW, boxH, 'S');
  doc.line(box1X, y + boxHeaderH, box1X + boxW, y + boxHeaderH);

  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(80);
  doc.text('PREPARED FOR', box1X + boxPad, y + 4.2);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30);
  let infoY = y + boxHeaderH + 4;
  const fullName = [collectionData.firstName, collectionData.lastName].filter(Boolean).join(' ');
  if (fullName) { doc.text(fullName, box1X + boxPad, infoY); infoY += 4.5; }
  if (collectionData.email) {
    doc.setTextColor(80);
    doc.text(collectionData.email, box1X + boxPad, infoY);
    infoY += 4.5;
  }
  if (collectionData.phone) {
    doc.setTextColor(80);
    doc.text(collectionData.phone, box1X + boxPad, infoY);
  }

  // Floor Plan box
  const box2X = marginL + boxW + 4;
  doc.setFillColor(240, 240, 240);
  doc.rect(box2X, y, boxW, boxHeaderH, 'F');
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.rect(box2X, y, boxW, boxH, 'S');
  doc.line(box2X, y + boxHeaderH, box2X + boxW, y + boxHeaderH);

  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(80);
  doc.text('FLOOR PLAN', box2X + boxPad, y + 4.2);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30);
  let fpY = y + boxHeaderH + 4;
  if (selectedPlan) {
    doc.text(selectedPlan.name, box2X + boxPad, fpY);
    fpY += 4.5;
    doc.setTextColor(80);
    const totalSqft = selectedPlan.rooms.reduce((sum, r) => sum + (r.sqft || 0), 0);
    doc.text(`${selectedPlan.rooms.length} rooms — ${totalSqft.toLocaleString()} sqft`, box2X + boxPad, fpY);
    fpY += 4.5;
    const roomNames = selectedPlan.rooms.map(r => r.name).join(', ');
    const maxRoomW = boxW - boxPad * 2;
    const roomLines = doc.splitTextToSize(roomNames, maxRoomW);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(roomLines[0] || '', box2X + boxPad, fpY);
  } else {
    doc.setTextColor(140);
    doc.text('No floor plan selected', box2X + boxPad, fpY);
  }

  y += boxH + 6;

  // ── ITEMS TABLE (grouped by room) ──

  const grouped = getBoardByRoom();
  const roomKeys = Object.keys(grouped);
  const tableBody = [];
  let lineNum = 0;
  let grandTotal = 0;

  for (const roomKey of roomKeys) {
    const { label, items } = grouped[roomKey];

    // Room separator row
    tableBody.push([{
      content: label.toUpperCase(),
      colSpan: 6,
      styles: {
        fontStyle: 'bold',
        fillColor: [235, 235, 235],
        textColor: [60, 60, 60],
        fontSize: 8,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      },
    }]);

    for (const item of items) {
      lineNum++;
      const cost = parseFloat(item.costPerUnit) || 0;
      let itemTotal = 0;

      // Look up room sqft from the item's own floor plan reference
      let roomSqft = 0;
      const fpId = item.floorPlanId || selectedFpId;
      const fp = fpId ? plans.find(f => f.id === fpId) : selectedPlan;
      if (fp) {
        const room = fp.rooms.find(r => r.id === (item.roomId || roomKey));
        if (room) roomSqft = room.sqft || 0;
      }

      if (item.costType === 'sqft' && roomSqft > 0 && cost > 0) {
        itemTotal = cost * roomSqft;
      } else if (item.costType === 'each' && cost > 0) {
        itemTotal = cost;
      }

      grandTotal += itemTotal;

      const meta = [item.brand, item.sku].filter(Boolean).join(' · ');
      const categoryText = item.categoryLabel || '—';
      const rateText = cost > 0
        ? (item.costType === 'sqft' ? `$${cost.toFixed(2)}/sqft` : `$${cost.toFixed(2)} each`)
        : '—';
      const totalText = itemTotal > 0 ? `$${fmt(itemTotal)}` : '—';

      tableBody.push([
        { content: String(lineNum), styles: { halign: 'center' } },
        categoryText,
        { content: '', _image: item.featureImage || null, _color: item.colors?.[0] || '#c8b89a' },
        { content: item.name, _meta: meta },
        { content: rateText, styles: { halign: 'right' } },
        { content: totalText, styles: { halign: 'right' } },
      ]);
    }
  }

  if (roomKeys.length === 0) {
    tableBody.push([{
      content: 'No materials selected yet.',
      colSpan: 6,
      styles: { halign: 'center', textColor: [160, 160, 160], fontStyle: 'italic', fontSize: 10, cellPadding: 8 },
    }]);
  }

  // Grand total row
  if (grandTotal > 0) {
    tableBody.push([
      { content: '', styles: { fillColor: [255, 255, 255] } },
      { content: '', styles: { fillColor: [255, 255, 255] } },
      { content: '', styles: { fillColor: [255, 255, 255] } },
      { content: '', styles: { fillColor: [255, 255, 255] } },
      {
        content: 'ESTIMATED TOTAL',
        styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 255, 255], fontSize: 9 },
      },
      {
        content: `$${fmt(grandTotal)}`,
        styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 255, 255], fontSize: 9 },
      },
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [['#', 'Category', '', 'Item', 'Unit Cost', 'Total']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: accentRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 },
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
      textColor: [30, 30, 30],
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 12 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
    },
    margin: { left: marginL, right: marginR },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 2 && data.cell.raw?._image !== undefined) {
        data.cell.styles.minCellHeight = 12;
        data.cell.styles.cellPadding = 1;
      }
      if (data.section === 'body' && data.column.index === 3 && data.cell.raw?._meta) {
        data.cell.styles.minCellHeight = 12;
      }
    },
    didDrawCell(data) {
      // Draw square image or color swatch
      if (data.section === 'body' && data.column.index === 2 && data.cell.raw?._image !== undefined) {
        const s = Math.min(data.cell.height - 2, data.cell.width - 2);
        const cx = data.cell.x + (data.cell.width - s) / 2;
        const cy = data.cell.y + (data.cell.height - s) / 2;
        if (data.cell.raw._image) {
          try {
            doc.addImage(data.cell.raw._image, imgFormat(data.cell.raw._image), cx, cy, s, s);
          } catch {
            const c = data.cell.raw._color;
            const r = parseInt(c.slice(1, 3), 16) || 200;
            const g = parseInt(c.slice(3, 5), 16) || 184;
            const b = parseInt(c.slice(5, 7), 16) || 154;
            doc.setFillColor(r, g, b);
            doc.rect(cx, cy, s, s, 'F');
          }
        } else {
          const c = data.cell.raw._color;
          const r = parseInt(c.slice(1, 3), 16) || 200;
          const g = parseInt(c.slice(3, 5), 16) || 184;
          const b = parseInt(c.slice(5, 7), 16) || 154;
          doc.setFillColor(r, g, b);
          doc.rect(cx, cy, s, s, 'F');
        }
      }
      // Draw brand/SKU meta line below item name
      if (data.section === 'body' && data.column.index === 3 && data.cell.raw?._meta) {
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(120);
        doc.text(data.cell.raw._meta, data.cell.x + 3, data.cell.y + data.cell.height - 1.5);
      }
    },
  });

  // ── FOOTER: page numbers + generated date ──

  const totalPages = doc.internal.getNumberOfPages();
  const genDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(160);
    doc.text(`Generated ${genDate} by SeniorStudio`, marginL, pageH - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageW - marginR, pageH - 8, { align: 'right' });
  }

  doc.save(`SeniorStudio-${collectionData.id || 'collection'}.pdf`);
}

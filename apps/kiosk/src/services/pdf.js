import { getBoardByCategory, getSelectedFloorPlan, getBoardItemRooms } from './board.js';
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

export async function exportBoardPDF() {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const community = getCommunity();
  const settings = getSettings();
  const grouped = getBoardByCategory();
  const selectedFpId = getSelectedFloorPlan();
  const plans = getFloorPlans();
  const selectedPlan = selectedFpId ? plans.find(fp => fp.id === selectedFpId) : null;

  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  // ── Header: left text, logo right ──
  if (settings.logo) {
    try {
      doc.addImage(settings.logo, imgFormat(settings.logo), pageW - marginR - 30, y - 5, 30, 15);
    } catch { /* skip if image fails */ }
  }

  doc.setFontSize(22);
  doc.setTextColor(0);
  doc.text('Renovation Selections', marginL, y + 5);
  y += 12;

  if (community) {
    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text(community.name, marginL, y);
    y += 6;
  }

  if (selectedPlan) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Floor Plan: ${selectedPlan.name}`, marginL, y);
    y += 5;
  }

  doc.setFontSize(8);
  doc.setTextColor(160);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, marginL, y);
  y += 8;

  doc.setDrawColor(200);
  doc.line(marginL, y, pageW - marginR, y);
  y += 8;

  // ── Items by category ──
  const categoryIds = Object.keys(grouped);
  let grandTotal = 0;

  for (const catId of categoryIds) {
    const { label, items } = grouped[catId];

    if (y > 245) { doc.addPage(); y = 20; }

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text(label.toUpperCase(), marginL, y);
    doc.setFont(undefined, 'normal');
    y += 7;

    for (const item of items) {
      const roomIds = selectedPlan ? getBoardItemRooms(item.sku, selectedFpId) : [];
      const cost = parseFloat(item.costPerUnit) || 0;
      const roomLines = [];
      let itemTotal = 0;

      for (const rId of roomIds) {
        const room = selectedPlan.rooms.find(r => r.id === rId);
        if (!room) continue;
        let roomCost = 0;
        if (item.costType === 'sqft' && room.sqft > 0 && cost > 0) {
          roomCost = cost * room.sqft;
        } else if (item.costType === 'each' && cost > 0) {
          roomCost = cost;
        }
        itemTotal += roomCost;
        roomLines.push({ name: room.name, sqft: room.sqft, cost: roomCost });
      }

      const hasSubtotal = cost > 0 && roomLines.length > 1;
      const estHeight = 14 + roomLines.length * 5 + (hasSubtotal ? 6 : 0) + (roomLines.length === 0 && cost > 0 ? 5 : 0);
      if (y + estHeight + 10 > 270) { doc.addPage(); y = 20; }

      const boxPad = 3;
      const boxTop = y - boxPad;
      const imgSize = 14;
      let imgDrawn = false;
      if (item.featureImage) {
        try {
          doc.addImage(item.featureImage, imgFormat(item.featureImage), marginL + boxPad, y, imgSize, imgSize);
          imgDrawn = true;
        } catch { /* skip */ }
      }
      if (!imgDrawn) {
        const c = item.colors?.[0] || '#c8b89a';
        const r = parseInt(c.slice(1, 3), 16) || 200;
        const g = parseInt(c.slice(3, 5), 16) || 184;
        const b = parseInt(c.slice(5, 7), 16) || 154;
        doc.setFillColor(r, g, b);
        doc.roundedRect(marginL + boxPad, y, imgSize, imgSize, 1.5, 1.5, 'F');
      }

      const textX = marginL + boxPad + imgSize + 4;

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0);
      doc.text(item.name, textX, y + 4);
      doc.setFont(undefined, 'normal');

      doc.setFontSize(8);
      doc.setTextColor(120);
      const meta = [item.brand, item.sku].filter(Boolean).join('  ·  ');
      doc.text(meta, textX, y + 9);

      let lineY = y + 14;

      if (roomLines.length > 0) {
        for (const rl of roomLines) {
          doc.setFontSize(8);
          doc.setTextColor(80);
          doc.text(rl.name, textX, lineY);
          if (rl.cost > 0) {
            doc.setTextColor(0);
            doc.text(`$${fmt(rl.cost)}`, pageW - marginR - boxPad, lineY, { align: 'right' });
          }
          lineY += 5;
        }
        if (hasSubtotal) {
          doc.setDrawColor(220);
          doc.setLineWidth(0.2);
          doc.line(textX, lineY - 3.5, pageW - marginR - boxPad, lineY - 3.5);
          doc.setFontSize(8);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0);
          doc.text('Subtotal', textX, lineY);
          doc.text(`$${fmt(itemTotal)}`, pageW - marginR - boxPad, lineY, { align: 'right' });
          doc.setFont(undefined, 'normal');
          lineY += 5;
        }
      } else if (cost > 0) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        const rateText = item.costType === 'sqft' ? `$${cost.toFixed(2)}/sqft` : `$${cost.toFixed(2)} each`;
        doc.text(rateText, textX, lineY);
        lineY += 5;
      }

      const boxBottom = lineY + boxPad;
      doc.setDrawColor(210);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginL - 2, boxTop, contentW + 4, boxBottom - boxTop, 1.5, 1.5, 'S');

      grandTotal += itemTotal;
      y = boxBottom + 5;
    }

    y += 4;
  }

  if (categoryIds.length === 0) {
    doc.setFontSize(14);
    doc.setTextColor(160);
    doc.text('No materials selected yet.', pageW / 2, y + 20, { align: 'center' });
  }

  // ── Grand total ──
  if (grandTotal > 0) {
    if (y > 255) { doc.addPage(); y = 20; }
    y += 4;
    doc.setDrawColor(200);
    doc.line(marginL, y, pageW - marginR, y);
    y += 8;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text('Estimated Total', marginL, y);
    doc.text(`$${fmt(grandTotal)}`, pageW - marginR, y, { align: 'right' });
    doc.setFont(undefined, 'normal');
  }

  doc.save(`SeniorStudio-Selections-${community?.id || 'draft'}.pdf`);
}

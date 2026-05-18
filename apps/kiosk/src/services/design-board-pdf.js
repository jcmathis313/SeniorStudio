import { getCommunity } from './auth.js';

function imgFormat(dataUrl) {
  if (!dataUrl) return null;
  if (dataUrl.includes('image/png')) return 'PNG';
  return 'JPEG';
}

// Fractional layout positions for each template (x, y, w, h as fractions of content area)
const LAYOUT_MAP = {
  'grid-3x3': [
    { x: 0, y: 0, w: 1/3, h: 1/3 },
    { x: 1/3, y: 0, w: 1/3, h: 1/3 },
    { x: 2/3, y: 0, w: 1/3, h: 1/3 },
    { x: 0, y: 1/3, w: 1/3, h: 1/3 },
    { x: 1/3, y: 1/3, w: 1/3, h: 1/3 },
    { x: 2/3, y: 1/3, w: 1/3, h: 1/3 },
    { x: 0, y: 2/3, w: 1/3, h: 1/3 },
    { x: 1/3, y: 2/3, w: 1/3, h: 1/3 },
    { x: 2/3, y: 2/3, w: 1/3, h: 1/3 },
  ],
  'feature-left': [
    { x: 0, y: 0, w: 2/3, h: 1 },
    { x: 2/3, y: 0, w: 1/3, h: 1/3 },
    { x: 2/3, y: 1/3, w: 1/3, h: 1/3 },
    { x: 2/3, y: 2/3, w: 1/3, h: 1/3 },
  ],
  'top-heavy': [
    { x: 0, y: 0, w: 1, h: 2/3 },
    { x: 0, y: 2/3, w: 1/3, h: 1/3 },
    { x: 1/3, y: 2/3, w: 1/3, h: 1/3 },
    { x: 2/3, y: 2/3, w: 1/3, h: 1/3 },
  ],
  'hero-center': [
    { x: 0, y: 0, w: 1/4, h: 1/2 },
    { x: 1/4, y: 0, w: 1/2, h: 1/2 },
    { x: 3/4, y: 0, w: 1/4, h: 1/2 },
    { x: 0, y: 1/2, w: 1/2, h: 1/2 },
    { x: 1/2, y: 1/2, w: 1/2, h: 1/2 },
  ],
};

export async function exportDesignBoardPDF(template, slotItems) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const community = getCommunity();

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const headerH = 18;
  const gap = 3;

  // Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0);
  doc.text(template.name + ' — Design Board', margin, margin + 6);
  doc.setFont(undefined, 'normal');

  doc.setFontSize(9);
  doc.setTextColor(120);
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const headerRight = community ? `${community.name}  ·  ${dateStr}` : dateStr;
  doc.text(headerRight, pageW - margin, margin + 6, { align: 'right' });

  // Content area
  const contentX = margin;
  const contentY = margin + headerH;
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin - contentY;

  const layout = LAYOUT_MAP[template.id];
  if (!layout) return;

  for (let i = 0; i < layout.length; i++) {
    const pos = layout[i];
    const item = slotItems[i];

    const slotX = contentX + pos.x * contentW + gap / 2;
    const slotY = contentY + pos.y * contentH + gap / 2;
    const slotW = pos.w * contentW - gap;
    const slotH = pos.h * contentH - gap;

    if (item) {
      // Draw swatch image or color
      if (item.featureImage) {
        try {
          doc.addImage(item.featureImage, imgFormat(item.featureImage), slotX, slotY, slotW, slotH);
        } catch {
          drawColorRect(doc, item, slotX, slotY, slotW, slotH);
        }
      } else {
        drawColorRect(doc, item, slotX, slotY, slotW, slotH);
      }

      // Label background
      const labelH = 10;
      doc.setFillColor(0, 0, 0);
      doc.setGState(new doc.GState({ opacity: 0.6 }));
      doc.rect(slotX, slotY + slotH - labelH, slotW, labelH, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));

      // Label text
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(item.name, slotX + 3, slotY + slotH - labelH + 4);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      doc.text(item.brand || '', slotX + 3, slotY + slotH - labelH + 8);
    } else {
      // Empty slot
      doc.setDrawColor(180);
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([2, 2], 0);
      doc.rect(slotX, slotY, slotW, slotH, 'S');
      doc.setLineDashPattern([], 0);

      doc.setFontSize(9);
      doc.setTextColor(180);
      doc.text('Empty', slotX + slotW / 2, slotY + slotH / 2, { align: 'center', baseline: 'middle' });
    }
  }

  doc.save(`SeniorStudio-DesignBoard-${template.id}.pdf`);
}

function drawColorRect(doc, item, x, y, w, h) {
  const c = item.colors?.[0] || '#c8b89a';
  const r = parseInt(c.slice(1, 3), 16) || 200;
  const g = parseInt(c.slice(3, 5), 16) || 184;
  const b = parseInt(c.slice(5, 7), 16) || 154;
  doc.setFillColor(r, g, b);
  doc.rect(x, y, w, h, 'F');
}

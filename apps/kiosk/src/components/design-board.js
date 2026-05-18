import { getBoardItems } from '../services/board.js';
import { exportDesignBoardPDF } from '../services/design-board-pdf.js';

const TEMPLATES = [
  {
    id: 'grid-3x3',
    name: '3×3 Grid',
    slots: 9,
    gridTemplate: 'repeat(3, 1fr) / repeat(3, 1fr)',
    slotAreas: null,
  },
  {
    id: 'feature-left',
    name: 'Feature Left',
    slots: 4,
    gridTemplate: "'a b' 'a c' 'a d' / 2fr 1fr",
    slotAreas: ['a', 'b', 'c', 'd'],
  },
  {
    id: 'top-heavy',
    name: 'Top Feature',
    slots: 4,
    gridTemplate: "'a a a' 'b c d' / 1fr 1fr 1fr",
    slotAreas: ['a', 'b', 'c', 'd'],
  },
  {
    id: 'hero-center',
    name: 'Hero Center',
    slots: 5,
    gridTemplate: "'a b b c' 'a b b c' 'd d e e' / 1fr 1fr 1fr 1fr",
    slotAreas: ['a', 'b', 'c', 'd', 'e'],
  },
];

let overlayEl = null;
let currentTemplate = null;

export function mountDesignBoard(parent) {
  overlayEl = document.createElement('div');
  overlayEl.className = 'design-board-overlay';
  overlayEl.id = 'designBoardOverlay';
  parent.appendChild(overlayEl);
}

export function openDesignBoard() {
  if (!overlayEl) return;
  currentTemplate = null;
  renderPicker();
  overlayEl.classList.add('open');
}

export function closeDesignBoard() {
  if (!overlayEl) return;
  overlayEl.classList.remove('open');
  currentTemplate = null;
}

function renderPicker() {
  overlayEl.innerHTML = `
    <div class="design-board-picker">
      <div class="design-board-picker-header">
        <h2 class="design-board-picker-title">Choose a Layout</h2>
        <button class="design-board-close-btn" id="dbPickerClose">✕</button>
      </div>
      <div class="design-board-picker-grid" id="dbPickerGrid"></div>
    </div>
  `;

  const grid = overlayEl.querySelector('#dbPickerGrid');

  for (const tpl of TEMPLATES) {
    const item = document.createElement('div');
    item.className = 'design-board-picker-item';
    item.innerHTML = `
      <div class="design-board-picker-preview" style="grid-template: ${tpl.gridTemplate}">
        ${buildPreviewSlots(tpl)}
      </div>
      <div class="design-board-picker-label">${tpl.name}</div>
    `;
    item.addEventListener('click', () => selectTemplate(tpl));
    grid.appendChild(item);
  }

  overlayEl.querySelector('#dbPickerClose').addEventListener('click', closeDesignBoard);
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) closeDesignBoard();
  });
}

function buildPreviewSlots(tpl) {
  const colors = ['#A8D8EA', '#AA96DA', '#FCBAD3', '#FFFFD2', '#B5EAD7', '#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB'];
  if (tpl.slotAreas) {
    return tpl.slotAreas.map((area, i) =>
      `<div class="design-board-preview-slot" style="grid-area:${area};background:${colors[i % colors.length]}"></div>`
    ).join('');
  }
  return Array.from({ length: tpl.slots }, (_, i) =>
    `<div class="design-board-preview-slot" style="background:${colors[i % colors.length]}"></div>`
  ).join('');
}

function selectTemplate(tpl) {
  currentTemplate = tpl;
  renderBoard();
}

function renderBoard() {
  const items = getBoardItems();

  overlayEl.innerHTML = `
    <div class="design-board-view">
      <div class="design-board-header">
        <button class="btn btn-secondary design-board-back-btn" id="dbBack">Back</button>
        <h2 class="design-board-title">${currentTemplate.name}</h2>
        <button class="btn btn-primary design-board-export-btn" id="dbExport">Export PDF</button>
      </div>
      <div class="design-board-grid" id="dbGrid" style="grid-template: ${currentTemplate.gridTemplate}"></div>
    </div>
  `;

  const grid = overlayEl.querySelector('#dbGrid');

  const slotCount = currentTemplate.slotAreas ? currentTemplate.slotAreas.length : currentTemplate.slots;

  for (let i = 0; i < slotCount; i++) {
    const slot = document.createElement('div');
    const item = items[i] || null;
    const area = currentTemplate.slotAreas ? currentTemplate.slotAreas[i] : null;

    if (area) slot.style.gridArea = area;

    if (item) {
      slot.className = 'design-board-slot filled';

      if (item.featureImage) {
        const img = document.createElement('img');
        img.src = item.featureImage;
        img.alt = item.name;
        slot.appendChild(img);
      } else {
        slot.style.backgroundColor = item.colors?.[0] || '#c8b89a';
      }

      const label = document.createElement('div');
      label.className = 'design-board-slot-label';
      label.innerHTML = `<span class="slot-name">${item.name}</span><span class="slot-brand">${item.brand}</span>`;
      slot.appendChild(label);
    } else {
      slot.className = 'design-board-slot empty';
      slot.innerHTML = `<div class="design-board-slot-placeholder">Empty</div>`;
    }

    grid.appendChild(slot);
  }

  overlayEl.querySelector('#dbBack').addEventListener('click', renderPicker);
  overlayEl.querySelector('#dbExport').addEventListener('click', () => {
    const slotItems = [];
    for (let i = 0; i < slotCount; i++) {
      slotItems.push(items[i] || null);
    }
    exportDesignBoardPDF(currentTemplate, slotItems);
  });
}

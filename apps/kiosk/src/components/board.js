import { getBoardByCategory, getBoardCount, removeFromBoard, toggleBoardItemRoom, getBoardItemRooms, clearBoard, onBoardChange, getSelectedFloorPlan, setSelectedFloorPlan } from '../services/board.js';
import { exportBoardPDF } from '../services/pdf.js';
import { getFloorPlans, onSettingsChange } from '../services/settings.js';

let panelEl = null;
let onSaveCollectionCb = null;

export function mountBoard(parent, { onSaveCollection } = {}) {
  onSaveCollectionCb = onSaveCollection || null;
  panelEl = document.createElement('aside');
  panelEl.className = 'board-panel';
  panelEl.id = 'boardPanel';
  panelEl.innerHTML = `
    <div class="board-header">
      <div class="board-header-top">
        <div>
          <div class="board-title">My Collection</div>
          <div class="board-subtitle" id="boardSubtitle">0 selections</div>
        </div>
        <select class="board-fp-select" id="boardFpSelect">
          <option value="">No Floor Plan</option>
        </select>
      </div>
    </div>
    <div class="board-body" id="boardBody"></div>
    <div class="board-footer" id="boardFooter">
      <button class="btn btn-primary" id="btnExportPDF">Export PDF</button>
      <button class="btn btn-primary btn-save-collection" id="btnSaveCollection">Save Collection</button>
      <button class="btn btn-secondary btn-request-samples" id="btnRequestSamples">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px;flex-shrink:0;"><rect x="1" y="6" width="22" height="15" rx="2" ry="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
        Request Samples
      </button>
      <button class="btn btn-secondary" id="btnClearBoard">Clear Collection</button>
    </div>
  `;

  panelEl.querySelector('#btnExportPDF').addEventListener('click', exportBoardPDF);
  panelEl.querySelector('#btnSaveCollection').addEventListener('click', () => {
    if (getBoardCount() === 0) return;
    onSaveCollectionCb?.();
  });
  panelEl.querySelector('#btnRequestSamples').addEventListener('click', () => {
    // Placeholder — no action yet
  });
  panelEl.querySelector('#btnClearBoard').addEventListener('click', () => {
    if (getBoardCount() === 0) return;
    showClearConfirm();
  });
  panelEl.querySelector('#boardFpSelect').addEventListener('change', (e) => {
    setSelectedFloorPlan(e.target.value);
  });

  parent.appendChild(panelEl);

  onBoardChange(renderBoardContents);
  onSettingsChange(renderBoardContents);
  renderBoardContents();
}

export function toggleBoard() {
  if (!panelEl) return;
  const isOpen = panelEl.classList.toggle('open');
  document.querySelector('.content')?.classList.toggle('board-open', isOpen);
}

export function isBoardOpen() {
  return panelEl?.classList.contains('open') ?? false;
}

function renderBoardContents() {
  if (!panelEl) return;
  const body = panelEl.querySelector('#boardBody');
  const subtitle = panelEl.querySelector('#boardSubtitle');
  const fpSelect = panelEl.querySelector('#boardFpSelect');
  const count = getBoardCount();
  subtitle.textContent = `${count} selection${count !== 1 ? 's' : ''}`;

  const plans = getFloorPlans();
  const selectedFpId = getSelectedFloorPlan();
  fpSelect.innerHTML = `<option value="">No Floor Plan</option>` +
    plans.map(fp => `<option value="${fp.id}" ${fp.id === selectedFpId ? 'selected' : ''}>${fp.name}</option>`).join('');

  const selectedPlan = selectedFpId ? plans.find(fp => fp.id === selectedFpId) : null;

  const grouped = getBoardByCategory();
  const catIds = Object.keys(grouped);

  if (catIds.length === 0) {
    body.innerHTML = `
      <div class="board-empty">
        <div class="board-empty-icon">📋</div>
        <div class="board-empty-text">No selections yet</div>
        <div class="board-empty-hint">Tap + on any material to add it here</div>
      </div>
    `;
    return;
  }

  body.innerHTML = '';
  for (const catId of catIds) {
    const { label, items } = grouped[catId];

    const section = document.createElement('div');
    section.className = 'board-category';

    const catLabel = document.createElement('div');
    catLabel.className = 'board-cat-label';
    catLabel.textContent = label;
    section.appendChild(catLabel);

    for (const item of items) {
      const hasRooms = selectedPlan && selectedPlan.rooms.length > 0;
      const row = document.createElement('div');
      row.className = 'board-item' + (hasRooms ? ' board-item-vertical' : '');

      let swatch;
      if (item.featureImage) {
        swatch = document.createElement('img');
        swatch.className = 'board-item-swatch';
        swatch.src = item.featureImage;
        swatch.alt = item.name;
      } else {
        swatch = document.createElement('div');
        swatch.className = 'board-item-swatch';
        swatch.style.backgroundColor = item.colors?.[0] || '#c8b89a';
      }

      const topRow = document.createElement('div');
      topRow.className = 'board-item-top';

      const info = document.createElement('div');
      info.className = 'board-item-info';
      info.innerHTML = `
        <div class="board-item-name">${item.name}</div>
        <div class="board-item-sku">${item.sku}</div>
      `;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'board-item-remove';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', () => removeFromBoard(item.sku));

      if (hasRooms) {
        topRow.appendChild(swatch);
        topRow.appendChild(info);
        topRow.appendChild(removeBtn);
        row.appendChild(topRow);

        const assignedRoomIds = getBoardItemRooms(item.sku, selectedFpId);
        const roomChecks = document.createElement('div');
        roomChecks.className = 'board-room-checks';
        for (const r of selectedPlan.rooms) {
          const label = document.createElement('label');
          label.className = 'board-room-check' + (assignedRoomIds.includes(r.id) ? ' checked' : '');
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = assignedRoomIds.includes(r.id);
          cb.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleBoardItemRoom(item.sku, r.id, selectedFpId);
          });
          label.appendChild(cb);
          label.appendChild(document.createTextNode(r.name));
          roomChecks.appendChild(label);
        }
        row.appendChild(roomChecks);

        const cost = parseFloat(item.costPerUnit);
        if (cost > 0) {
          let totalCost = 0;
          if (item.costType === 'sqft') {
            for (const rId of assignedRoomIds) {
              const room = selectedPlan.rooms.find(r => r.id === rId);
              if (room?.sqft > 0) totalCost += cost * room.sqft;
            }
          } else {
            totalCost = cost * assignedRoomIds.length;
          }
          const costEl = document.createElement('div');
          costEl.className = 'board-item-cost';
          if (totalCost > 0) {
            costEl.textContent = `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} est.`;
          } else {
            costEl.textContent = item.costType === 'sqft' ? `$${cost.toFixed(2)}/sqft` : `$${cost.toFixed(2)} each`;
          }
          row.appendChild(costEl);
        }
      } else {
        row.appendChild(swatch);
        row.appendChild(info);
        const cost = parseFloat(item.costPerUnit);
        if (cost > 0) {
          const costEl = document.createElement('div');
          costEl.className = 'board-item-cost';
          costEl.textContent = item.costType === 'sqft' ? `$${cost.toFixed(2)}/sqft` : `$${cost.toFixed(2)} each`;
          info.appendChild(costEl);
        }
        row.appendChild(removeBtn);
      }

      section.appendChild(row);
    }

    body.appendChild(section);
  }
}

function showClearConfirm() {
  if (!panelEl || document.querySelector('.board-confirm')) return;

  const overlay = document.createElement('div');
  overlay.className = 'board-confirm';
  overlay.innerHTML = `
    <div class="board-confirm-card">
      <div class="board-confirm-title">Clear Collection?</div>
      <div class="board-confirm-text">This will remove all selections and room assignments. This action cannot be undone.</div>
      <div class="board-confirm-actions">
        <button class="btn btn-secondary" id="confirmCancel">Cancel</button>
        <button class="btn btn-danger" id="confirmClear">Clear Collection</button>
      </div>
    </div>
  `;

  overlay.querySelector('#confirmCancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#confirmClear').addEventListener('click', () => {
    clearBoard();
    overlay.remove();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

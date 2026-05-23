import { getBoardItems, getBoardCount, removeFromBoard, onBoardChange } from '../services/board.js';

let boardUnsub = null;

export function renderSidebar(container, opts) {
  const { floorPlans, floorPlan, rooms, activeRoomId, categories, activeCat,
          onSelectRoom, onSelectCategory, onSelectFloorPlan,
          onExportPDF, onSaveCollection, onRequestSamples, onClearCollection } = opts;

  // Clean up previous board change listener
  if (boardUnsub) { boardUnsub(); boardUnsub = null; }

  container.innerHTML = '';

  // ── Toolbar: floor plan selector + save collection ──
  if (floorPlans && floorPlans.length > 0) {
    const toolbar = document.createElement('div');
    toolbar.className = 'sidebar-toolbar';

    if (floorPlans.length === 1) {
      const fpName = document.createElement('div');
      fpName.className = 'sidebar-toolbar-name';
      fpName.textContent = floorPlan ? floorPlan.name : '';
      toolbar.appendChild(fpName);
    } else {
      const fpSelect = document.createElement('select');
      fpSelect.className = 'sidebar-toolbar-select';
      for (const fp of floorPlans) {
        const opt = document.createElement('option');
        opt.value = fp.id;
        opt.textContent = fp.name;
        if (floorPlan && fp.id === floorPlan.id) opt.selected = true;
        fpSelect.appendChild(opt);
      }
      fpSelect.addEventListener('change', () => onSelectFloorPlan(fpSelect.value));
      toolbar.appendChild(fpSelect);
    }

    const saveBtn = document.createElement('button');
    saveBtn.className = 'design-board-btn sidebar-toolbar-save';
    saveBtn.textContent = 'Save Collection';
    saveBtn.addEventListener('click', () => onSaveCollection?.());
    toolbar.appendChild(saveBtn);

    container.appendChild(toolbar);
  }

  // ── Columns wrapper ──
  const colsWrap = document.createElement('div');
  colsWrap.className = 'sidebar-cols';

  // ── Left column: Rooms ──
  const roomCol = document.createElement('div');
  roomCol.className = 'sidebar-col sidebar-col--rooms';

  const roomLabel = document.createElement('div');
  roomLabel.className = 'sidebar-label';
  roomLabel.textContent = 'Rooms';
  roomCol.appendChild(roomLabel);

  if (rooms.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sidebar-empty';
    empty.textContent = 'No floor plans configured';
    roomCol.appendChild(empty);
  }

  for (const room of rooms) {
    const btn = document.createElement('button');
    btn.className = 'nav-item' + (room.id === activeRoomId ? ' active' : '');
    btn.innerHTML = `<div class="nav-name">${room.name}</div>`;
    btn.addEventListener('click', () => onSelectRoom(room.id));
    roomCol.appendChild(btn);
  }

  // Branding at bottom of rooms column
  const branding = document.createElement('div');
  branding.className = 'sidebar-branding';
  branding.innerHTML = `
    <div class="sidebar-branding-name">SeniorStudio</div>
    <div class="sidebar-branding-sub">Powered by Nolt Mathis</div>
  `;
  roomCol.appendChild(branding);

  // ── Right column: Category cards with material details + Actions ──
  const catCol = document.createElement('div');
  catCol.className = 'sidebar-col sidebar-col--cats';

  // Scrollable area
  const scrollArea = document.createElement('div');
  scrollArea.className = 'sidebar-col-scroll';

  const catLabel = document.createElement('div');
  catLabel.className = 'sidebar-label';
  const activeRoom = rooms.find(r => r.id === activeRoomId);
  catLabel.textContent = activeRoom ? activeRoom.name : 'Categories';
  scrollArea.appendChild(catLabel);

  if (categories.length === 0 && activeRoom) {
    const empty = document.createElement('div');
    empty.className = 'sidebar-empty';
    empty.textContent = 'No categories assigned';
    scrollArea.appendChild(empty);
  }

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];

    // Category card (div, not button — contains interactive children)
    const card = document.createElement('div');
    card.className = 'cat-card' + (i === activeCat ? ' active' : '');
    card.setAttribute('data-cat-card', cat.id);

    // Clickable header row: name + count badge
    const header = document.createElement('div');
    header.className = 'cat-card-header';
    header.addEventListener('click', () => onSelectCategory(i));

    const nameDiv = document.createElement('div');
    nameDiv.className = 'nav-name';
    nameDiv.textContent = cat.label;
    header.appendChild(nameDiv);

    const badge = document.createElement('span');
    badge.className = 'cat-card-badge';
    badge.setAttribute('data-cat-badge', cat.id);
    header.appendChild(badge);

    card.appendChild(header);

    // Material items container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'cat-card-items';
    itemsContainer.setAttribute('data-cat-items', cat.id);
    card.appendChild(itemsContainer);

    scrollArea.appendChild(card);
  }

  catCol.appendChild(scrollArea);

  // ── Action footer (visible only when board has items) ──
  const footer = document.createElement('div');
  footer.className = 'sidebar-actions';
  footer.id = 'sidebarActions';
  footer.innerHTML = `
    <button class="btn btn-primary btn-sm sidebar-action-btn" id="sidebarRequestSamples">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:-2px;flex-shrink:0;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
      Request Samples
    </button>
    <div class="sidebar-action-row">
      <button class="btn btn-secondary btn-sm sidebar-action-btn" id="sidebarExportPDF">Export PDF</button>
      <button class="btn btn-secondary btn-sm sidebar-action-btn sidebar-action-clear" id="sidebarClearBoard">Clear</button>
    </div>
  `;

  footer.querySelector('#sidebarRequestSamples').addEventListener('click', () => onRequestSamples?.());
  footer.querySelector('#sidebarExportPDF').addEventListener('click', () => onExportPDF?.());
  footer.querySelector('#sidebarClearBoard').addEventListener('click', () => onClearCollection?.());

  catCol.appendChild(footer);

  colsWrap.appendChild(roomCol);
  colsWrap.appendChild(catCol);
  container.appendChild(colsWrap);

  // Populate material items + action visibility
  updateCategoryItems(container, categories, activeRoomId);
  updateActionVisibility(footer);

  // Re-render on board changes
  boardUnsub = onBoardChange(() => {
    updateCategoryItems(container, categories, activeRoomId);
    const actions = document.getElementById('sidebarActions');
    if (actions) updateActionVisibility(actions);
  });
}

function updateCategoryItems(sidebarEl, categories, activeRoomId) {
  const boardItems = getBoardItems().filter(i => i.roomId === activeRoomId);

  // Group board items by categoryId
  const byCat = {};
  for (const item of boardItems) {
    if (!byCat[item.categoryId]) byCat[item.categoryId] = [];
    byCat[item.categoryId].push(item);
  }

  for (const cat of categories) {
    const itemsEl = sidebarEl.querySelector(`[data-cat-items="${cat.id}"]`);
    const badgeEl = sidebarEl.querySelector(`[data-cat-badge="${cat.id}"]`);
    const cardEl = sidebarEl.querySelector(`[data-cat-card="${cat.id}"]`);
    if (!itemsEl) continue;

    const items = byCat[cat.id] || [];

    // Update count badge
    if (badgeEl) {
      badgeEl.textContent = items.length > 0 ? items.length : '';
      badgeEl.style.display = items.length > 0 ? '' : 'none';
    }

    // Toggle card styling
    if (cardEl) {
      cardEl.classList.toggle('has-selections', items.length > 0);
    }

    // Render material detail rows
    itemsEl.innerHTML = '';
    if (items.length === 0) continue;

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'cat-item';

      // Image / color swatch
      if (item.featureImage) {
        const img = document.createElement('img');
        img.className = 'cat-item-img';
        img.src = item.featureImage;
        img.alt = item.name;
        row.appendChild(img);
      } else {
        const swatch = document.createElement('div');
        swatch.className = 'cat-item-img';
        swatch.style.backgroundColor = item.colors?.[0] || '#c8b89a';
        row.appendChild(swatch);
      }

      // Info: name + brand · SKU
      const info = document.createElement('div');
      info.className = 'cat-item-info';

      const nameEl = document.createElement('div');
      nameEl.className = 'cat-item-name';
      nameEl.textContent = item.name;
      info.appendChild(nameEl);

      const meta = [item.brand, item.sku].filter(Boolean).join(' · ');
      if (meta) {
        const metaEl = document.createElement('div');
        metaEl.className = 'cat-item-meta';
        metaEl.textContent = meta;
        info.appendChild(metaEl);
      }

      row.appendChild(info);

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'cat-item-remove';
      removeBtn.textContent = '✕';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromBoard(item.sku, activeRoomId);
      });
      row.appendChild(removeBtn);

      itemsEl.appendChild(row);
    }
  }
}

function updateActionVisibility(footer) {
  const count = getBoardCount();
  footer.style.display = count > 0 ? '' : 'none';
}

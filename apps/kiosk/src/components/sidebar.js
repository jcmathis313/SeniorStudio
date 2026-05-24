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

  // ── Scroll-for-more fade indicator ──
  const scrollFade = document.createElement('div');
  scrollFade.className = 'sidebar-scroll-fade';
  scrollFade.innerHTML = '<span class="sidebar-scroll-nudge">Scroll for more ↓</span>';
  catCol.appendChild(scrollFade);

  function updateScrollFade() {
    const atBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < 20;
    const isScrollable = scrollArea.scrollHeight > scrollArea.clientHeight;
    scrollFade.classList.toggle('visible', isScrollable && !atBottom);
  }
  scrollArea.addEventListener('scroll', updateScrollFade, { passive: true });

  // ── Action footer (visible only when board has items) ──
  const footer = document.createElement('div');
  footer.className = 'sidebar-actions';
  footer.id = 'sidebarActions';
  footer.innerHTML = `
    <div class="sidebar-action-row">
      <button class="design-board-btn sidebar-action-btn sidebar-action-save" id="sidebarSaveCollection">Save Collection</button>
      <button class="design-board-btn sidebar-action-btn" id="sidebarClearBoard">Clear</button>
    </div>
  `;

  footer.querySelector('#sidebarSaveCollection').addEventListener('click', () => onSaveCollection?.());
  footer.querySelector('#sidebarClearBoard').addEventListener('click', () => onClearCollection?.());

  catCol.appendChild(footer);

  colsWrap.appendChild(roomCol);
  colsWrap.appendChild(catCol);
  container.appendChild(colsWrap);

  // Populate material items + action visibility
  updateCategoryItems(container, categories, activeRoomId);
  updateActionVisibility(footer);
  requestAnimationFrame(updateScrollFade);

  // Re-render on board changes
  boardUnsub = onBoardChange(() => {
    updateCategoryItems(container, categories, activeRoomId);
    const actions = document.getElementById('sidebarActions');
    if (actions) updateActionVisibility(actions);
    requestAnimationFrame(updateScrollFade);
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
      row.setAttribute('data-sku', item.sku);

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

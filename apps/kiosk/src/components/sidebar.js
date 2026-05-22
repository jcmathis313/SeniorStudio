import { getBoardByRoom, getBoardCount, onBoardChange } from '../services/board.js';

let boardUnsub = null;

export function renderSidebar(container, opts) {
  const { floorPlans, floorPlan, rooms, activeRoomId, categories, activeCat,
          onSelectRoom, onSelectCategory, onSelectFloorPlan,
          onExportPDF, onSaveCollection, onRequestSamples, onClearCollection } = opts;

  // Clean up previous board change listener
  if (boardUnsub) { boardUnsub(); boardUnsub = null; }

  container.innerHTML = '';

  // ── Floor plan header (spans both columns) ──
  if (floorPlans && floorPlans.length > 0) {
    const fpHeader = document.createElement('div');
    fpHeader.className = 'fp-selector';

    const fpVisual = document.createElement('div');
    if (floorPlan && floorPlan.image) {
      fpVisual.className = 'fp-selector-image';
      const img = document.createElement('img');
      img.src = floorPlan.image;
      img.alt = floorPlan.name;
      fpVisual.appendChild(img);
    } else {
      fpVisual.className = 'fp-selector-icon';
      fpVisual.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`;
    }
    fpHeader.appendChild(fpVisual);

    if (floorPlans.length === 1) {
      const fpName = document.createElement('div');
      fpName.className = 'fp-selector-name';
      fpName.textContent = floorPlan ? floorPlan.name : '';
      fpHeader.appendChild(fpName);
    } else {
      const fpSelect = document.createElement('select');
      fpSelect.className = 'fp-selector-select';
      for (const fp of floorPlans) {
        const opt = document.createElement('option');
        opt.value = fp.id;
        opt.textContent = fp.name;
        if (floorPlan && fp.id === floorPlan.id) opt.selected = true;
        fpSelect.appendChild(opt);
      }
      fpSelect.addEventListener('change', () => onSelectFloorPlan(fpSelect.value));
      fpHeader.appendChild(fpSelect);
    }

    container.appendChild(fpHeader);
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

  // ── Right column: Categories + Room Selection Cards + Actions ──
  const catCol = document.createElement('div');
  catCol.className = 'sidebar-col sidebar-col--cats';

  // Scrollable area (categories + room cards)
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
    const btn = document.createElement('button');
    btn.className = 'nav-item' + (i === activeCat ? ' active' : '');
    btn.innerHTML = `<div class="nav-name">${cat.label}</div>`;
    btn.addEventListener('click', () => onSelectCategory(i));
    scrollArea.appendChild(btn);
  }

  // Room selection cards container
  const cardsSection = document.createElement('div');
  cardsSection.id = 'sidebarRoomCards';
  scrollArea.appendChild(cardsSection);

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
    <button class="btn btn-secondary btn-sm sidebar-action-btn" id="sidebarSaveCollection">Save Collection</button>
    <div class="sidebar-action-row">
      <button class="btn btn-secondary btn-sm sidebar-action-btn" id="sidebarExportPDF">Export PDF</button>
      <button class="btn btn-secondary btn-sm sidebar-action-btn sidebar-action-clear" id="sidebarClearBoard">Clear</button>
    </div>
  `;

  footer.querySelector('#sidebarRequestSamples').addEventListener('click', () => onRequestSamples?.());
  footer.querySelector('#sidebarSaveCollection').addEventListener('click', () => onSaveCollection?.());
  footer.querySelector('#sidebarExportPDF').addEventListener('click', () => onExportPDF?.());
  footer.querySelector('#sidebarClearBoard').addEventListener('click', () => onClearCollection?.());

  catCol.appendChild(footer);

  colsWrap.appendChild(roomCol);
  colsWrap.appendChild(catCol);
  container.appendChild(colsWrap);

  // Render room cards + set action visibility
  renderRoomCards(cardsSection, rooms, activeRoomId, onSelectRoom);
  updateActionVisibility(footer);

  // Re-render room cards on board changes
  boardUnsub = onBoardChange(() => {
    const cards = document.getElementById('sidebarRoomCards');
    const actions = document.getElementById('sidebarActions');
    if (cards) renderRoomCards(cards, rooms, activeRoomId, onSelectRoom);
    if (actions) updateActionVisibility(actions);
  });
}

function renderRoomCards(container, rooms, activeRoomId, onSelectRoom) {
  const grouped = getBoardByRoom();
  const count = getBoardCount();

  container.innerHTML = '';

  if (count === 0) return;

  // Divider
  const divider = document.createElement('div');
  divider.className = 'sidebar-divider';
  container.appendChild(divider);

  // Section header
  const header = document.createElement('div');
  header.className = 'sidebar-label sidebar-selections-label';
  header.innerHTML = `My Selections <span class="sidebar-selections-count">${count}</span>`;
  container.appendChild(header);

  // One card per room that has selections
  const roomKeys = Object.keys(grouped);
  for (const roomKey of roomKeys) {
    const { label, items } = grouped[roomKey];

    const card = document.createElement('div');
    card.className = 'sidebar-room-card';
    if (roomKey === activeRoomId) card.classList.add('sidebar-room-card--active');

    if (roomKey !== '_unassigned') {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => onSelectRoom(roomKey));
    }

    const cardHeader = document.createElement('div');
    cardHeader.className = 'sidebar-room-card-header';
    cardHeader.innerHTML = `
      <span class="sidebar-room-card-name">${label}</span>
      <span class="sidebar-room-card-count">${items.length}</span>
    `;
    card.appendChild(cardHeader);

    // Thumbnail grid
    const thumbGrid = document.createElement('div');
    thumbGrid.className = 'sidebar-thumb-grid';

    const maxThumbs = 5;
    const shown = items.slice(0, maxThumbs);
    for (const item of shown) {
      if (item.featureImage) {
        const img = document.createElement('img');
        img.className = 'sidebar-thumb';
        img.src = item.featureImage;
        img.alt = item.name;
        img.title = item.name;
        thumbGrid.appendChild(img);
      } else {
        const swatch = document.createElement('div');
        swatch.className = 'sidebar-thumb';
        swatch.style.backgroundColor = item.colors?.[0] || '#c8b89a';
        swatch.title = item.name;
        thumbGrid.appendChild(swatch);
      }
    }

    if (items.length > maxThumbs) {
      const more = document.createElement('div');
      more.className = 'sidebar-thumb sidebar-thumb-more';
      more.textContent = `+${items.length - maxThumbs}`;
      thumbGrid.appendChild(more);
    }

    card.appendChild(thumbGrid);
    container.appendChild(card);
  }
}

function updateActionVisibility(footer) {
  const count = getBoardCount();
  footer.style.display = count > 0 ? '' : 'none';
}

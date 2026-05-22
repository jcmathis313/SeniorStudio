export function renderSidebar(container, opts) {
  const { floorPlans, floorPlan, rooms, activeRoomId, categories, activeCat, onSelectRoom, onSelectCategory, onSelectFloorPlan } = opts;

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

  // ── Right column: Categories for selected room ──
  const catCol = document.createElement('div');
  catCol.className = 'sidebar-col sidebar-col--cats';

  const catLabel = document.createElement('div');
  catLabel.className = 'sidebar-label';
  const activeRoom = rooms.find(r => r.id === activeRoomId);
  catLabel.textContent = activeRoom ? activeRoom.name : 'Categories';
  catCol.appendChild(catLabel);

  if (categories.length === 0 && activeRoom) {
    const empty = document.createElement('div');
    empty.className = 'sidebar-empty';
    empty.textContent = 'No categories assigned';
    catCol.appendChild(empty);
  }

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const btn = document.createElement('button');
    btn.className = 'nav-item' + (i === activeCat ? ' active' : '');
    btn.innerHTML = `<div class="nav-name">${cat.label}</div>`;
    btn.addEventListener('click', () => onSelectCategory(i));
    catCol.appendChild(btn);
  }

  colsWrap.appendChild(roomCol);
  colsWrap.appendChild(catCol);
  container.appendChild(colsWrap);
}

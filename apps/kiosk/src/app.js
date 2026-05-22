import { loadCommunities } from './data/communities.js';
import { initAuth, getCommunity, onAuthChange } from './services/auth.js';
import { loadSettings, getVisibleCategories, getFloorPlans, getRoomCategories, onSettingsChange } from './services/settings.js';
import { renderLogin } from './components/login.js';
import { renderHeader } from './components/header.js';
import { renderSidebar } from './components/sidebar.js';
import { renderFilters } from './components/filters.js';
import { renderGrid } from './components/grid.js';
import { mountModal, openModal } from './components/modal.js';
import { mountBoard, toggleBoard, isBoardOpen } from './components/board.js';
import { mountDesignBoard, openDesignBoard } from './components/design-board.js';
import { renderSettings } from './components/settings.js';
import { mountSavedCollections, openSaveModal, openLoadModal } from './components/saved-collections.js';
import { mountRecords, openRecords } from './components/records.js';

let activeCat = 0;
let activeFilter = 'All';
let searchQuery = '';
let currentView = 'catalog';
let renderToken = 0;
let activeFloorPlanId = null;
let activeRoomId = null;

export async function boot(root) {
  await loadCommunities();
  initAuth();
  onAuthChange(() => {
    activeCat = 0;
    activeFilter = 'All';
    currentView = 'catalog';
    render(root);
  });
  render(root);
}

async function render(root) {
  const token = ++renderToken;
  const community = getCommunity();
  if (!community) {
    renderLogin(root);
    return;
  }
  await loadSettings();
  if (token !== renderToken) return;
  if (currentView === 'settings') {
    renderSettingsView(root);
  } else {
    renderCatalog(root);
  }
}

function renderSettingsView(root) {
  root.innerHTML = `
    <div class="app">
      <div id="headerSlot"></div>
      <div class="main">
        <div class="content" id="settingsContent" style="grid-column:1/-1;"></div>
      </div>
    </div>
  `;

  renderHeader(document.getElementById('headerSlot'), {
    onToggleBoard: toggleBoard,
    onToggleSettings: (show) => {
      currentView = show ? 'settings' : 'catalog';
      render(root);
    },
    currentView: 'settings',
  });

  renderSettings(document.getElementById('settingsContent'));
}

function getActiveFloorPlan() {
  const plans = getFloorPlans();
  if (!plans.length) return null;
  if (activeFloorPlanId) {
    const found = plans.find(fp => fp.id === activeFloorPlanId);
    if (found) return found;
  }
  activeFloorPlanId = plans[0].id;
  return plans[0];
}

function getActiveRoom(fp) {
  if (!fp || !fp.rooms.length) return null;
  if (activeRoomId) {
    const found = fp.rooms.find(r => r.id === activeRoomId);
    if (found) return found;
  }
  activeRoomId = fp.rooms[0].id;
  return fp.rooms[0];
}

function renderCatalog(root) {
  root.innerHTML = `
    <div class="app">
      <div id="headerSlot"></div>
      <div class="main">
        <aside class="sidebar sidebar--room-nav" id="sidebarSlot"></aside>
        <div class="content" id="contentArea">
          <div class="content-header">
            <div class="content-title" id="contentTitle"></div>
            <div class="content-subtitle" id="contentSubtitle"></div>
          </div>
          <div class="filters" id="filtersSlot"></div>
          <div class="search-bar" id="searchBar">
            <input type="text" class="search-input" id="searchInput" placeholder="Search by name, brand, or SKU...">
          </div>
          <div class="grid-scroll">
            <div class="swatch-grid" id="gridSlot"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  renderHeader(document.getElementById('headerSlot'), {
    onToggleBoard: toggleBoard,
    onOpenDesignBoard: openDesignBoard,
    onOpenSavedCollections: openLoadModal,
    onOpenRecords: openRecords,
    onToggleSettings: (show) => {
      currentView = show ? 'settings' : 'catalog';
      render(root);
    },
    currentView: 'catalog',
  });

  mountModal(root);
  mountBoard(root, { onSaveCollection: openSaveModal });
  mountDesignBoard(root);
  mountSavedCollections(root);
  mountRecords(root);

  const searchInput = document.getElementById('searchInput');
  searchInput.value = searchQuery;
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    updateContent();
  });

  updateContent();
}

function updateContent() {
  const fp = getActiveFloorPlan();
  const room = fp ? getActiveRoom(fp) : null;

  // Get categories scoped to the active room (or fall back to all visible)
  let cats;
  if (fp && room && room.categories && room.categories.length > 0) {
    cats = getRoomCategories(fp.id, room.id).filter(c => c.enabled !== false);
  } else {
    cats = getVisibleCategories();
  }

  if (activeCat >= cats.length) activeCat = 0;
  const cat = cats[activeCat];

  renderSidebar(document.getElementById('sidebarSlot'), {
    floorPlans: getFloorPlans(),
    floorPlan: fp,
    rooms: fp ? fp.rooms : [],
    activeRoomId,
    categories: cats,
    activeCat,
    onSelectFloorPlan: (fpId) => {
      activeFloorPlanId = fpId;
      activeRoomId = null;
      activeCat = 0;
      activeFilter = 'All';
      searchQuery = '';
      const si = document.getElementById('searchInput');
      if (si) si.value = '';
      updateContent();
    },
    onSelectRoom: (roomId) => {
      activeRoomId = roomId;
      activeCat = 0;
      activeFilter = 'All';
      searchQuery = '';
      const si = document.getElementById('searchInput');
      if (si) si.value = '';
      updateContent();
    },
    onSelectCategory: (i) => {
      activeCat = i;
      activeFilter = 'All';
      searchQuery = '';
      const si = document.getElementById('searchInput');
      if (si) si.value = '';
      updateContent();
    },
  });

  if (!cat) {
    document.getElementById('contentTitle').textContent = room ? room.name : 'Select a room';
    document.getElementById('contentSubtitle').textContent = 'No categories assigned to this room';
    document.getElementById('filtersSlot').innerHTML = '';
    document.getElementById('gridSlot').innerHTML = '';
    return;
  }

  const roomLabel = room ? room.name + ' — ' : '';
  document.getElementById('contentTitle').textContent = roomLabel + cat.label;

  let items = activeFilter === 'All' ? cat.items : cat.items.filter(i => i.type === activeFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.brand && i.brand.toLowerCase().includes(q)) ||
      (i.sku && i.sku.toLowerCase().includes(q))
    );
  }
  document.getElementById('contentSubtitle').textContent = items.length + ' finishes available';

  renderFilters(document.getElementById('filtersSlot'), {
    filters: cat.filters || ['All'],
    activeFilter,
    onSelect: (f) => {
      activeFilter = f;
      updateContent();
    },
  });

  const roomCtx = (fp && room) ? { roomId: room.id, roomName: room.name, floorPlanId: fp.id } : undefined;

  renderGrid(document.getElementById('gridSlot'), {
    category: cat,
    activeFilter,
    searchQuery,
    onCardClick: openModal,
    onAddToBoard: () => { if (!isBoardOpen()) toggleBoard(); },
    roomContext: roomCtx,
  });
}

import { initAuth, getCommunity, onAuthChange } from './services/auth.js';
import { loadSettings, getVisibleCategories, onSettingsChange } from './services/settings.js';
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

export function boot(root) {
  initAuth();
  onAuthChange(() => {
    activeCat = 0;
    activeFilter = 'All';
    currentView = 'catalog';
    render(root);
  });
  render(root);
}

function render(root) {
  const community = getCommunity();
  if (!community) {
    renderLogin(root);
    return;
  }
  loadSettings();
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

function renderCatalog(root) {
  root.innerHTML = `
    <div class="app">
      <div id="headerSlot"></div>
      <div class="main">
        <aside class="sidebar" id="sidebarSlot"></aside>
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

  const cats = getVisibleCategories();
  if (activeCat >= cats.length) activeCat = 0;

  renderSidebar(document.getElementById('sidebarSlot'), {
    activeCat,
    categories: cats,
    onSelect: (i) => {
      activeCat = i;
      activeFilter = 'All';
      searchQuery = '';
      document.getElementById('searchInput').value = '';
      updateContent();
    },
  });

  const searchInput = document.getElementById('searchInput');
  searchInput.value = searchQuery;
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    updateContent();
  });

  updateContent();
}

function updateContent() {
  const cats = getVisibleCategories();
  const cat = cats[activeCat];
  if (!cat) return;

  document.getElementById('contentTitle').textContent = cat.label;
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

  renderSidebar(document.getElementById('sidebarSlot'), {
    activeCat,
    categories: cats,
    onSelect: (i) => {
      activeCat = i;
      activeFilter = 'All';
      updateContent();
    },
  });

  renderFilters(document.getElementById('filtersSlot'), {
    filters: cat.filters || ['All'],
    activeFilter,
    onSelect: (f) => {
      activeFilter = f;
      updateContent();
    },
  });

  renderGrid(document.getElementById('gridSlot'), {
    category: cat,
    activeFilter,
    searchQuery,
    onCardClick: openModal,
    onAddToBoard: () => { if (!isBoardOpen()) toggleBoard(); },
  });
}

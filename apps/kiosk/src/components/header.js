import { getCommunity, logout, isAdmin } from '../services/auth.js';
import { getBoardCount, onBoardChange } from '../services/board.js';
import { getSettings } from '../services/settings.js';

export function renderHeader(container, { onToggleBoard, onToggleSettings, onOpenDesignBoard, onOpenSavedCollections, onOpenRecords, currentView }) {
  const community = getCommunity();
  const settings = getSettings();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const logoHtml = settings.logo
    ? `<img src="${settings.logo}" alt="${community.name}" style="max-height:36px;max-width:140px;object-fit:contain;">`
    : `<div class="community-name">${community.name}</div>`;

  const adminBtnHtml = isAdmin()
    ? `<button class="design-board-btn" id="recordsBtn">Records</button><button class="settings-btn" id="settingsBtn" title="Settings">⚙</button>`
    : '';

  container.innerHTML = `
    <header>
      <div class="header-left">
        ${logoHtml}
      </div>
      <div class="header-center"></div>
      <div class="header-right">
        ${currentView === 'settings' ? `
          <button class="btn btn-secondary" id="backToCatalog" style="padding:8px 16px;font-size:13px;">Back to Catalog</button>
        ` : `
          <button class="board-toggle" id="boardToggle">
            <span>My Collection</span>
            <span class="count" id="boardCount"></span>
          </button>
          <button class="design-board-btn" id="designBoardBtn">Design Board</button>
          <button class="design-board-btn" id="savedCollectionsBtn">Saved Collections</button>
        `}
        ${adminBtnHtml}
        <div class="header-date">${dateStr}<br>${timeStr}</div>
        <button class="logout-btn" id="logoutBtn">Sign Out</button>
      </div>
    </header>
  `;

  if (currentView !== 'settings') {
    const countEl = container.querySelector('#boardCount');
    function updateCount() {
      const n = getBoardCount();
      countEl.textContent = n || '';
    }
    updateCount();
    onBoardChange(updateCount);
    container.querySelector('#boardToggle').addEventListener('click', onToggleBoard);
    container.querySelector('#designBoardBtn').addEventListener('click', () => onOpenDesignBoard?.());
    container.querySelector('#savedCollectionsBtn').addEventListener('click', () => onOpenSavedCollections?.());
  } else {
    container.querySelector('#backToCatalog')?.addEventListener('click', () => onToggleSettings(false));
  }

  container.querySelector('#recordsBtn')?.addEventListener('click', () => onOpenRecords?.());
  container.querySelector('#settingsBtn')?.addEventListener('click', () => {
    onToggleSettings(currentView !== 'settings');
  });
  container.querySelector('#logoutBtn').addEventListener('click', logout);

  requestAnimationFrame(() => {
    const h = container.querySelector('header')?.offsetHeight;
    if (h) document.documentElement.style.setProperty('--header-height', h + 'px');
  });
}

import { getCommunity, logout, isAdmin } from '../services/auth.js';
import { getSettings } from '../services/settings.js';

export function renderHeader(container, { onToggleSettings, onOpenDesignBoard, onOpenSavedCollections, onOpenRecords, onSaveCollection, onSelectFloorPlan, floorPlans, floorPlan, currentView }) {
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

  // Floor plan selector for header-left
  let fpSelectorHtml = '';
  if (currentView !== 'settings' && floorPlans && floorPlans.length > 0) {
    if (floorPlans.length === 1) {
      fpSelectorHtml = `<div class="header-fp-name">${floorPlan ? floorPlan.name : ''}</div>`;
    } else {
      let fpOptions = '';
      for (const fp of floorPlans) {
        const sel = (floorPlan && fp.id === floorPlan.id) ? ' selected' : '';
        fpOptions += `<option value="${fp.id}"${sel}>${fp.name}</option>`;
      }
      fpSelectorHtml = `<select class="header-fp-select" id="headerFpSelect">${fpOptions}</select>`;
    }
  }

  // Secondary bar with floor plan selector + save collection
  let subBarHtml = '';
  if (currentView !== 'settings' && fpSelectorHtml) {
    subBarHtml = `
      <div class="header-sub">
        <div class="header-sub-left">${fpSelectorHtml}</div>
        <div class="header-sub-right">
          <button class="design-board-btn" id="saveCollectionBtn">Save Collection</button>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <header>
      <div class="header-row">
        <div class="header-left">
          ${logoHtml}
        </div>
        <div class="header-center"></div>
        <div class="header-right">
          ${currentView === 'settings' ? `
            <button class="btn btn-secondary" id="backToCatalog" style="padding:8px 16px;font-size:13px;">Back to Catalog</button>
          ` : `
            <button class="design-board-btn" id="designBoardBtn">Design Board</button>
            <button class="design-board-btn" id="savedCollectionsBtn">Saved Collections</button>
          `}
          ${adminBtnHtml}
          <div class="header-date">${dateStr}<br>${timeStr}</div>
          <button class="logout-btn" id="logoutBtn">Sign Out</button>
        </div>
      </div>
      ${subBarHtml}
    </header>
  `;

  if (currentView !== 'settings') {
    container.querySelector('#saveCollectionBtn').addEventListener('click', () => onSaveCollection?.());
    container.querySelector('#designBoardBtn').addEventListener('click', () => onOpenDesignBoard?.());
    container.querySelector('#savedCollectionsBtn').addEventListener('click', () => onOpenSavedCollections?.());
    container.querySelector('#headerFpSelect')?.addEventListener('change', (e) => onSelectFloorPlan?.(e.target.value));
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

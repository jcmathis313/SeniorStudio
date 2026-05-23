import { getCommunity, logout, isAdmin, validateAdminPin, elevateToAdmin } from '../services/auth.js';
import { getSettings } from '../services/settings.js';

export function renderHeader(container, { onToggleSettings, onOpenDesignBoard, onOpenSavedCollections, onOpenRecords, currentView }) {
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

  const adminLoginHtml = !isAdmin()
    ? `<button class="admin-login-btn" id="adminLoginBtn" title="Admin Login">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </button>`
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
          <button class="design-board-btn" id="designBoardBtn">Design Board</button>
          <button class="design-board-btn" id="savedCollectionsBtn">Saved Collections</button>
        `}
        ${adminBtnHtml}
        <div class="header-date">${dateStr}<br>${timeStr}</div>
        ${adminLoginHtml}
        <button class="logout-btn" id="logoutBtn">Sign Out</button>
      </div>
    </header>

    <div class="pin-overlay" id="pinOverlay">
      <div class="pin-modal">
        <div class="pin-modal-title">Admin Access</div>
        <div class="pin-modal-subtitle">Enter the 4-digit PIN</div>
        <div class="pin-dots" id="pinDots">
          <span class="pin-dot"></span>
          <span class="pin-dot"></span>
          <span class="pin-dot"></span>
          <span class="pin-dot"></span>
        </div>
        <div class="pin-error" id="pinError"></div>
        <div class="pin-pad">
          <button class="pin-key" data-key="1">1</button>
          <button class="pin-key" data-key="2">2</button>
          <button class="pin-key" data-key="3">3</button>
          <button class="pin-key" data-key="4">4</button>
          <button class="pin-key" data-key="5">5</button>
          <button class="pin-key" data-key="6">6</button>
          <button class="pin-key" data-key="7">7</button>
          <button class="pin-key" data-key="8">8</button>
          <button class="pin-key" data-key="9">9</button>
          <button class="pin-key pin-key--cancel" data-key="cancel">Cancel</button>
          <button class="pin-key" data-key="0">0</button>
          <button class="pin-key pin-key--delete" data-key="delete">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  if (currentView !== 'settings') {
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

  const overlay = container.querySelector('#pinOverlay');
  const dots = container.querySelectorAll('.pin-dot');
  const pinError = container.querySelector('#pinError');
  let pinValue = '';

  function updateDots() {
    dots.forEach((dot, i) => dot.classList.toggle('filled', i < pinValue.length));
  }

  container.querySelector('#adminLoginBtn')?.addEventListener('click', () => {
    pinValue = '';
    pinError.textContent = '';
    updateDots();
    overlay.classList.add('visible');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('visible');
    }
  });

  container.querySelectorAll('.pin-key').forEach(key => {
    key.addEventListener('click', async () => {
      const val = key.dataset.key;
      if (val === 'cancel') {
        overlay.classList.remove('visible');
        return;
      }
      if (val === 'delete') {
        pinValue = pinValue.slice(0, -1);
        pinError.textContent = '';
        updateDots();
        return;
      }
      if (pinValue.length >= 4) return;
      pinValue += val;
      updateDots();

      if (pinValue.length === 4) {
        const valid = await validateAdminPin(pinValue);
        if (valid) {
          overlay.classList.remove('visible');
          elevateToAdmin();
        } else {
          pinError.textContent = 'Incorrect PIN';
          pinValue = '';
          updateDots();
        }
      }
    });
  });

  requestAnimationFrame(() => {
    const h = container.querySelector('header')?.offsetHeight;
    if (h) document.documentElement.style.setProperty('--header-height', h + 'px');
  });
}

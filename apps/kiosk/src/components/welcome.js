import { getCommunity, logout } from '../services/auth.js';
import { getSettings } from '../services/settings.js';

export function renderWelcome(container, { onNavigate }) {
  const community = getCommunity();
  const settings = getSettings();
  const logo = settings.logo || community.logo_url;
  const accent = community.accent || settings.primaryColor || '#007aff';

  const logoHtml = logo
    ? `<img src="${logo}" alt="${community.name}" class="welcome-logo-img">`
    : `<div class="welcome-logo-text">${community.name}</div>`;

  container.innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-left">
        ${logoHtml}
      </div>
      <div class="welcome-right" style="background:${accent};">
        <div class="welcome-menu">
          <button class="welcome-link welcome-link--disabled" disabled>
            <span class="welcome-link-label">Browse Materials</span>
            <span class="welcome-link-sub">Coming soon</span>
          </button>
          <button class="welcome-link" id="welcomeSelections">
            <span class="welcome-link-label">Selections from Scratch</span>
            <span class="welcome-link-sub">Start building your collection</span>
          </button>
          <button class="welcome-link welcome-link--disabled" disabled>
            <span class="welcome-link-label">Selections from Assessment</span>
            <span class="welcome-link-sub">Coming soon</span>
          </button>
        </div>
      </div>
      <button class="welcome-signout" id="welcomeSignOut">Sign Out</button>
    </div>
  `;

  container.querySelector('#welcomeSelections').addEventListener('click', () => {
    onNavigate('catalog');
  });
  container.querySelector('#welcomeSignOut').addEventListener('click', logout);
}

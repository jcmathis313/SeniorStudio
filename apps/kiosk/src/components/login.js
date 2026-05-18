import { COMMUNITIES } from '../data/communities.js';
import { loginToCommunity } from '../services/auth.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="login-screen">
      <div class="login-logo">Nolt Mathis Construction Management</div>
      <div class="login-title">SeniorStudio</div>
      <div class="login-subtitle">Select your community to begin</div>
      <div class="login-role-toggle">
        <button class="role-btn active" data-role="user">Resident</button>
        <button class="role-btn" data-role="admin">Admin</button>
      </div>
      <div class="community-grid" id="communityGrid"></div>
    </div>
  `;

  let selectedRole = 'user';
  const roleBtns = container.querySelectorAll('.role-btn');
  roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      roleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedRole = btn.dataset.role;
    });
  });

  const grid = container.querySelector('#communityGrid');
  for (const community of COMMUNITIES) {
    const card = document.createElement('div');
    card.className = 'community-card';
    card.innerHTML = `
      <div class="community-card-icon">${community.icon}</div>
      <div class="community-card-name">${community.name}</div>
      <div class="community-card-location">${community.location}</div>
      <div class="community-card-count">${community.units} units</div>
    `;
    card.addEventListener('click', () => loginToCommunity(community.id, selectedRole));
    grid.appendChild(card);
  }
}

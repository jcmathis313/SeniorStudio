export function renderSidebar(container, { activeCat, categories, onSelect }) {
  container.innerHTML = '<div class="sidebar-label">Categories</div>';

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const btn = document.createElement('button');
    btn.className = 'nav-item' + (i === activeCat ? ' active' : '');
    btn.innerHTML = `
      <span class="nav-icon">${cat.icon}</span>
      <div class="nav-text">
        <div class="nav-name">${cat.label}</div>
        <div class="nav-count">${cat.items.length} options</div>
      </div>
    `;
    btn.addEventListener('click', () => onSelect(i));
    container.appendChild(btn);
  }

  const branding = document.createElement('div');
  branding.className = 'sidebar-branding';
  branding.innerHTML = `
    <div class="sidebar-branding-name">SeniorStudio</div>
    <div class="sidebar-branding-sub">Powered by Nolt Mathis</div>
  `;
  container.appendChild(branding);
}

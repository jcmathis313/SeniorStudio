export function renderFilters(container, { filters, activeFilter, onSelect }) {
  container.innerHTML = '';
  for (const f of filters) {
    const pill = document.createElement('div');
    pill.className = 'pill' + (f === activeFilter ? ' active' : '');
    pill.textContent = f;
    pill.addEventListener('click', () => onSelect(f));
    container.appendChild(pill);
  }
}

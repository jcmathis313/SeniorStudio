import { BADGE_LABELS } from '../data/materials.js';
import { isOnBoard, addToBoard, removeFromBoard, onBoardChange } from '../services/board.js';

export function renderGrid(container, { category, activeFilter, searchQuery, onCardClick, onAddToBoard, roomContext }) {
  let items = activeFilter === 'All'
    ? category.items
    : category.items.filter(it => it.type === activeFilter);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(it =>
      it.name.toLowerCase().includes(q) ||
      (it.brand && it.brand.toLowerCase().includes(q)) ||
      (it.sku && it.sku.toLowerCase().includes(q))
    );
  }

  container.innerHTML = '';

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const card = document.createElement('div');
    card.className = 'card' + (isOnBoard(item.sku) ? ' on-board' : '');
    card.style.animationDelay = (idx * 35) + 'ms';

    let visual;
    if (item.featureImage) {
      visual = document.createElement('img');
      visual.className = 'card-swatch';
      visual.src = item.featureImage;
      visual.alt = item.name;
    } else {
      visual = document.createElement('div');
      visual.className = 'card-swatch card-swatch-color';
      visual.style.backgroundColor = item.colors?.[0] || '#c8b89a';
    }

    const addBtn = document.createElement('button');
    addBtn.className = 'card-add-btn' + (isOnBoard(item.sku) ? ' added' : '');
    addBtn.textContent = isOnBoard(item.sku) ? '✓' : '+';
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isOnBoard(item.sku)) {
        removeFromBoard(item.sku);
      } else {
        addToBoard(category.id, category.label, item, roomContext);
        onAddToBoard?.();
      }
    });

    const body = document.createElement('div');
    body.className = 'card-body';
    body.innerHTML = `
      <div class="card-name">${item.name}</div>
      <div class="card-brand">${item.brand}</div>
      <div class="card-footer">
        <div class="card-sku">${item.sku}</div>
        <span class="badge badge-${item.badge}">${BADGE_LABELS[item.badge]}</span>
      </div>
    `;

    card.appendChild(visual);
    card.appendChild(addBtn);
    card.appendChild(body);
    container.appendChild(card);

    card.addEventListener('click', () => onCardClick(category, item, roomContext));

    onBoardChange(() => {
      const onBoard = isOnBoard(item.sku);
      card.classList.toggle('on-board', onBoard);
      addBtn.classList.toggle('added', onBoard);
      addBtn.textContent = onBoard ? '✓' : '+';
    });
  }
}

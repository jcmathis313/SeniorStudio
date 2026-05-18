import { getCollectionsGroupedByUser, deleteCollection, onCollectionsChange } from '../services/saved-collections.js';

let overlayEl = null;
let unsub = null;

export function mountRecords(parent) {
  overlayEl = document.createElement('div');
  overlayEl.className = 'records-overlay';
  overlayEl.id = 'recordsOverlay';
  parent.appendChild(overlayEl);
}

export function openRecords() {
  if (!overlayEl) return;
  renderRecordsView();
  overlayEl.classList.add('open');
  unsub = onCollectionsChange(renderRecordsView);
}

function closeRecords() {
  if (!overlayEl) return;
  overlayEl.classList.remove('open');
  if (unsub) { unsub(); unsub = null; }
}

function renderRecordsView() {
  const users = getCollectionsGroupedByUser();

  overlayEl.innerHTML = `
    <div class="records-panel">
      <div class="records-header">
        <h2 class="records-title">Collection Records</h2>
        <div class="records-subtitle">${users.length} user${users.length !== 1 ? 's' : ''}</div>
        <button class="sc-close-btn records-close-btn" id="recordsClose">✕</button>
      </div>
      <div class="records-body" id="recordsBody"></div>
    </div>
  `;

  overlayEl.querySelector('#recordsClose').addEventListener('click', closeRecords);
  overlayEl.addEventListener('click', (e) => { if (e.target === overlayEl) closeRecords(); });

  const body = overlayEl.querySelector('#recordsBody');

  if (users.length === 0) {
    body.innerHTML = `
      <div class="records-empty">
        <div class="records-empty-text">No saved collections yet.</div>
        <div class="records-empty-hint">Collections will appear here when users save their selections.</div>
      </div>
    `;
    return;
  }

  for (const user of users) {
    const section = document.createElement('div');
    section.className = 'records-user';

    const header = document.createElement('div');
    header.className = 'records-user-header';
    header.innerHTML = `
      <div class="records-user-name">${escHtml(user.firstName)} ${escHtml(user.lastName)}</div>
      <div class="records-user-meta">
        <span>${escHtml(user.email)}</span>
        ${user.phone ? `<span> · ${escHtml(user.phone)}</span>` : ''}
      </div>
    `;
    section.appendChild(header);

    for (const col of user.collections) {
      const date = new Date(col.savedAt);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      const row = document.createElement('div');
      row.className = 'records-collection';

      const info = document.createElement('div');
      info.className = 'records-collection-info';
      info.innerHTML = `
        <div class="records-collection-date">${dateStr} at ${timeStr}</div>
        <div class="records-collection-count">${col.items.length} item${col.items.length !== 1 ? 's' : ''}</div>
      `;

      const itemsPreview = document.createElement('div');
      itemsPreview.className = 'records-collection-items';
      for (const item of col.items.slice(0, 6)) {
        const chip = document.createElement('div');
        chip.className = 'records-item-chip';
        if (item.featureImage) {
          const img = document.createElement('img');
          img.src = item.featureImage;
          img.alt = item.name;
          chip.appendChild(img);
        } else {
          chip.style.backgroundColor = item.colors?.[0] || '#c8b89a';
        }
        itemsPreview.appendChild(chip);
      }
      if (col.items.length > 6) {
        const more = document.createElement('div');
        more.className = 'records-item-more';
        more.textContent = `+${col.items.length - 6}`;
        itemsPreview.appendChild(more);
      }

      const actions = document.createElement('div');
      actions.className = 'records-collection-actions';

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn btn-secondary btn-sm';
      viewBtn.textContent = 'View';
      viewBtn.addEventListener('click', () => showCollectionDetail(col));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm records-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        if (confirm('Delete this saved collection? This cannot be undone.')) {
          deleteCollection(col.id);
        }
      });

      actions.appendChild(viewBtn);
      actions.appendChild(deleteBtn);

      row.appendChild(info);
      row.appendChild(itemsPreview);
      row.appendChild(actions);
      section.appendChild(row);
    }

    body.appendChild(section);
  }
}

function showCollectionDetail(col) {
  const date = new Date(col.savedAt);
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  overlayEl.innerHTML = `
    <div class="records-panel">
      <div class="records-header">
        <h2 class="records-title">${escHtml(col.firstName)} ${escHtml(col.lastName)}</h2>
        <div class="records-subtitle">${dateStr} · ${col.items.length} items</div>
        <button class="sc-close-btn records-close-btn" id="recordsDetailBack">✕</button>
      </div>
      <div class="records-body" id="recordsDetailBody"></div>
      <div class="records-detail-footer">
        <button class="btn btn-secondary" id="recordsBackToList">Back to Records</button>
      </div>
    </div>
  `;

  const body = overlayEl.querySelector('#recordsDetailBody');

  // Group items by category
  const grouped = {};
  for (const item of col.items) {
    const cat = item.categoryLabel || 'Uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  for (const [catLabel, items] of Object.entries(grouped)) {
    const section = document.createElement('div');
    section.className = 'records-detail-category';

    const catHeader = document.createElement('div');
    catHeader.className = 'records-detail-cat-label';
    catHeader.textContent = catLabel;
    section.appendChild(catHeader);

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'records-detail-item';

      let swatch;
      if (item.featureImage) {
        swatch = document.createElement('img');
        swatch.className = 'records-detail-swatch';
        swatch.src = item.featureImage;
        swatch.alt = item.name;
      } else {
        swatch = document.createElement('div');
        swatch.className = 'records-detail-swatch';
        swatch.style.backgroundColor = item.colors?.[0] || '#c8b89a';
      }

      const info = document.createElement('div');
      info.className = 'records-detail-item-info';
      info.innerHTML = `
        <div class="records-detail-item-name">${escHtml(item.name)}</div>
        <div class="records-detail-item-meta">${escHtml(item.brand || '')} · ${escHtml(item.sku || '')}</div>
      `;

      row.appendChild(swatch);
      row.appendChild(info);
      section.appendChild(row);
    }

    body.appendChild(section);
  }

  overlayEl.querySelector('#recordsDetailBack').addEventListener('click', () => {
    renderRecordsView();
  });
  overlayEl.querySelector('#recordsBackToList').addEventListener('click', () => {
    renderRecordsView();
  });
}

function escHtml(str) {
  const el = document.createElement('span');
  el.textContent = str || '';
  return el.innerHTML;
}

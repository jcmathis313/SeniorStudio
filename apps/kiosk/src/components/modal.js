import { SPEC_LABELS, SAMPLE_STATUS_LABELS } from '../data/materials.js';
import { isOnBoard, addToBoard, removeFromBoard, onBoardChange } from '../services/board.js';

const SKIP_KEYS = new Set(['name', 'brand', 'sku', 'type', 'colors', 'pat', 'badge', 'categoryId', 'categoryLabel', 'sampleStatus']);

let overlayEl = null;

export function mountModal(parent) {
  overlayEl = document.createElement('div');
  overlayEl.className = 'overlay';
  overlayEl.id = 'overlay';
  overlayEl.innerHTML = `
    <div class="modal">
      <div class="modal-visual" id="modalVisual"></div>
      <div class="modal-body">
        <div class="modal-eyebrow" id="mEye"></div>
        <div class="modal-name" id="mName"></div>
        <div class="modal-brand" id="mBrand"></div>
        <div class="modal-sample-status" id="mSampleStatus"></div>
        <div class="specs-grid" id="mSpecs"></div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="btnClose">Close</button>
          <button class="btn btn-primary" id="btnBoard">Add to Board</button>
        </div>
      </div>
    </div>
  `;

  overlayEl.querySelector('#btnClose').addEventListener('click', closeModal);
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) closeModal();
  });

  parent.appendChild(overlayEl);
}

export function openModal(category, item, roomContext) {
  if (!overlayEl) return;

  overlayEl.querySelector('#mEye').textContent = category.label;
  overlayEl.querySelector('#mName').textContent = item.name;
  overlayEl.querySelector('#mBrand').textContent = item.brand + ' · ' + item.type;

  const sampleEl = overlayEl.querySelector('#mSampleStatus');
  if (item.sampleStatus && SAMPLE_STATUS_LABELS[item.sampleStatus]) {
    sampleEl.innerHTML = `<span class="sample-badge sample-badge--${item.sampleStatus}">${SAMPLE_STATUS_LABELS[item.sampleStatus]}</span>`;
    sampleEl.style.display = '';
  } else {
    sampleEl.style.display = 'none';
  }

  const specKeys = [
    ['sku', 'SKU'],
    ['type', 'Type'],
    ...Object.keys(item)
      .filter(k => !SKIP_KEYS.has(k) && SPEC_LABELS[k])
      .map(k => [k, SPEC_LABELS[k]]),
  ];

  overlayEl.querySelector('#mSpecs').innerHTML = specKeys
    .slice(0, 6)
    .map(([k, l]) => `
      <div class="spec-cell">
        <div class="spec-label">${l}</div>
        <div class="spec-value">${item[k] || '—'}</div>
      </div>
    `)
    .join('');

  const currentRoomId = roomContext?.roomId || null;
  const btnBoard = overlayEl.querySelector('#btnBoard');
  function updateBtn() {
    const onBoard = isOnBoard(item.sku, currentRoomId);
    btnBoard.textContent = onBoard ? 'Remove from Collection' : 'Add to Collection';
    btnBoard.className = onBoard ? 'btn btn-secondary' : 'btn btn-primary';
  }
  updateBtn();

  btnBoard.onclick = () => {
    if (isOnBoard(item.sku, currentRoomId)) {
      removeFromBoard(item.sku, currentRoomId);
    } else {
      addToBoard(category.id, category.label, item, roomContext);
    }
    closeModal();
  };

  const unsub = onBoardChange(updateBtn);

  overlayEl._unsub = unsub;
  const vis = overlayEl.querySelector('#modalVisual');
  if (item.featureImage) {
    vis.innerHTML = '';
    const img = document.createElement('img');
    img.src = item.featureImage;
    img.alt = item.name;
    vis.appendChild(img);
    vis.style.backgroundColor = '';
  } else {
    vis.innerHTML = '';
    vis.style.backgroundColor = item.colors?.[0] || '#c8b89a';
  }

  overlayEl.classList.add('open');
}

export function closeModal() {
  if (!overlayEl) return;
  overlayEl.classList.remove('open');
  if (overlayEl._unsub) {
    overlayEl._unsub();
    overlayEl._unsub = null;
  }
}

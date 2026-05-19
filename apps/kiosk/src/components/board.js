import { getBoardByCategory, getBoardItems, getBoardCount, removeFromBoard, toggleBoardItemRoom, getBoardItemRooms, clearBoard, onBoardChange, getSelectedFloorPlan, setSelectedFloorPlan } from '../services/board.js';
import { exportBoardPDF } from '../services/pdf.js';
import { getFloorPlans, onSettingsChange } from '../services/settings.js';
import { submitSampleRequest } from '../services/sample-request.js';
import { saveCollection } from '../services/saved-collections.js';
import { SAMPLE_STATUS_LABELS } from '../data/materials.js';

let panelEl = null;
let onSaveCollectionCb = null;
let lastSavedCollection = null;

export function mountBoard(parent, { onSaveCollection } = {}) {
  onSaveCollectionCb = onSaveCollection || null;
  panelEl = document.createElement('aside');
  panelEl.className = 'board-panel';
  panelEl.id = 'boardPanel';
  panelEl.innerHTML = `
    <div class="board-header">
      <div class="board-header-top">
        <div>
          <div class="board-title">My Collection</div>
          <div class="board-subtitle" id="boardSubtitle">0 selections</div>
        </div>
        <select class="board-fp-select" id="boardFpSelect">
          <option value="">No Floor Plan</option>
        </select>
      </div>
    </div>
    <div class="board-body" id="boardBody"></div>
    <div class="board-footer" id="boardFooter">
      <button class="btn btn-primary btn-request-samples" id="btnRequestSamples">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px;flex-shrink:0;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        Request Samples
      </button>
      <button class="btn btn-secondary btn-save-collection" id="btnSaveCollection">Save Collection</button>
      <div class="board-footer-row">
        <button class="btn btn-secondary" id="btnExportPDF">Export PDF</button>
        <button class="btn btn-secondary" id="btnClearBoard">Clear Collection</button>
      </div>
    </div>
  `;

  panelEl.querySelector('#btnExportPDF').addEventListener('click', () => {
    if (getBoardCount() === 0) return;
    if (lastSavedCollection) {
      exportBoardPDF(lastSavedCollection);
    } else {
      onSaveCollectionCb?.((record) => {
        lastSavedCollection = record;
        exportBoardPDF(record);
      });
    }
  });
  panelEl.querySelector('#btnSaveCollection').addEventListener('click', () => {
    if (getBoardCount() === 0) return;
    onSaveCollectionCb?.((record) => {
      lastSavedCollection = record;
    });
  });
  panelEl.querySelector('#btnRequestSamples').addEventListener('click', () => {
    if (getBoardCount() === 0) return;
    showRequestSamplesModal();
  });
  panelEl.querySelector('#btnClearBoard').addEventListener('click', () => {
    if (getBoardCount() === 0) return;
    showClearConfirm();
  });
  panelEl.querySelector('#boardFpSelect').addEventListener('change', (e) => {
    setSelectedFloorPlan(e.target.value);
  });

  parent.appendChild(panelEl);

  onBoardChange(renderBoardContents);
  onSettingsChange(renderBoardContents);
  renderBoardContents();
}

export function toggleBoard() {
  if (!panelEl) return;
  const isOpen = panelEl.classList.toggle('open');
  document.querySelector('.content')?.classList.toggle('board-open', isOpen);
}

export function isBoardOpen() {
  return panelEl?.classList.contains('open') ?? false;
}

function renderBoardContents() {
  if (!panelEl) return;
  const body = panelEl.querySelector('#boardBody');
  const subtitle = panelEl.querySelector('#boardSubtitle');
  const fpSelect = panelEl.querySelector('#boardFpSelect');
  const count = getBoardCount();
  subtitle.textContent = `${count} selection${count !== 1 ? 's' : ''}`;

  const plans = getFloorPlans();
  const selectedFpId = getSelectedFloorPlan();
  fpSelect.innerHTML = `<option value="">No Floor Plan</option>` +
    plans.map(fp => `<option value="${fp.id}" ${fp.id === selectedFpId ? 'selected' : ''}>${fp.name}</option>`).join('');

  const selectedPlan = selectedFpId ? plans.find(fp => fp.id === selectedFpId) : null;

  const grouped = getBoardByCategory();
  const catIds = Object.keys(grouped);

  if (catIds.length === 0) {
    body.innerHTML = `
      <div class="board-empty">
        <div class="board-empty-icon">📋</div>
        <div class="board-empty-text">No selections yet</div>
        <div class="board-empty-hint">Tap + on any material to add it here</div>
      </div>
    `;
    return;
  }

  body.innerHTML = '';
  for (const catId of catIds) {
    const { label, items } = grouped[catId];

    const section = document.createElement('div');
    section.className = 'board-category';

    const catLabel = document.createElement('div');
    catLabel.className = 'board-cat-label';
    catLabel.textContent = label;
    section.appendChild(catLabel);

    for (const item of items) {
      const hasRooms = selectedPlan && selectedPlan.rooms.length > 0;
      const row = document.createElement('div');
      row.className = 'board-item' + (hasRooms ? ' board-item-vertical' : '');

      let swatch;
      if (item.featureImage) {
        swatch = document.createElement('img');
        swatch.className = 'board-item-swatch';
        swatch.src = item.featureImage;
        swatch.alt = item.name;
      } else {
        swatch = document.createElement('div');
        swatch.className = 'board-item-swatch';
        swatch.style.backgroundColor = item.colors?.[0] || '#c8b89a';
      }

      const topRow = document.createElement('div');
      topRow.className = 'board-item-top';

      const info = document.createElement('div');
      info.className = 'board-item-info';
      info.innerHTML = `
        <div class="board-item-name">${item.name}</div>
        <div class="board-item-sku">${item.sku}</div>
      `;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'board-item-remove';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', () => removeFromBoard(item.sku));

      if (hasRooms) {
        topRow.appendChild(swatch);
        topRow.appendChild(info);
        topRow.appendChild(removeBtn);
        row.appendChild(topRow);

        const assignedRoomIds = getBoardItemRooms(item.sku, selectedFpId);
        const roomChecks = document.createElement('div');
        roomChecks.className = 'board-room-checks';
        for (const r of selectedPlan.rooms) {
          const label = document.createElement('label');
          label.className = 'board-room-check' + (assignedRoomIds.includes(r.id) ? ' checked' : '');
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = assignedRoomIds.includes(r.id);
          cb.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleBoardItemRoom(item.sku, r.id, selectedFpId);
          });
          label.appendChild(cb);
          label.appendChild(document.createTextNode(r.name));
          roomChecks.appendChild(label);
        }
        row.appendChild(roomChecks);

        const cost = parseFloat(item.costPerUnit);
        if (cost > 0) {
          let totalCost = 0;
          if (item.costType === 'sqft') {
            for (const rId of assignedRoomIds) {
              const room = selectedPlan.rooms.find(r => r.id === rId);
              if (room?.sqft > 0) totalCost += cost * room.sqft;
            }
          } else {
            totalCost = cost * assignedRoomIds.length;
          }
          const costEl = document.createElement('div');
          costEl.className = 'board-item-cost';
          if (totalCost > 0) {
            costEl.textContent = `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} est.`;
          } else {
            costEl.textContent = item.costType === 'sqft' ? `$${cost.toFixed(2)}/sqft` : `$${cost.toFixed(2)} each`;
          }
          row.appendChild(costEl);
        }
      } else {
        row.appendChild(swatch);
        row.appendChild(info);
        const cost = parseFloat(item.costPerUnit);
        if (cost > 0) {
          const costEl = document.createElement('div');
          costEl.className = 'board-item-cost';
          costEl.textContent = item.costType === 'sqft' ? `$${cost.toFixed(2)}/sqft` : `$${cost.toFixed(2)} each`;
          info.appendChild(costEl);
        }
        row.appendChild(removeBtn);
      }

      section.appendChild(row);
    }

    body.appendChild(section);
  }
}

function showClearConfirm() {
  if (!panelEl || document.querySelector('.board-confirm')) return;

  const overlay = document.createElement('div');
  overlay.className = 'board-confirm';
  overlay.innerHTML = `
    <div class="board-confirm-card">
      <div class="board-confirm-title">Clear Collection?</div>
      <div class="board-confirm-text">This will remove all selections and room assignments. This action cannot be undone.</div>
      <div class="board-confirm-actions">
        <button class="btn btn-secondary" id="confirmCancel">Cancel</button>
        <button class="btn btn-danger" id="confirmClear">Clear Collection</button>
      </div>
    </div>
  `;

  overlay.querySelector('#confirmCancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#confirmClear').addEventListener('click', () => {
    clearBoard();
    lastSavedCollection = null;
    overlay.remove();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

function showRequestSamplesModal() {
  if (document.querySelector('.board-confirm')) return;

  const items = getBoardItems();
  const count = items.length;

  const itemRows = items.map(item => {
    const status = item.sampleStatus && SAMPLE_STATUS_LABELS[item.sampleStatus]
      ? `<span class="sample-badge sample-badge--${item.sampleStatus}">${SAMPLE_STATUS_LABELS[item.sampleStatus]}</span>`
      : `<span class="sr-summary-na">—</span>`;
    const swatch = item.featureImage
      ? `<img class="sr-summary-swatch" src="${item.featureImage}" alt="${item.name}">`
      : `<div class="sr-summary-swatch" style="background:${item.colors?.[0] || '#c8b89a'}"></div>`;
    return `<div class="sr-summary-item">
      ${swatch}
      <div class="sr-summary-info">
        <div class="sr-summary-name">${item.name}</div>
        <div class="sr-summary-sku">${item.sku}</div>
      </div>
      <div class="sr-summary-status">${status}</div>
    </div>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.className = 'board-confirm';
  overlay.innerHTML = `
    <div class="board-confirm-card sr-modal-wide">
      <div class="sr-layout">
        <div class="sr-layout-form">
          <div class="board-confirm-title">Request Samples</div>
          <div class="board-confirm-text">Provide your contact information and we'll prepare ${count} sample${count !== 1 ? 's' : ''} for you.</div>
          <form id="sampleRequestForm" class="sample-request-form">
            <div class="sr-field">
              <label for="srEmail">Email Address</label>
              <input type="email" id="srEmail" required placeholder="email@example.com">
            </div>
            <div class="sr-row">
              <div class="sr-field">
                <label for="srFirst">First Name</label>
                <input type="text" id="srFirst" required placeholder="First">
              </div>
              <div class="sr-field">
                <label for="srLast">Last Name</label>
                <input type="text" id="srLast" required placeholder="Last">
              </div>
            </div>
            <div class="sr-field">
              <label for="srPhone">Phone Number</label>
              <input type="tel" id="srPhone" placeholder="(555) 555-5555">
            </div>
            <div class="sr-divider"></div>
            <div class="sr-section-label">Shipping Address</div>
            <div class="sr-field">
              <label for="srStreet1">Street Address</label>
              <input type="text" id="srStreet1" required placeholder="123 Main St">
            </div>
            <div class="sr-field">
              <label for="srStreet2">Apt / Suite / Unit</label>
              <input type="text" id="srStreet2" placeholder="Apt 4B">
            </div>
            <div class="sr-row sr-row--address">
              <div class="sr-field">
                <label for="srCity">City</label>
                <input type="text" id="srCity" required placeholder="City">
              </div>
              <div class="sr-field">
                <label for="srState">State</label>
                <select id="srState" required class="sr-select">
                  <option value="">—</option>
                  <option value="AL">AL</option><option value="AK">AK</option><option value="AZ">AZ</option><option value="AR">AR</option>
                  <option value="CA">CA</option><option value="CO">CO</option><option value="CT">CT</option><option value="DE">DE</option>
                  <option value="FL">FL</option><option value="GA">GA</option><option value="HI">HI</option><option value="ID">ID</option>
                  <option value="IL">IL</option><option value="IN">IN</option><option value="IA">IA</option><option value="KS">KS</option>
                  <option value="KY">KY</option><option value="LA">LA</option><option value="ME">ME</option><option value="MD">MD</option>
                  <option value="MA">MA</option><option value="MI">MI</option><option value="MN">MN</option><option value="MS">MS</option>
                  <option value="MO">MO</option><option value="MT">MT</option><option value="NE">NE</option><option value="NV">NV</option>
                  <option value="NH">NH</option><option value="NJ">NJ</option><option value="NM">NM</option><option value="NY">NY</option>
                  <option value="NC">NC</option><option value="ND">ND</option><option value="OH">OH</option><option value="OK">OK</option>
                  <option value="OR">OR</option><option value="PA">PA</option><option value="RI">RI</option><option value="SC">SC</option>
                  <option value="SD">SD</option><option value="TN">TN</option><option value="TX">TX</option><option value="UT">UT</option>
                  <option value="VT">VT</option><option value="VA">VA</option><option value="WA">WA</option><option value="WV">WV</option>
                  <option value="WI">WI</option><option value="WY">WY</option><option value="DC">DC</option>
                </select>
              </div>
              <div class="sr-field">
                <label for="srZip">ZIP</label>
                <input type="text" id="srZip" required placeholder="17401" pattern="\\d{5}(-\\d{4})?" maxlength="10">
              </div>
            </div>
            <div class="board-confirm-actions">
              <button type="button" class="btn btn-secondary" id="srCancel">Cancel</button>
              <button type="submit" class="btn btn-primary" id="srSubmit">Submit Request</button>
            </div>
          </form>
        </div>
        <div class="sr-layout-summary">
          <div class="sr-summary-header">
            <div class="sr-summary-title">Your Samples</div>
            <div class="sr-summary-count">${count} item${count !== 1 ? 's' : ''}</div>
          </div>
          <div class="sr-summary-list">${itemRows}</div>
        </div>
      </div>
    </div>
  `;

  overlay.querySelector('#srCancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#sampleRequestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = overlay.querySelector('#srSubmit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const userInfo = {
      email: overlay.querySelector('#srEmail').value,
      firstName: overlay.querySelector('#srFirst').value,
      lastName: overlay.querySelector('#srLast').value,
      phone: overlay.querySelector('#srPhone').value,
      address: {
        street1: overlay.querySelector('#srStreet1').value.trim(),
        street2: overlay.querySelector('#srStreet2').value.trim(),
        city: overlay.querySelector('#srCity').value.trim(),
        state: overlay.querySelector('#srState').value,
        zip: overlay.querySelector('#srZip').value.trim(),
      },
    };

    try {
      await submitSampleRequest(userInfo, items);
      await saveCollection(userInfo, items, `Sample Request — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
      overlay.querySelector('.board-confirm-card').innerHTML = `
        <div class="sr-success">
          <div class="sr-success-icon">✓</div>
          <div class="board-confirm-title">Request Submitted</div>
          <div class="board-confirm-text">Your sample request has been sent to our team. We'll reach out to you at <strong>${userInfo.email}</strong> with next steps.</div>
          <div class="board-confirm-actions">
            <button class="btn btn-primary" id="srDone">Done</button>
          </div>
        </div>
      `;
      overlay.querySelector('#srDone').addEventListener('click', () => overlay.remove());
    } catch (err) {
      console.error('Sample request failed:', err);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Request';
      const errEl = overlay.querySelector('.sr-error') || document.createElement('div');
      errEl.className = 'sr-error';
      errEl.textContent = 'Something went wrong. Please try again.';
      overlay.querySelector('#sampleRequestForm').prepend(errEl);
    }
  });

  document.body.appendChild(overlay);
}

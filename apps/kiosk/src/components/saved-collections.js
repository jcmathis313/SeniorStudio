import { saveCollection, getCollectionsByEmail } from '../services/saved-collections.js';
import { getBoardItems, getBoardCount, setBoardItems } from '../services/board.js';

let overlayEl = null;

export function mountSavedCollections(parent) {
  overlayEl = document.createElement('div');
  overlayEl.className = 'sc-overlay';
  overlayEl.id = 'savedCollectionsOverlay';
  parent.appendChild(overlayEl);
}

/* ─── SAVE FLOW ─── */

export function openSaveModal(onSave) {
  if (!overlayEl) return;
  overlayEl.innerHTML = `
    <div class="sc-modal">
      <div class="sc-modal-header">
        <h2 class="sc-modal-title">Save Collection</h2>
        <button class="sc-close-btn" id="scClose">✕</button>
      </div>
      <form class="sc-form" id="scSaveForm">
        <div class="sc-field">
          <label class="sc-label" for="scEmail">Email Address</label>
          <input class="sc-input" type="email" id="scEmail" required placeholder="email@example.com">
        </div>
        <div class="sc-row">
          <div class="sc-field">
            <label class="sc-label" for="scFirst">First Name</label>
            <input class="sc-input" type="text" id="scFirst" required placeholder="First">
          </div>
          <div class="sc-field">
            <label class="sc-label" for="scLast">Last Name</label>
            <input class="sc-input" type="text" id="scLast" required placeholder="Last">
          </div>
        </div>
        <div class="sc-field">
          <label class="sc-label" for="scPhone">Phone Number</label>
          <input class="sc-input" type="tel" id="scPhone" placeholder="(555) 555-5555">
        </div>
        <div class="sc-form-footer">
          <button type="button" class="btn btn-secondary" id="scCancelSave">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Collection</button>
        </div>
      </form>
    </div>
  `;

  overlayEl.classList.add('open');

  overlayEl.querySelector('#scClose').addEventListener('click', closeSCModal);
  overlayEl.querySelector('#scCancelSave').addEventListener('click', closeSCModal);
  overlayEl.addEventListener('click', (e) => { if (e.target === overlayEl) closeSCModal(); });

  overlayEl.querySelector('#scSaveForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = overlayEl.querySelector('#scEmail').value;
    const firstName = overlayEl.querySelector('#scFirst').value;
    const lastName = overlayEl.querySelector('#scLast').value;
    const phone = overlayEl.querySelector('#scPhone').value;

    const items = getBoardItems();
    const record = saveCollection({ email, firstName, lastName, phone }, items);
    if (onSave) onSave(record);
    showSaveSuccess();
  });
}

function showSaveSuccess() {
  overlayEl.innerHTML = `
    <div class="sc-modal sc-modal-sm">
      <div class="sc-success">
        <div class="sc-success-icon">✓</div>
        <div class="sc-success-title">Collection Saved</div>
        <div class="sc-success-text">Your collection has been saved and can be loaded anytime using your email address.</div>
        <button class="btn btn-primary" id="scSuccessDone" style="margin-top:20px;width:100%;">Done</button>
      </div>
    </div>
  `;
  overlayEl.querySelector('#scSuccessDone').addEventListener('click', closeSCModal);
}

/* ─── LOAD FLOW ─── */

export function openLoadModal() {
  if (!overlayEl) return;
  overlayEl.innerHTML = `
    <div class="sc-modal">
      <div class="sc-modal-header">
        <h2 class="sc-modal-title">Saved Collections</h2>
        <button class="sc-close-btn" id="scClose">✕</button>
      </div>
      <form class="sc-form" id="scLookupForm">
        <div class="sc-field">
          <label class="sc-label" for="scLookupEmail">Enter your email to find saved collections</label>
          <input class="sc-input" type="email" id="scLookupEmail" required placeholder="email@example.com">
        </div>
        <div class="sc-form-footer">
          <button type="button" class="btn btn-secondary" id="scCancelLookup">Cancel</button>
          <button type="submit" class="btn btn-primary">Look Up</button>
        </div>
      </form>
    </div>
  `;

  overlayEl.classList.add('open');

  overlayEl.querySelector('#scClose').addEventListener('click', closeSCModal);
  overlayEl.querySelector('#scCancelLookup').addEventListener('click', closeSCModal);
  overlayEl.addEventListener('click', (e) => { if (e.target === overlayEl) closeSCModal(); });

  overlayEl.querySelector('#scLookupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = overlayEl.querySelector('#scLookupEmail').value;
    showCollectionsList(email);
  });
}

function showCollectionsList(email) {
  const collections = getCollectionsByEmail(email);

  if (collections.length === 0) {
    overlayEl.innerHTML = `
      <div class="sc-modal sc-modal-sm">
        <div class="sc-modal-header">
          <h2 class="sc-modal-title">No Collections Found</h2>
          <button class="sc-close-btn" id="scClose">✕</button>
        </div>
        <div class="sc-empty">
          <div class="sc-empty-text">No saved collections were found for <strong>${escHtml(email)}</strong>.</div>
          <div class="sc-form-footer" style="margin-top:20px;">
            <button class="btn btn-secondary" id="scBackToLookup">Try Again</button>
            <button class="btn btn-primary" id="scCloseEmpty">Close</button>
          </div>
        </div>
      </div>
    `;
    overlayEl.querySelector('#scClose').addEventListener('click', closeSCModal);
    overlayEl.querySelector('#scCloseEmpty').addEventListener('click', closeSCModal);
    overlayEl.querySelector('#scBackToLookup').addEventListener('click', openLoadModal);
    return;
  }

  // Sort newest first
  const sorted = [...collections].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  const userName = sorted[0].firstName + ' ' + sorted[0].lastName;

  overlayEl.innerHTML = `
    <div class="sc-modal">
      <div class="sc-modal-header">
        <h2 class="sc-modal-title">${escHtml(userName)}'s Collections</h2>
        <button class="sc-close-btn" id="scClose">✕</button>
      </div>
      <div class="sc-list" id="scList"></div>
    </div>
  `;

  const list = overlayEl.querySelector('#scList');

  for (const col of sorted) {
    const date = new Date(col.savedAt);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const row = document.createElement('div');
    row.className = 'sc-list-item';
    row.innerHTML = `
      <div class="sc-list-item-info">
        <div class="sc-list-item-date">${dateStr} at ${timeStr}</div>
        <div class="sc-list-item-count">${col.items.length} item${col.items.length !== 1 ? 's' : ''}</div>
      </div>
      <button class="btn btn-primary btn-sm">Load</button>
    `;
    row.querySelector('button').addEventListener('click', () => handleLoadCollection(col));
    list.appendChild(row);
  }

  overlayEl.querySelector('#scClose').addEventListener('click', closeSCModal);
}

function handleLoadCollection(collection) {
  const currentCount = getBoardCount();

  if (currentCount > 0) {
    // Prompt to save current collection first
    overlayEl.innerHTML = `
      <div class="sc-modal sc-modal-sm">
        <div class="sc-modal-header">
          <h2 class="sc-modal-title">Save Current Collection?</h2>
        </div>
        <div class="sc-prompt-text">You have ${currentCount} item${currentCount !== 1 ? 's' : ''} in your current collection. Would you like to save it before loading a new one?</div>
        <div class="sc-prompt-actions">
          <button class="btn btn-secondary" id="scPromptNo">No, Load New</button>
          <button class="btn btn-primary" id="scPromptYes">Yes, Save First</button>
        </div>
      </div>
    `;

    overlayEl.querySelector('#scPromptYes').addEventListener('click', () => {
      // Show save form, then load after saving
      showSaveBeforeLoad(collection);
    });
    overlayEl.querySelector('#scPromptNo').addEventListener('click', () => {
      loadCollectionItems(collection);
    });
  } else {
    loadCollectionItems(collection);
  }
}

function showSaveBeforeLoad(collectionToLoad) {
  overlayEl.innerHTML = `
    <div class="sc-modal">
      <div class="sc-modal-header">
        <h2 class="sc-modal-title">Save Current Collection</h2>
      </div>
      <form class="sc-form" id="scSaveBeforeForm">
        <div class="sc-field">
          <label class="sc-label" for="scEmail2">Email Address</label>
          <input class="sc-input" type="email" id="scEmail2" required placeholder="email@example.com">
        </div>
        <div class="sc-row">
          <div class="sc-field">
            <label class="sc-label" for="scFirst2">First Name</label>
            <input class="sc-input" type="text" id="scFirst2" required placeholder="First">
          </div>
          <div class="sc-field">
            <label class="sc-label" for="scLast2">Last Name</label>
            <input class="sc-input" type="text" id="scLast2" required placeholder="Last">
          </div>
        </div>
        <div class="sc-field">
          <label class="sc-label" for="scPhone2">Phone Number</label>
          <input class="sc-input" type="tel" id="scPhone2" placeholder="(555) 555-5555">
        </div>
        <div class="sc-form-footer">
          <button type="button" class="btn btn-secondary" id="scSkipSave">Skip</button>
          <button type="submit" class="btn btn-primary">Save & Load</button>
        </div>
      </form>
    </div>
  `;

  overlayEl.querySelector('#scSkipSave').addEventListener('click', () => {
    loadCollectionItems(collectionToLoad);
  });

  overlayEl.querySelector('#scSaveBeforeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = overlayEl.querySelector('#scEmail2').value;
    const firstName = overlayEl.querySelector('#scFirst2').value;
    const lastName = overlayEl.querySelector('#scLast2').value;
    const phone = overlayEl.querySelector('#scPhone2').value;

    saveCollection({ email, firstName, lastName, phone }, getBoardItems());
    loadCollectionItems(collectionToLoad);
  });
}

function loadCollectionItems(collection) {
  setBoardItems(collection.items);
  closeSCModal();
}

function closeSCModal() {
  if (!overlayEl) return;
  overlayEl.classList.remove('open');
}

function escHtml(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

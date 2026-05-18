import {
  getSettings, updateSettings, getAllCategories, addCategory, updateCategory,
  removeCategory, setCategoryEnabled, addItem, updateItem, removeItem,
  getFloorPlans, addFloorPlan, updateFloorPlan, removeFloorPlan,
  addRoomToFloorPlan, updateRoomInFloorPlan, removeRoomFromFloorPlan,
} from '../services/settings.js';

let activeTab = 'options';
let editingCatId = null;
let showItemForm = false;
let editingItemSku = null;
let selectedFloorPlanId = null;

export function renderSettings(container) {
  const s = getSettings();
  const prevScroll = container.querySelector('#settingsBody')?.scrollTop || 0;
  container.innerHTML = `
    <div class="settings-page">
      <div class="settings-header">
        <div class="settings-title">Settings</div>
      </div>
      <div class="settings-tabs">
        <button class="settings-tab ${activeTab === 'options' ? 'active' : ''}" data-tab="options">Options</button>
        <button class="settings-tab ${activeTab === 'floorplans' ? 'active' : ''}" data-tab="floorplans">Floor Plans</button>
        <button class="settings-tab ${activeTab === 'organization' ? 'active' : ''}" data-tab="organization">Organization</button>
      </div>
      <div class="settings-body" id="settingsBody"></div>
    </div>
  `;

  container.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      renderSettings(container);
    });
  });

  const body = container.querySelector('#settingsBody');
  if (activeTab === 'options') renderOptionsTab(body, s, container);
  else if (activeTab === 'floorplans') renderFloorPlansTab(body, s, container);
  else renderOrgTab(body, s, container);
  requestAnimationFrame(() => { body.scrollTop = prevScroll; });
}

// ── OPTIONS TAB ──

function renderOptionsTab(body, s, root) {
  body.innerHTML = '';
  const cats = getAllCategories();

  // Category visibility + management
  const sec1 = section('Categories', 'Toggle visibility, rename, or remove categories.');
  const table = el('table', 'settings-table');
  table.innerHTML = `<thead><tr>
    <th>Category</th><th>Items</th><th>Visible</th><th></th>
  </tr></thead>`;
  const tbody = el('tbody');

  cats.forEach(cat => {
    const tr = el('tr');

    const tdName = el('td');
    tdName.textContent = `${cat.icon}  ${cat.label}`;
    tdName.style.fontWeight = '500';

    const tdCount = el('td');
    tdCount.textContent = cat.items.length;

    const tdToggle = el('td');
    const toggle = el('button', `toggle ${cat.enabled ? 'on' : ''}`);
    toggle.addEventListener('click', () => {
      setCategoryEnabled(cat.id, !cat.enabled);
      renderSettings(root);
    });
    tdToggle.appendChild(toggle);

    const tdActions = el('td', 'table-actions');
    const editBtn = el('button', 'item-action-btn');
    editBtn.textContent = '✎';
    editBtn.title = 'Rename';
    editBtn.addEventListener('click', () => {
      const newName = prompt('Category name:', cat.label);
      if (newName && newName.trim()) {
        updateCategory(cat.id, { label: newName.trim() });
        renderSettings(root);
      }
    });
    const removeBtn = el('button', 'item-action-btn delete');
    removeBtn.textContent = '✕';
    removeBtn.title = 'Delete category';
    removeBtn.addEventListener('click', () => {
      if (!confirm(`Delete "${cat.label}" and all its items?`)) return;
      removeCategory(cat.id);
      if (editingCatId === cat.id) editingCatId = null;
      renderSettings(root);
    });
    tdActions.appendChild(editBtn);
    tdActions.appendChild(removeBtn);

    tr.appendChild(tdName);
    tr.appendChild(tdCount);
    tr.appendChild(tdToggle);
    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  sec1.appendChild(table);

  const form = el('div', 'add-form');
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'New category name...';
  const addBtn = el('button', 'btn btn-primary');
  addBtn.textContent = 'Add Category';
  addBtn.style.padding = '10px 20px';
  addBtn.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) return;
    addCategory(name);
    renderSettings(root);
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });
  form.appendChild(input);
  form.appendChild(addBtn);
  sec1.appendChild(form);
  body.appendChild(sec1);

  // Catalog item editor
  const sec2 = section('Catalog Items', 'Edit items within any category. In a future release, items will sync from CSV upload or an external database.');

  const toolbar = el('div', 'cat-editor-toolbar');

  const select = document.createElement('select');
  select.className = 'cat-editor-select';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Select a category...';
  select.appendChild(defaultOpt);

  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.label;
    if (cat.id === editingCatId) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    editingCatId = select.value || null;
    showItemForm = false;
    editingItemSku = null;
    renderSettings(root);
  });
  toolbar.appendChild(select);

  if (editingCatId) {
    const csvActions = el('div', 'csv-actions');

    const dlBtn = el('button', 'btn btn-secondary');
    dlBtn.textContent = '↓ Download CSV';
    dlBtn.style.cssText = 'padding:8px 16px;font-size:13px;';
    dlBtn.addEventListener('click', () => {
      const cat = cats.find(c => c.id === editingCatId);
      if (cat) downloadCsv(cat);
    });

    const ulLabel = el('label', 'btn btn-secondary');
    ulLabel.textContent = '↑ Upload CSV';
    ulLabel.style.cssText = 'padding:8px 16px;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,text/csv';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (e) => {
      const cat = cats.find(c => c.id === editingCatId);
      if (cat) handleCsvUpload(e, cat, root);
    });
    ulLabel.appendChild(fileInput);

    csvActions.appendChild(dlBtn);
    csvActions.appendChild(ulLabel);
    toolbar.appendChild(csvActions);
  }

  sec2.appendChild(toolbar);

  if (editingCatId) {
    const cat = cats.find(c => c.id === editingCatId);
    if (cat) renderCatalogItems(sec2, cat, root);
  }

  body.appendChild(sec2);
}

function renderCatalogItems(container, cat, root) {
  if (editingItemSku) {
    const item = cat.items.find(i => i.sku === editingItemSku);
    if (item) {
      container.appendChild(buildItemForm(cat, item, root));
      return;
    }
  }

  if (cat.items.length > 0) {
    const table = el('table', 'settings-table');
    table.innerHTML = `<thead><tr>
      <th></th><th>Name</th><th>Brand</th><th>SKU</th><th>Type</th><th>Cost</th><th></th>
    </tr></thead>`;
    const tbody = el('tbody');

    cat.items.forEach(item => {
      const tr = el('tr');

      const tdSwatch = el('td');
      if (item.featureImage) {
        const img = document.createElement('img');
        img.className = 'table-swatch';
        img.src = item.featureImage;
        img.alt = item.name;
        tdSwatch.appendChild(img);
      } else {
        const swatch = el('div', 'table-swatch');
        swatch.style.backgroundColor = item.colors?.[0] || '#c8b89a';
        tdSwatch.appendChild(swatch);
      }

      const tdName = el('td');
      tdName.textContent = item.name;
      tdName.style.fontWeight = '600';

      const tdBrand = el('td');
      tdBrand.textContent = item.brand || '—';

      const tdSku = el('td', 'table-mono');
      tdSku.textContent = item.sku;

      const tdType = el('td');
      tdType.textContent = item.type || '—';

      const tdCost = el('td', 'table-mono');
      const cost = parseFloat(item.costPerUnit);
      if (cost > 0) {
        tdCost.textContent = item.costType === 'sqft' ? `$${cost.toFixed(2)}/sqft` : `$${cost.toFixed(2)} ea`;
      } else {
        tdCost.textContent = '—';
      }

      const tdActions = el('td', 'table-actions');
      const editBtn = el('button', 'item-action-btn');
      editBtn.textContent = '✎';
      editBtn.title = 'Edit item';
      editBtn.addEventListener('click', () => {
        editingItemSku = item.sku;
        showItemForm = false;
        renderSettings(root);
      });
      const delBtn = el('button', 'item-action-btn delete');
      delBtn.textContent = '✕';
      delBtn.title = 'Delete item';
      delBtn.addEventListener('click', () => {
        removeItem(cat.id, item.sku);
        renderSettings(root);
      });
      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);

      tr.appendChild(tdSwatch);
      tr.appendChild(tdName);
      tr.appendChild(tdBrand);
      tr.appendChild(tdSku);
      tr.appendChild(tdType);
      tr.appendChild(tdCost);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  }

  if (!showItemForm && editingItemSku === null) {
    const addItemBtn = el('button', 'btn btn-secondary');
    addItemBtn.textContent = '+ Add Item';
    addItemBtn.style.cssText = 'padding:10px 20px;margin-top:12px;';
    addItemBtn.addEventListener('click', () => {
      showItemForm = true;
      editingItemSku = null;
      renderSettings(root);
    });
    container.appendChild(addItemBtn);
  }

  if (showItemForm) {
    container.appendChild(buildItemForm(cat, null, root));
  }
}


function buildItemForm(cat, existing, root) {
  const isEdit = !!existing;
  const form = el('div', 'item-form');
  form.innerHTML = `
    <div class="item-form-title">${isEdit ? 'Edit Item' : 'Add New Item'}</div>
    <div class="item-form-grid">
      <div class="form-field">
        <label class="form-label">Name</label>
        <input class="form-input" type="text" id="itemName" value="${esc(existing?.name)}" placeholder="e.g. Walnut Plank">
      </div>
      <div class="form-field">
        <label class="form-label">Brand</label>
        <input class="form-input" type="text" id="itemBrand" value="${esc(existing?.brand)}" placeholder="e.g. Shaw">
      </div>
      <div class="form-field">
        <label class="form-label">SKU</label>
        <input class="form-input" type="text" id="itemSku" value="${esc(existing?.sku)}" placeholder="e.g. SHW-1234" ${isEdit ? 'readonly style="opacity:0.6;"' : ''}>
      </div>
      <div class="form-field">
        <label class="form-label">Type / Sub-filter</label>
        <input class="form-input" type="text" id="itemType" value="${esc(existing?.type)}" placeholder="e.g. LVP">
      </div>
      <div class="form-field">
        <label class="form-label">Finish</label>
        <input class="form-input" type="text" id="itemFinish" value="${esc(existing?.finish)}" placeholder="e.g. Matte">
      </div>
      <div class="form-field">
        <label class="form-label">Swatch Color</label>
        <input class="form-input" type="color" id="itemColor" value="${existing?.colors?.[0] || '#c8b89a'}" style="padding:4px;height:40px;">
      </div>
      <div class="form-field">
        <label class="form-label">Cost Type</label>
        <select class="form-input" id="itemCostType">
          <option value="sqft" ${existing?.costType === 'sqft' ? 'selected' : ''}>Per SQFT</option>
          <option value="each" ${existing?.costType === 'each' ? 'selected' : ''}>Each</option>
        </select>
      </div>
      <div class="form-field">
        <label class="form-label">Cost Per Unit ($)</label>
        <input class="form-input" type="number" id="itemCostPerUnit" value="${existing?.costPerUnit || ''}" placeholder="0.00" min="0" step="0.01">
      </div>
      <div class="form-field full">
        <label class="form-label">Feature Image</label>
        <div class="image-upload-area" id="featureImageArea">
          <label class="image-add-btn" id="featureUploadLabel">+
            <input type="file" accept="image/*" id="featureUpload" style="display:none;">
          </label>
        </div>
        <div class="image-upload-hint">Click to upload a feature image</div>
      </div>
      <div class="form-field full">
        <label class="form-label">Additional Images</label>
        <div class="image-upload-area" id="additionalImagesArea">
          <label class="image-add-btn" id="additionalUploadLabel">+
            <input type="file" accept="image/*" multiple id="additionalUpload" style="display:none;">
          </label>
        </div>
        <div class="image-upload-hint">Click to upload additional images</div>
      </div>
    </div>
    <div class="item-form-actions">
      <button class="btn btn-secondary" id="cancelItem" style="padding:10px 20px;">Cancel</button>
      <button class="btn btn-primary" id="saveItem" style="padding:10px 20px;">${isEdit ? 'Save Changes' : 'Add Item'}</button>
    </div>
  `;

  let featureImage = existing?.featureImage || null;
  let additionalImages = existing?.additionalImages ? [...existing.additionalImages] : [];

  if (featureImage) {
    const area = form.querySelector('#featureImageArea');
    const label = form.querySelector('#featureUploadLabel');
    const img = document.createElement('img');
    img.className = 'image-thumb featured';
    img.src = featureImage;
    area.insertBefore(img, label);
  }
  additionalImages.forEach(src => {
    const area = form.querySelector('#additionalImagesArea');
    const label = form.querySelector('#additionalUploadLabel');
    const img = document.createElement('img');
    img.className = 'image-thumb';
    img.src = src;
    area.insertBefore(img, label);
  });

  form.querySelector('#featureUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      featureImage = await compressImage(reader.result);
      const area = form.querySelector('#featureImageArea');
      const label = form.querySelector('#featureUploadLabel');
      area.querySelectorAll('.image-thumb').forEach(t => t.remove());
      const img = document.createElement('img');
      img.className = 'image-thumb featured';
      img.src = featureImage;
      area.insertBefore(img, label);
    };
    reader.readAsDataURL(file);
  });

  form.querySelector('#additionalUpload').addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = async () => {
        const compressed = await compressImage(reader.result);
        additionalImages.push(compressed);
        const area = form.querySelector('#additionalImagesArea');
        const label = form.querySelector('#additionalUploadLabel');
        const img = document.createElement('img');
        img.className = 'image-thumb';
        img.src = compressed;
        area.insertBefore(img, label);
      };
      reader.readAsDataURL(file);
    });
  });

  form.querySelector('#cancelItem').addEventListener('click', () => {
    showItemForm = false;
    editingItemSku = null;
    renderSettings(root);
  });

  form.querySelector('#saveItem').addEventListener('click', () => {
    const name = form.querySelector('#itemName').value.trim();
    if (!name) return;

    const data = {
      name,
      brand: form.querySelector('#itemBrand').value.trim(),
      sku: form.querySelector('#itemSku').value.trim() || `ITEM-${Date.now()}`,
      type: form.querySelector('#itemType').value.trim() || 'All',
      finish: form.querySelector('#itemFinish').value.trim(),
      badge: existing?.badge || 'standard',
      colors: [form.querySelector('#itemColor').value],
      pat: existing?.pat || 'solid',
      costType: form.querySelector('#itemCostType').value,
      costPerUnit: parseFloat(form.querySelector('#itemCostPerUnit').value) || 0,
      featureImage,
      additionalImages,
    };

    if (isEdit) {
      updateItem(cat.id, existing.sku, data);
    } else {
      addItem(cat.id, data);
    }
    showItemForm = false;
    editingItemSku = null;
    renderSettings(root);
  });

  return form;
}

// ── FLOOR PLANS TAB ──

function renderFloorPlansTab(body, s, root) {
  body.innerHTML = '';
  const plans = getFloorPlans();

  // Floor plan list
  const sec1 = section('Floor Plans', 'Create floor plans (e.g. "One Bedroom with Den") and define the rooms in each.');

  if (plans.length > 0) {
    const list = el('div', 'fp-list');
    plans.forEach(fp => {
      const row = el('div', 'fp-row' + (selectedFloorPlanId === fp.id ? ' active' : ''));

      const left = el('div', 'fp-row-left');
      left.addEventListener('click', () => {
        selectedFloorPlanId = selectedFloorPlanId === fp.id ? null : fp.id;
        renderSettings(root);
      });
      const nameEl = el('div', 'fp-row-name');
      nameEl.textContent = fp.name;
      const countEl = el('div', 'fp-row-count');
      countEl.textContent = `${fp.rooms.length} room${fp.rooms.length !== 1 ? 's' : ''}`;
      left.appendChild(nameEl);
      left.appendChild(countEl);

      const actions = el('div', '', 'display:flex;gap:6px;align-items:center;');

      const editBtn = el('button', 'item-action-btn');
      editBtn.textContent = '✎';
      editBtn.title = 'Rename';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newName = prompt('Floor plan name:', fp.name);
        if (newName && newName.trim()) {
          updateFloorPlan(fp.id, { name: newName.trim() });
          renderSettings(root);
        }
      });

      const delBtn = el('button', 'item-action-btn delete');
      delBtn.textContent = '✕';
      delBtn.title = 'Delete floor plan';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!confirm(`Delete "${fp.name}" and all its rooms?`)) return;
        if (selectedFloorPlanId === fp.id) selectedFloorPlanId = null;
        removeFloorPlan(fp.id);
        renderSettings(root);
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      row.appendChild(left);
      row.appendChild(actions);
      list.appendChild(row);
    });
    sec1.appendChild(list);
  }

  const addRow = el('div', 'add-form');
  const nameIn = document.createElement('input');
  nameIn.type = 'text';
  nameIn.placeholder = 'New floor plan name (e.g. One Bedroom with Den)';
  const addBtn = el('button', 'btn btn-primary');
  addBtn.textContent = 'Add Floor Plan';
  addBtn.style.padding = '10px 20px';

  function doAddPlan() {
    const name = nameIn.value.trim();
    if (!name) return;
    const fp = addFloorPlan(name);
    selectedFloorPlanId = fp.id;
    renderSettings(root);
  }

  addBtn.addEventListener('click', doAddPlan);
  nameIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAddPlan(); });
  addRow.appendChild(nameIn);
  addRow.appendChild(addBtn);
  sec1.appendChild(addRow);
  body.appendChild(sec1);

  // Rooms for selected floor plan
  if (selectedFloorPlanId) {
    const fp = plans.find(f => f.id === selectedFloorPlanId);
    if (fp) {
      const sec2 = section(`Rooms — ${fp.name}`, 'Add rooms and their square footage for this floor plan.');

      if (fp.rooms.length > 0) {
        const table = el('div', 'room-table');
        const header = el('div', 'room-table-header');
        header.innerHTML = `
          <span>Room Name</span>
          <span>Square Footage</span>
          <span></span>
        `;
        table.appendChild(header);

        fp.rooms.forEach(room => {
          const row = el('div', 'room-table-row');

          const nameInput = document.createElement('input');
          nameInput.type = 'text';
          nameInput.className = 'form-input room-input';
          nameInput.value = room.name;
          nameInput.addEventListener('change', () => {
            if (nameInput.value.trim()) updateRoomInFloorPlan(fp.id, room.id, { name: nameInput.value.trim() });
          });

          const sqftInput = document.createElement('input');
          sqftInput.type = 'number';
          sqftInput.className = 'form-input room-input room-input-sqft';
          sqftInput.value = room.sqft || '';
          sqftInput.placeholder = '0';
          sqftInput.min = '0';
          sqftInput.addEventListener('change', () => {
            updateRoomInFloorPlan(fp.id, room.id, { sqft: parseFloat(sqftInput.value) || 0 });
          });

          const delBtn = el('button', 'item-action-btn delete');
          delBtn.textContent = '✕';
          delBtn.title = 'Remove room';
          delBtn.addEventListener('click', () => {
            removeRoomFromFloorPlan(fp.id, room.id);
            renderSettings(root);
          });

          row.appendChild(nameInput);
          row.appendChild(sqftInput);
          row.appendChild(delBtn);
          table.appendChild(row);
        });

        sec2.appendChild(table);
      }

      const roomAddRow = el('div', 'add-form');
      const roomNameIn = document.createElement('input');
      roomNameIn.type = 'text';
      roomNameIn.placeholder = 'Room name (e.g. Living Room)';
      const roomSqftIn = document.createElement('input');
      roomSqftIn.type = 'number';
      roomSqftIn.placeholder = 'Square footage';
      roomSqftIn.min = '0';
      roomSqftIn.style.maxWidth = '160px';
      const roomAddBtn = el('button', 'btn btn-primary');
      roomAddBtn.textContent = 'Add Room';
      roomAddBtn.style.padding = '10px 20px';

      function doAddRoom() {
        const name = roomNameIn.value.trim();
        if (!name) return;
        addRoomToFloorPlan(fp.id, name, parseFloat(roomSqftIn.value) || 0);
        renderSettings(root);
      }

      roomAddBtn.addEventListener('click', doAddRoom);
      roomNameIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAddRoom(); });
      roomSqftIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAddRoom(); });
      roomAddRow.appendChild(roomNameIn);
      roomAddRow.appendChild(roomSqftIn);
      roomAddRow.appendChild(roomAddBtn);
      sec2.appendChild(roomAddRow);
      body.appendChild(sec2);
    }
  }
}

// ── ORGANIZATION TAB ──

function renderOrgTab(body, s, root) {
  body.innerHTML = '';

  const sec1 = section('Community Logo', 'Upload your community logo. It appears in the header and on exported PDFs.');
  const logoArea = el('div', 'logo-upload-area');

  const preview = el('div', 'logo-preview');
  if (s.logo) {
    const img = document.createElement('img');
    img.src = s.logo;
    preview.appendChild(img);
  } else {
    const empty = el('span', 'logo-preview-empty');
    empty.textContent = 'No logo';
    preview.appendChild(empty);
  }
  logoArea.appendChild(preview);

  const uploadWrap = el('div', '');
  const uploadBtn = el('label', 'btn btn-secondary');
  uploadBtn.textContent = 'Upload Logo';
  uploadBtn.style.cssText = 'padding:10px 20px;cursor:pointer;display:inline-block;';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result, 300);
      updateSettings({ logo: compressed });
      renderSettings(root);
    };
    reader.readAsDataURL(file);
  });
  uploadBtn.appendChild(fileInput);
  uploadWrap.appendChild(uploadBtn);

  if (s.logo) {
    const removeBtn = el('button', 'btn btn-secondary');
    removeBtn.textContent = 'Remove';
    removeBtn.style.cssText = 'padding:10px 20px;margin-left:8px;';
    removeBtn.addEventListener('click', () => {
      updateSettings({ logo: null });
      renderSettings(root);
    });
    uploadWrap.appendChild(removeBtn);
  }

  logoArea.appendChild(uploadWrap);
  sec1.appendChild(logoArea);
  body.appendChild(sec1);

  const sec2 = section('Brand Color', 'Set your primary brand color. This updates buttons and accent colors across the app.');
  const colorRow = el('div', 'color-picker-row');

  const colorLabel = el('span', 'color-picker-label');
  colorLabel.textContent = 'Primary Color';

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.className = 'color-picker-input';
  colorInput.value = s.primaryColor;

  const colorHex = el('span', 'color-hex');
  colorHex.textContent = s.primaryColor;

  colorInput.addEventListener('input', (e) => {
    colorHex.textContent = e.target.value;
    updateSettings({ primaryColor: e.target.value });
  });

  colorRow.appendChild(colorLabel);
  colorRow.appendChild(colorInput);
  colorRow.appendChild(colorHex);
  sec2.appendChild(colorRow);

  const resetBtn = el('button', 'btn btn-secondary');
  resetBtn.textContent = 'Reset to Default';
  resetBtn.style.cssText = 'padding:10px 20px;margin-top:12px;';
  resetBtn.addEventListener('click', () => {
    updateSettings({ primaryColor: '#007aff' });
    renderSettings(root);
  });
  sec2.appendChild(resetBtn);
  body.appendChild(sec2);
}

// ── CSV ──

const CSV_HEADERS = ['name', 'brand', 'sku', 'type', 'finish', 'badge', 'color', 'pattern', 'cost_type', 'cost_per_unit'];

function downloadCsv(cat) {
  const rows = cat.items.map(item => [
    item.name || '',
    item.brand || '',
    item.sku || '',
    item.type || '',
    item.finish || '',
    item.badge || '',
    item.colors?.[0] || '',
    item.pat || 'solid',
    item.costType || '',
    item.costPerUnit || '',
  ]);
  const csv = [CSV_HEADERS, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cat.label.replace(/\s+/g, '_')}_items.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleCsvUpload(e, cat, root) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCsv(reader.result);
    if (rows.length < 2) return;
    const hdr = rows[0].map(h => h.trim().toLowerCase());
    const col = (name) => hdr.indexOf(name);
    let added = 0, updated = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r.length || !r.some(c => c.trim())) continue;
      const name = (r[col('name')] || '').trim();
      if (!name) continue;
      const data = {
        name,
        brand:  (r[col('brand')]   || '').trim(),
        sku:    (r[col('sku')]     || '').trim() || `ITEM-${Date.now()}-${i}`,
        type:   (r[col('type')]    || '').trim() || 'All',
        finish: (r[col('finish')]  || '').trim(),
        badge:  (r[col('badge')]   || '').trim() || 'standard',
        colors: [(r[col('color')]  || '').trim() || '#c8b89a'],
        pat:    (r[col('pattern')] || '').trim() || 'solid',
        costType:    (r[col('cost_type')]     || '').trim() || 'sqft',
        costPerUnit: parseFloat((r[col('cost_per_unit')] || '').trim()) || 0,
      };
      if (cat.items.find(it => it.sku === data.sku)) {
        updateItem(cat.id, data.sku, data);
        updated++;
      } else {
        addItem(cat.id, data);
        added++;
      }
    }
    alert(`CSV imported: ${added} added, ${updated} updated.`);
    renderSettings(root);
  };
  reader.readAsText(file);
}

function parseCsv(text) {
  const rows = [];
  let cur = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else { field += ch; }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ',') {
      cur.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      cur.push(field); field = '';
      rows.push(cur); cur = [];
    } else { field += ch; }
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

// ── Helpers ──

function el(tag, className, style) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (style) e.style.cssText = style;
  return e;
}

function section(title, desc) {
  const s = el('div', 'settings-section');
  const t = el('div', 'settings-section-title');
  t.textContent = title;
  s.appendChild(t);
  if (desc) {
    const d = el('div', 'settings-section-desc');
    d.textContent = desc;
    s.appendChild(d);
  }
  return s;
}

function esc(val) {
  return (val || '').replace(/"/g, '&quot;');
}

function compressImage(dataUrl, maxDim = 400) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}


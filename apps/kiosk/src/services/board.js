let items = [];
let listeners = [];
let selectedFloorPlanId = null;

export function getBoardItems() {
  return items;
}

export function getBoardCount() {
  return items.length;
}

export function isOnBoard(sku) {
  return items.some(i => i.sku === sku);
}

export function addToBoard(categoryId, categoryLabel, item) {
  if (isOnBoard(item.sku)) return;
  items.push({ ...item, categoryId, categoryLabel });
  notify();
}

export function removeFromBoard(sku) {
  items = items.filter(i => i.sku !== sku);
  notify();
}

export function toggleBoardItemRoom(sku, roomId, floorPlanId) {
  const item = items.find(i => i.sku === sku);
  if (!item) return;
  if (!item.rooms) item.rooms = {};
  if (!item.rooms[floorPlanId]) item.rooms[floorPlanId] = [];
  const idx = item.rooms[floorPlanId].indexOf(roomId);
  if (idx >= 0) {
    item.rooms[floorPlanId].splice(idx, 1);
    if (item.rooms[floorPlanId].length === 0) delete item.rooms[floorPlanId];
  } else {
    item.rooms[floorPlanId].push(roomId);
  }
  notify();
}

export function getBoardItemRooms(sku, floorPlanId) {
  const item = items.find(i => i.sku === sku);
  if (!item || !item.rooms || !floorPlanId) return [];
  return item.rooms[floorPlanId] || [];
}

export function setBoardItems(newItems) {
  items = newItems.map(i => ({ ...i }));
  notify();
}

export function clearBoard() {
  items = [];
  notify();
}

export function getSelectedFloorPlan() {
  return selectedFloorPlanId;
}

export function setSelectedFloorPlan(fpId) {
  selectedFloorPlanId = fpId || null;
  notify();
}

export function getBoardByCategory() {
  const grouped = {};
  for (const item of items) {
    if (!grouped[item.categoryId]) {
      grouped[item.categoryId] = { label: item.categoryLabel, items: [] };
    }
    grouped[item.categoryId].items.push(item);
  }
  return grouped;
}

export function onBoardChange(cb) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

function notify() {
  listeners.forEach(cb => cb());
}

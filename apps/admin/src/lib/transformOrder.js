export function transformOrder(row) {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    sourceForm: row.source_form,
    requester: row.requester || {},
    shipTo: row.ship_to || {},
    items: row.items || [],
    carrier: row.carrier,
    serviceLevel: row.service_level,
    trackingNumber: row.tracking_number,
    shippedAt: row.shipped_at,
    estimatedDelivery: row.estimated_delivery,
    deliveredAt: row.delivered_at,
    assignedTo: row.assigned_to,
    internalNotes: row.internal_notes || [],
    history: row.history || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CAMEL_TO_SNAKE = {
  sourceForm: 'source_form',
  shipTo: 'ship_to',
  serviceLevel: 'service_level',
  trackingNumber: 'tracking_number',
  shippedAt: 'shipped_at',
  estimatedDelivery: 'estimated_delivery',
  deliveredAt: 'delivered_at',
  assignedTo: 'assigned_to',
  internalNotes: 'internal_notes',
};

export function toSnakeCase(fields) {
  const result = {};
  for (const [key, val] of Object.entries(fields)) {
    result[CAMEL_TO_SNAKE[key] || key] = val;
  }
  return result;
}

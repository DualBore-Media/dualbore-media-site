import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { emptyState } from './memory-repository.mjs';
export { emptyState, initialEmptyState } from './memory-repository.mjs';

// Low-volume store tradeoff: one transaction-scoped advisory lock serializes ALL
// commerce mutations across serverless instances, including reads via this API.
// Every writer must use this repository. This deliberately favors correctness
// over throughput; replace with row-scoped services before high-volume scaling.
const lockSql = 'SELECT pg_advisory_xact_lock(17460290, 1)';
const migrationDirectory = new URL('../../migrations/', import.meta.url);

export async function runMigrations(pool, directory = migrationDirectory) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(lockSql);
    await client.query('CREATE TABLE IF NOT EXISTS commerce_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    const applied = new Map((await client.query('SELECT name, checksum FROM commerce_migrations')).rows.map(row => [row.name, row.checksum]));
    const files = (await readdir(directory)).filter(name => /^\d+_[a-z0-9_-]+\.sql$/.test(name)).sort();
    for (const name of files) {
      const sql = await readFile(new URL(name, directory), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      if (applied.has(name)) {
        if (applied.get(name) !== checksum) throw new Error('Applied commerce migration has changed; create a new migration.');
        continue;
      }
      await client.query(sql);
      await client.query('INSERT INTO commerce_migrations(name, checksum) VALUES ($1, $2)', [name, checksum]);
    }
    await client.query('COMMIT');
    return files;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

const schemas = {
  variants: ['product_variants', 'id', {
    id: 'id', product_id: 'productId', sku: 'sku', product_name: 'name', size: 'size', active: 'active', price_cents: 'priceCents', stripe_price_id: 'stripePriceId', available_quantity: 'availableQuantity', reserved_quantity: 'reservedQuantity', sold_quantity: 'soldQuantity',
  }],
  orders: ['orders', 'id', {
    id: 'id', order_number: 'orderNumber', request_key: 'requestKey', stripe_checkout_session_id: 'sessionId', stripe_payment_intent_id: 'paymentIntentId', customer_email: 'customerEmail', status: 'status', currency: 'currency', subtotal_cents: 'subtotalCents', shipping_cents: 'shippingCents', tax_cents: 'taxCents', total_cents: 'totalCents', shipping_name: 'shippingName', shipping_address_json: 'shippingAddress', created_at: 'createdAt', paid_at: 'paidAt', cancelled_at: 'cancelledAt', fulfilled_at: 'fulfilledAt', carrier: 'carrier', tracking_number: 'trackingNumber', tracking_url: 'trackingUrl', shipped_at: 'shippedAt',
  }],
  events: ['stripe_events', 'stripe_event_id', { stripe_event_id: 'id', event_type: 'type', created_at: 'createdAt', processed_at: 'processedAt', processing_status: 'status' }],
  reservations: ['inventory_reservations', 'id', { id: 'id', order_id: 'orderId', checkout_session_id: 'sessionId', variant_id: 'variantId', quantity: 'quantity', status: 'status', expires_at: 'expiresAt', created_at: 'createdAt', released_at: 'releasedAt', converted_at: 'convertedAt' }],
  emails: ['email_events', 'id', { id: 'id', order_id: 'orderId', email_type: 'emailType', provider: 'provider', provider_message_id: 'providerMessageId', status: 'status', attempt_count: 'attemptCount', last_error: 'lastError', created_at: 'createdAt', sent_at: 'sentAt' }],
};

async function load(client) {
  const state = emptyState();
  for (const [key, [table]] of Object.entries(schemas)) {
    for (const row of (await client.query(`SELECT data FROM ${table}`)).rows) {
      const value = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      state[key][value.id] = value;
    }
  }
  for (const order of Object.values(state.orders)) order.items = [];
  for (const row of (await client.query('SELECT order_id, data FROM order_items ORDER BY order_id, position')).rows) {
    state.orders[row.order_id].items.push(typeof row.data === 'string' ? JSON.parse(row.data) : row.data);
  }
  return state;
}

async function upsert(client, table, primaryKey, fields, object) {
  const columns = [...Object.keys(fields), 'data'];
  const values = [...Object.entries(fields).map(([column, property]) => {
    const value = object[property] ?? null;
    return column === 'shipping_address_json' && value !== null ? JSON.stringify(value) : value;
  }), JSON.stringify(object)];
  // Identifiers come only from the static descriptors above; ALL values are bound.
  await client.query(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')}) ON CONFLICT (${primaryKey}) DO UPDATE SET ${columns.filter(column => column !== primaryKey).map(column => `${column} = EXCLUDED.${column}`).join(', ')}${table === 'product_variants' ? ', updated_at = now()' : ''}`, values);
}

async function persist(client, state) {
  for (const [key, [table, primaryKey, fields]] of Object.entries(schemas)) {
    for (const [id, value] of Object.entries(state[key])) {
      if (value.id !== id) throw new Error('Commerce state map key must match record ID.');
      await upsert(client, table, primaryKey, fields, value);
    }
  }
  // Replace line snapshots atomically in the same transaction, preserving their
  // canonical order and preventing leftover rows after cart/order reconciliation.
  await client.query('DELETE FROM order_items');
  for (const order of Object.values(state.orders)) {
    for (const [position, item] of order.items.entries()) {
      await client.query('INSERT INTO order_items (id, order_id, position, variant_id, sku_snapshot, product_name_snapshot, size_snapshot, quantity, unit_price_cents, line_total_cents, data) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', [`${order.id}:${position}`, order.id, position, item.variantId, item.sku, item.name, item.size, item.quantity, item.unitPriceCents, item.lineTotalCents, JSON.stringify(item)]);
    }
  }
  for (const key of ['emails', 'reservations', 'events', 'orders', 'variants']) {
    const [table, primaryKey] = schemas[key];
    await client.query(`DELETE FROM ${table} WHERE NOT (${primaryKey} = ANY($1::text[]))`, [Object.keys(state[key])]);
  }
}

export function createPostgresRepository(pool) {
  return {
    async transaction(callback) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
        await client.query(lockSql);
        const state = await load(client);
        const result = structuredClone(await callback(state));
        await persist(client, state);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    },
  };
}

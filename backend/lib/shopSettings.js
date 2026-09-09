/** Helpers settings + acceptation commandes */
const prisma = require('../db/prisma');

const DEFAULTS = {
  orders_accepting: 'true',
  orders_closed_message:
    'Les commandes sont temporairement indisponibles. Merci de réessayer plus tard.',
  orders_reopen_at: '',
  pos_orders_accepting: 'true',
  email_notify_to: 'info@vriendspoperinge.be',
  email_notify_new_order: 'true',
  email_notify_status_confirmed: 'true',
  email_notify_status_preparing: 'true',
  email_notify_status_ready: 'true',
  email_notify_status_completed: 'true',
  email_notify_status_cancelled: 'true',
  pos_auto_print: 'false',
  pos_auto_print_trigger: 'paid',
  pos_auto_print_copies: '1',
  pos_ticket_width_mm: '58',
  cgv_version: '1.0',
};

async function getSettingValue(key, fallback = '') {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (row) return row.value;
  if (Object.prototype.hasOwnProperty.call(DEFAULTS, key)) return DEFAULTS[key];
  return fallback;
}

async function getSettingsMap(keys) {
  const list = keys || Object.keys(DEFAULTS);
  const rows = await prisma.setting.findMany({ where: { key: { in: list } } });
  const map = { ...DEFAULTS };
  for (const r of rows) map[r.key] = r.value;
  return map;
}

async function ensureDefaultSettings() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }
}

function isTruthy(value) {
  return String(value || '').toLowerCase() === 'true' || value === '1' || value === true;
}

async function getOrdersAcceptingState() {
  const map = await getSettingsMap([
    'orders_accepting',
    'orders_closed_message',
    'orders_reopen_at',
  ]);
  let accepting = isTruthy(map.orders_accepting);
  const reopenAt = map.orders_reopen_at ? String(map.orders_reopen_at).trim() : '';
  if (!accepting && reopenAt) {
    const d = new Date(reopenAt);
    if (!Number.isNaN(d.getTime()) && d.getTime() <= Date.now()) {
      accepting = true;
      await prisma.setting.upsert({
        where: { key: 'orders_accepting' },
        create: { key: 'orders_accepting', value: 'true' },
        update: { value: 'true' },
      });
    }
  }
  return {
    accepting,
    message: map.orders_closed_message || DEFAULTS.orders_closed_message,
    reopenAt: reopenAt || null,
  };
}

async function getPosOrdersAcceptingState() {
  const value = await getSettingValue('pos_orders_accepting', 'true');
  return { accepting: isTruthy(value) };
}

function sanitizeLineNote(note) {
  if (note == null) return null;
  const cleaned = String(note)
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 300);
  return cleaned || null;
}

/** Corrige les groupes « groeten/groenten » limités à tort (max 2 → illimité). */
async function repairUnlimitedVegetableOptions() {
  const { normalizeOptionsSchema } = require('./optionsEngine.cjs');
  const products = await prisma.product.findMany({
    where: { optionsSchema: { not: null }, deletedAt: null },
    select: { id: true, optionsSchema: true },
  });
  let fixed = 0;
  for (const product of products) {
    let parsed;
    try {
      parsed =
        typeof product.optionsSchema === 'string'
          ? JSON.parse(product.optionsSchema)
          : product.optionsSchema;
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) continue;
    let changed = false;
    const next = parsed.map((group) => {
      const name = String(group?.name || group?.label || '').toLowerCase();
      const isMulti =
        group?.selection === 'multiple' || group?.type === 'multiple' || group?.multi;
      if (isMulti && /groet/.test(name) && group.max != null && group.max !== '') {
        changed = true;
        return { ...group, max: null };
      }
      return group;
    });
    if (!changed) continue;
    const normalized = normalizeOptionsSchema(next);
    await prisma.product.update({
      where: { id: product.id },
      data: { optionsSchema: JSON.stringify(normalized) },
    });
    fixed += 1;
  }
  if (fixed > 0) {
    console.log(`[shopSettings] options groeten illimitées corrigées: ${fixed} produit(s)`);
  }
  return fixed;
}

function buildAddressSnapshot(userOrAddress) {
  if (!userOrAddress) return null;
  const src = userOrAddress;
  const street = src.street || src.addressStreet || null;
  const houseNumber = src.houseNumber || src.house_number || null;
  const box = src.box || null;
  const postalCode = src.postalCode || src.postal_code || null;
  const city = src.city || null;
  const country = src.country || 'Belgique';
  const deliveryInstructions =
    src.deliveryInstructions || src.delivery_instructions || null;
  if (!street && !postalCode && !city) return null;
  return {
    street,
    houseNumber,
    box,
    postalCode,
    city,
    country,
    deliveryInstructions,
    firstName: src.firstName || src.first_name || null,
    lastName: src.lastName || src.last_name || null,
    phone: src.phone || null,
    email: src.email || null,
    name: src.name || [src.firstName, src.lastName].filter(Boolean).join(' ') || null,
  };
}

function formatAddress(snapshot) {
  if (!snapshot) return '';
  const line1 = [snapshot.street, snapshot.houseNumber, snapshot.box ? `bte ${snapshot.box}` : null]
    .filter(Boolean)
    .join(' ');
  const line2 = [snapshot.postalCode, snapshot.city].filter(Boolean).join(' ');
  return [line1, line2, snapshot.country].filter(Boolean).join(', ');
}

module.exports = {
  DEFAULTS,
  getSettingValue,
  getSettingsMap,
  ensureDefaultSettings,
  isTruthy,
  getOrdersAcceptingState,
  getPosOrdersAcceptingState,
  sanitizeLineNote,
  buildAddressSnapshot,
  formatAddress,
  repairUnlimitedVegetableOptions,
};

/**
 * Moteur de prix Vriends POS (ESM — frontend).
 * Doit rester aligné avec shared/pricingEngine.cjs (backend).
 * Tous les montants sont en centimes (entiers).
 */

export const CUSTOMER_TYPES = {
  STANDARD: 'STANDARD',
  RESIDENT: 'RESIDENT',
  WORKER: 'WORKER',
  REGISTERED: 'REGISTERED',
};

export const DEFAULT_POS_SETTINGS = {
  residentDiscountPercent: 10,
  workerDiscountPercent: 5,
  earlyBirdDiscountPercent: 4,
  earlyBirdEndTime: '09:45',
  lateSurchargePercent: 3,
  lateSurchargeStartTime: '11:00',
};

export function eurosToCents(euros) {
  if (euros == null || Number.isNaN(Number(euros))) return 0;
  return Math.round(Number(euros) * 100);
}

export function centsToEuros(cents) {
  return Math.round(Number(cents) || 0) / 100;
}

export function formatCents(cents, locale = 'fr-BE') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(centsToEuros(cents));
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function getTimeMinutes(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.getHours() * 60 + d.getMinutes();
}

export function percentOfCents(amountCents, percent) {
  if (!percent || percent <= 0 || amountCents <= 0) return 0;
  return Math.round((amountCents * percent) / 100);
}

export function resolveCustomerDiscountPercent(customerType, settings) {
  const s = { ...DEFAULT_POS_SETTINGS, ...settings };
  switch (customerType) {
    case CUSTOMER_TYPES.RESIDENT:
      return s.residentDiscountPercent;
    case CUSTOMER_TYPES.WORKER:
      return s.workerDiscountPercent;
    case CUSTOMER_TYPES.REGISTERED:
      return s.residentDiscountPercent;
    default:
      return 0;
  }
}

export function calculateOrderPricing({
  items = [],
  customerType = CUSTOMER_TYPES.STANDARD,
  now = new Date(),
  settings = {},
} = {}) {
  const s = { ...DEFAULT_POS_SETTINGS, ...settings };
  const appliedRules = [];

  let subtotalCents = 0;
  for (const item of items) {
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    const unit = Math.round(Number(item.unitPriceCents) || 0);
    subtotalCents += unit * qty;
  }

  if (subtotalCents <= 0 || items.length === 0) {
    return {
      subtotalCents: 0,
      customerDiscountCents: 0,
      earlyBirdDiscountCents: 0,
      lateSurchargeCents: 0,
      totalDiscountCents: 0,
      surchargeCents: 0,
      finalTotalCents: 0,
      appliedRules: [],
      customerDiscountPercent: 0,
      earlyBirdDiscountPercent: 0,
      lateSurchargePercent: 0,
    };
  }

  const customerDiscountPercent = resolveCustomerDiscountPercent(customerType, s);
  const customerDiscountCents = percentOfCents(subtotalCents, customerDiscountPercent);
  if (customerDiscountCents > 0) {
    appliedRules.push({
      type: customerType === CUSTOMER_TYPES.WORKER ? 'WORKER_DISCOUNT' : 'RESIDENT_DISCOUNT',
      percentage: customerDiscountPercent,
      amountCents: customerDiscountCents,
    });
  }

  const minutes = getTimeMinutes(now);
  const earlyEnd = parseTimeToMinutes(s.earlyBirdEndTime);
  const lateStart = parseTimeToMinutes(s.lateSurchargeStartTime);

  let earlyBirdDiscountCents = 0;
  let earlyBirdDiscountPercent = 0;
  if (earlyEnd != null && minutes < earlyEnd && s.earlyBirdDiscountPercent > 0) {
    earlyBirdDiscountPercent = s.earlyBirdDiscountPercent;
    earlyBirdDiscountCents = percentOfCents(subtotalCents, earlyBirdDiscountPercent);
    appliedRules.push({
      type: 'EARLY_BIRD',
      percentage: earlyBirdDiscountPercent,
      amountCents: earlyBirdDiscountCents,
      label: 'Vroege Vogel',
    });
  }

  let lateSurchargeCents = 0;
  let lateSurchargePercent = 0;
  if (lateStart != null && minutes >= lateStart && s.lateSurchargePercent > 0) {
    lateSurchargePercent = s.lateSurchargePercent;
    lateSurchargeCents = percentOfCents(subtotalCents, lateSurchargePercent);
    appliedRules.push({
      type: 'LATE_SURCHARGE',
      percentage: lateSurchargePercent,
      amountCents: lateSurchargeCents,
      label: 'Majoration après 11h',
    });
  }

  const totalDiscountCents = customerDiscountCents + earlyBirdDiscountCents;
  const surchargeCents = lateSurchargeCents;
  const finalTotalCents = Math.max(0, subtotalCents - totalDiscountCents + surchargeCents);

  return {
    subtotalCents,
    customerDiscountCents,
    earlyBirdDiscountCents,
    lateSurchargeCents,
    totalDiscountCents,
    surchargeCents,
    finalTotalCents,
    appliedRules,
    customerDiscountPercent,
    earlyBirdDiscountPercent,
    lateSurchargePercent,
  };
}

export function calculateCashChange(totalCents, receivedCents) {
  const total = Math.round(Number(totalCents) || 0);
  const received = Math.round(Number(receivedCents) || 0);
  return {
    totalCents: total,
    receivedCents: received,
    changeCents: Math.max(0, received - total),
    isSufficient: received >= total,
  };
}

export default {
  CUSTOMER_TYPES,
  DEFAULT_POS_SETTINGS,
  eurosToCents,
  centsToEuros,
  formatCents,
  parseTimeToMinutes,
  getTimeMinutes,
  percentOfCents,
  resolveCustomerDiscountPercent,
  calculateOrderPricing,
  calculateCashChange,
};

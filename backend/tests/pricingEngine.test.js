const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateOrderPricing,
  eurosToCents,
  CUSTOMER_TYPES,
  DEFAULT_POS_SETTINGS,
} = require('../lib/pricingEngine.cjs');

function atTime(hours, minutes) {
  const d = new Date(2026, 7, 9, hours, minutes, 0, 0);
  return d;
}

const cart20 = [{ unitPriceCents: 2000, quantity: 1 }];
const multi = [
  { unitPriceCents: 700, quantity: 2 },
  { unitPriceCents: 350, quantity: 1 },
];

describe('eurosToCents', () => {
  it('convertit les décimales sans erreur flottante', () => {
    assert.equal(eurosToCents(5.5), 550);
    assert.equal(eurosToCents(10.99), 1099);
    assert.equal(eurosToCents(0.1 + 0.2), 30);
  });
});

describe('calculateOrderPricing — panier vide', () => {
  it('retourne des zéros', () => {
    const r = calculateOrderPricing({ items: [], customerType: CUSTOMER_TYPES.RESIDENT, now: atTime(9, 0) });
    assert.equal(r.finalTotalCents, 0);
    assert.equal(r.subtotalCents, 0);
    assert.deepEqual(r.appliedRules, []);
  });
});

describe('STANDARD', () => {
  it('avant 09:45 → early bird -4%', () => {
    const r = calculateOrderPricing({ items: cart20, customerType: CUSTOMER_TYPES.STANDARD, now: atTime(9, 44) });
    assert.equal(r.subtotalCents, 2000);
    assert.equal(r.customerDiscountCents, 0);
    assert.equal(r.earlyBirdDiscountCents, 80);
    assert.equal(r.lateSurchargeCents, 0);
    assert.equal(r.finalTotalCents, 1920);
  });

  it('exactement 09:45 → plus d’early bird', () => {
    const r = calculateOrderPricing({ items: cart20, customerType: CUSTOMER_TYPES.STANDARD, now: atTime(9, 45) });
    assert.equal(r.earlyBirdDiscountCents, 0);
    assert.equal(r.finalTotalCents, 2000);
  });

  it('après 09:45 avant 11:00 → prix normal', () => {
    const r = calculateOrderPricing({ items: cart20, customerType: CUSTOMER_TYPES.STANDARD, now: atTime(10, 59) });
    assert.equal(r.earlyBirdDiscountCents, 0);
    assert.equal(r.lateSurchargeCents, 0);
    assert.equal(r.finalTotalCents, 2000);
  });

  it('exactement 11:00 → majoration +3%', () => {
    const r = calculateOrderPricing({ items: cart20, customerType: CUSTOMER_TYPES.STANDARD, now: atTime(11, 0) });
    assert.equal(r.lateSurchargeCents, 60);
    assert.equal(r.finalTotalCents, 2060);
  });

  it('après 11:00 → majoration +3%', () => {
    const r = calculateOrderPricing({ items: cart20, customerType: CUSTOMER_TYPES.STANDARD, now: atTime(14, 30) });
    assert.equal(r.lateSurchargeCents, 60);
    assert.equal(r.finalTotalCents, 2060);
  });
});

describe('RESIDENT', () => {
  it('avant 09:45 → -10% et early bird -4%', () => {
    const r = calculateOrderPricing({ items: cart20, customerType: CUSTOMER_TYPES.RESIDENT, now: atTime(9, 0) });
    assert.equal(r.customerDiscountCents, 200);
    assert.equal(r.earlyBirdDiscountCents, 80);
    assert.equal(r.finalTotalCents, 1720);
    assert.equal(r.appliedRules.length, 2);
  });

  it('entre 09:45 et 11:00 → seulement -10%', () => {
    const r = calculateOrderPricing({ items: cart20, customerType: CUSTOMER_TYPES.RESIDENT, now: atTime(10, 0) });
    assert.equal(r.customerDiscountCents, 200);
    assert.equal(r.earlyBirdDiscountCents, 0);
    assert.equal(r.lateSurchargeCents, 0);
    assert.equal(r.finalTotalCents, 1800);
  });

  it('après 11:00 → -10% + majoration +3%', () => {
    const r = calculateOrderPricing({ items: cart20, customerType: CUSTOMER_TYPES.RESIDENT, now: atTime(11, 0) });
    assert.equal(r.customerDiscountCents, 200);
    assert.equal(r.lateSurchargeCents, 60);
    assert.equal(r.finalTotalCents, 1860);
  });
});

describe('WORKER', () => {
  it('avant 09:45 → -5% et early bird', () => {
    const r = calculateOrderPricing({ items: cart20, customerType: CUSTOMER_TYPES.WORKER, now: atTime(8, 0) });
    assert.equal(r.customerDiscountCents, 100);
    assert.equal(r.earlyBirdDiscountCents, 80);
    assert.equal(r.finalTotalCents, 1820);
  });

  it('après 11:00 → -5% + majoration', () => {
    const r = calculateOrderPricing({ items: cart20, customerType: CUSTOMER_TYPES.WORKER, now: atTime(12, 0) });
    assert.equal(r.customerDiscountCents, 100);
    assert.equal(r.lateSurchargeCents, 60);
    assert.equal(r.finalTotalCents, 1960);
  });
});

describe('quantités et décimales', () => {
  it('plusieurs produits avec quantités', () => {
    // 700*2 + 350 = 1750
    const r = calculateOrderPricing({ items: multi, customerType: CUSTOMER_TYPES.STANDARD, now: atTime(10, 0) });
    assert.equal(r.subtotalCents, 1750);
    assert.equal(r.finalTotalCents, 1750);
  });

  it('prix décimaux 5,50 € × 3', () => {
    const r = calculateOrderPricing({
      items: [{ unitPriceCents: 550, quantity: 3 }],
      customerType: CUSTOMER_TYPES.RESIDENT,
      now: atTime(10, 0),
    });
    assert.equal(r.subtotalCents, 1650);
    assert.equal(r.customerDiscountCents, 165);
    assert.equal(r.finalTotalCents, 1485);
  });
});

describe('settings configurables', () => {
  it('respecte des pourcentages custom', () => {
    const r = calculateOrderPricing({
      items: cart20,
      customerType: CUSTOMER_TYPES.RESIDENT,
      now: atTime(10, 0),
      settings: { ...DEFAULT_POS_SETTINGS, residentDiscountPercent: 15 },
    });
    assert.equal(r.customerDiscountCents, 300);
    assert.equal(r.finalTotalCents, 1700);
  });
});

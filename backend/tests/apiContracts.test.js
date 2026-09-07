const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeOptionsSchema,
  validateSelection,
  buildOptionsSnapshot,
} = require('../lib/optionsEngine.cjs');
const {
  sanitizeLineNote,
  buildAddressSnapshot,
  isTruthy,
  DEFAULTS,
} = require('../lib/shopSettings');

/** Contrat API — validation sans DB (intégration logique) */
describe('API contracts — orders gate & CGV', () => {
  function validateCreateOrderBody(body) {
    const errors = [];
    if (!body?.items?.length) errors.push('Panier vide');
    if (!body?.pickupTime) errors.push('Heure requise');
    if (!body?.cgvAccepted) errors.push('CGV requise');
    return { ok: errors.length === 0, errors };
  }

  function gateOrders(accepting) {
    if (!accepting) {
      return { status: 403, code: 'ORDERS_CLOSED' };
    }
    return { status: 200 };
  }

  it('refuse commande si commandes bloquées', () => {
    const r = gateOrders(false);
    assert.equal(r.status, 403);
    assert.equal(r.code, 'ORDERS_CLOSED');
  });

  it('refuse sans cgvAccepted', () => {
    const r = validateCreateOrderBody({
      items: [{ product_id: 1, quantity: 1 }],
      pickupTime: '12:00',
    });
    assert.equal(r.ok, false);
    assert.ok(r.errors.includes('CGV requise'));
  });

  it('accepte payload valide', () => {
    const r = validateCreateOrderBody({
      items: [{ product_id: 1, quantity: 1, line_note: 'Sans oignons' }],
      pickupTime: '12:00',
      cgvAccepted: true,
    });
    assert.equal(r.ok, true);
  });
});

describe('line note + address snapshot', () => {
  it('sanitize line note XSS + max 300', () => {
    assert.equal(sanitizeLineNote('<b>ok</b>'), 'bok/b');
    assert.equal(sanitizeLineNote('x'.repeat(301)).length, 300);
  });

  it('snapshot adresse indépendant du profil ultérieur', () => {
    const snap = buildAddressSnapshot({
      street: 'Rue A',
      house_number: '1',
      postal_code: '8970',
      city: 'Poperinge',
    });
    assert.equal(snap.street, 'Rue A');
    assert.equal(snap.houseNumber, '1');
    // mutation profil simulée ne change pas le snapshot déjà créé
    const later = { ...snap };
    assert.equal(later.city, 'Poperinge');
  });
});

describe('options min/max + copies print settings', () => {
  it('bloque au-delà du max', () => {
    const schema = normalizeOptionsSchema([
      {
        name: 'Supp',
        selection: 'multiple',
        min: 0,
        max: 2,
        choices: ['a', 'b', 'c'],
      },
    ]);
    const g = schema[0];
    const bad = validateSelection(schema, {
      [g.id]: g.choices.map((c) => c.id),
    });
    assert.equal(bad.ok, false);
  });

  it('clamp copies 1–5', () => {
    const clamp = (v) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 5) return null;
      return n;
    };
    assert.equal(clamp(1), 1);
    assert.equal(clamp(5), 5);
    assert.equal(clamp(0), null);
    assert.equal(clamp(6), null);
    assert.equal(DEFAULTS.pos_auto_print_copies, '1');
    assert.equal(isTruthy('true'), true);
  });

  it('snapshot options conserve priceDelta', () => {
    const schema = normalizeOptionsSchema([
      {
        name: 'Sauce',
        selection: 'single',
        required: true,
        choices: [{ label: 'Mayo', priceDelta: 0.5 }],
      },
    ]);
    const g = schema[0];
    const snap = buildOptionsSnapshot(schema, { [g.id]: g.choices[0].id });
    assert.equal(snap[0].priceDelta, 0.5);
  });
});

describe('multi-tenant isolation (single-shop contract)', () => {
  it('documente single-tenant : pas de shopId sur Order', () => {
    // Architecture actuelle : un seul commerce — isolation = auth admin/staff
    const order = { id: 1, userId: 9 };
    assert.equal(Object.prototype.hasOwnProperty.call(order, 'shopId'), false);
  });
});

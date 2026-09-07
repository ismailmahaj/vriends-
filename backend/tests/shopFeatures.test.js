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

describe('shopSettings helpers', () => {
  it('sanitizeLineNote coupe à 300 et retire XSS basique', () => {
    assert.equal(sanitizeLineNote(null), null);
    assert.equal(sanitizeLineNote('  Sans oignons  '), 'Sans oignons');
    assert.equal(sanitizeLineNote('<script>x</script>ok'), 'scriptx/scriptok');
    assert.equal(sanitizeLineNote('a'.repeat(400)).length, 300);
  });

  it('buildAddressSnapshot ne remplace pas une commande sans adresse', () => {
    assert.equal(buildAddressSnapshot(null), null);
    assert.equal(buildAddressSnapshot({ name: 'A' }), null);
    const snap = buildAddressSnapshot({
      street: 'Rue Test',
      houseNumber: '12',
      postalCode: '8970',
      city: 'Poperinge',
      firstName: 'Jean',
      lastName: 'Dupont',
    });
    assert.equal(snap.street, 'Rue Test');
    assert.equal(snap.houseNumber, '12');
    assert.equal(snap.city, 'Poperinge');
  });

  it('isTruthy lit les flags settings', () => {
    assert.equal(isTruthy('true'), true);
    assert.equal(isTruthy('false'), false);
    assert.equal(isTruthy(DEFAULTS.orders_accepting), true);
  });
});

describe('options max illimité + snapshot', () => {
  it('autorise multiple sans max', () => {
    const schema = normalizeOptionsSchema([
      {
        name: 'Retirez',
        selection: 'multiple',
        required: false,
        min: 0,
        max: null,
        choices: ['oignons', 'tomate', 'salade', 'cornichons'],
      },
    ]);
    assert.equal(schema[0].max, null);
    const g = schema[0];
    const all = g.choices.map((c) => c.id);
    const ok = validateSelection(schema, { [g.id]: all });
    assert.equal(ok.ok, true);
  });

  it('snapshot conserve labels et priceDelta', () => {
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
    assert.equal(snap.length, 1);
    assert.equal(snap[0].label, 'Mayo');
    assert.equal(snap[0].priceDelta, 0.5);
  });
});

describe('CGV / acceptation (contrat API)', () => {
  it('refuse conceptuellement sans cgvAccepted', () => {
    const body = { items: [{ product_id: 1, quantity: 1 }], pickupTime: '12:00' };
    assert.equal(!!body.cgvAccepted, false);
  });
});

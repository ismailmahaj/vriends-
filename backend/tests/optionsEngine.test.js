const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeOptionsSchema,
  emptySelection,
  validateSelection,
  computeOptionsExtraEuros,
  computeUnitPriceEuros,
  buildOptionsSnapshot,
  editorRowsToSchema,
} = require('../lib/optionsEngine.cjs');

describe('optionsEngine', () => {
  it('normalise le format legacy string[]', () => {
    const schema = normalizeOptionsSchema([
      { name: 'Taille', choices: ['S', 'M', 'L'] },
    ]);
    assert.equal(schema.length, 1);
    assert.equal(schema[0].selection, 'single');
    assert.equal(schema[0].choices.length, 3);
    assert.equal(schema[0].choices[0].label, 'S');
    assert.equal(schema[0].choices[0].priceDelta, 0);
  });

  it('calcule un supplément single choice', () => {
    const schema = normalizeOptionsSchema([
      {
        name: 'Taille',
        selection: 'single',
        required: true,
        choices: [
          { label: 'Small', priceDelta: 0 },
          { label: 'Large', priceDelta: 2 },
        ],
      },
    ]);
    const selection = { [schema[0].id]: schema[0].choices[1].id };
    assert.equal(computeOptionsExtraEuros(schema, selection), 2);
    assert.equal(computeUnitPriceEuros(10, schema, selection), 12);
  });

  it('autorise la sélection multiple avec max', () => {
    const schema = normalizeOptionsSchema([
      {
        name: 'Suppléments',
        selection: 'multiple',
        required: false,
        min: 0,
        max: 2,
        choices: [
          { label: 'fromage', priceDelta: 1 },
          { label: 'bacon', priceDelta: 1.5 },
          { label: 'oeuf', priceDelta: 1 },
        ],
      },
    ]);
    const g = schema[0];
    const ok = validateSelection(schema, {
      [g.id]: [g.choices[0].id, g.choices[1].id],
    });
    assert.equal(ok.ok, true);
    const tooMany = validateSelection(schema, {
      [g.id]: [g.choices[0].id, g.choices[1].id, g.choices[2].id],
    });
    assert.equal(tooMany.ok, false);
    const selection = { [g.id]: [g.choices[0].id, g.choices[1].id] };
    assert.equal(computeOptionsExtraEuros(schema, selection), 2.5);
  });

  it('exige le minimum pour un groupe required', () => {
    const schema = normalizeOptionsSchema([
      {
        name: 'Sauce',
        selection: 'multiple',
        required: true,
        min: 1,
        max: 3,
        choices: ['ketchup', 'mayo'],
      },
    ]);
    const empty = emptySelection(schema);
    // emptySelection for multiple required without default leaves []
    empty[schema[0].id] = [];
    const check = validateSelection(schema, empty);
    assert.equal(check.ok, false);
  });

  it('conserve un snapshot historique indépendant', () => {
    const schema = normalizeOptionsSchema([
      {
        name: 'Extra',
        selection: 'multiple',
        choices: [{ label: 'bacon', priceDelta: 1.5 }],
      },
    ]);
    const selection = { [schema[0].id]: [schema[0].choices[0].id] };
    const snap = buildOptionsSnapshot(schema, selection);
    assert.equal(snap[0].label, 'bacon');
    assert.equal(snap[0].priceDelta, 1.5);
    // Mutation schéma après coup
    schema[0].choices[0].priceDelta = 99;
    assert.equal(snap[0].priceDelta, 1.5);
  });

  it('parse les lignes dashboard fromage=1', () => {
    const schema = editorRowsToSchema([
      {
        name: 'Suppléments',
        selection: 'multiple',
        required: false,
        min: 0,
        max: 3,
        choicesText: 'fromage=1, bacon=1.5, sans oignon',
      },
    ]);
    assert.equal(schema[0].choices.length, 3);
    assert.equal(schema[0].choices[0].priceDelta, 1);
    assert.equal(schema[0].choices[1].priceDelta, 1.5);
    assert.equal(schema[0].choices[2].priceDelta, 0);
  });
});

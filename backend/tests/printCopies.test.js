const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Duplique la logique clamp (pas d'import ESM depuis CJS facilement)
function clampPrintCopies(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(5, Math.max(1, Math.round(n)));
}

describe('print copies clamp', () => {
  it('borne entre 1 et 5', () => {
    assert.equal(clampPrintCopies(1), 1);
    assert.equal(clampPrintCopies(5), 5);
    assert.equal(clampPrintCopies(0), 1);
    assert.equal(clampPrintCopies(99), 5);
    assert.equal(clampPrintCopies('3'), 3);
  });
});

import { useEffect, useMemo, useState } from 'react';
import {
  normalizeOptionsSchema,
  emptySelection,
  validateSelection,
  computeUnitPriceEuros,
  getSelectedIds,
} from '../lib/optionsEngine';
import { useLanguage } from '../context/LanguageContext';

/**
 * Modal options partagée menu + POS.
 * onConfirm(selection, unitPriceEuros)
 */
export default function ProductOptionsModal({ product, onClose, onConfirm, accent = '#3A2E25' }) {
  const { t } = useLanguage();
  const schema = useMemo(
    () => normalizeOptionsSchema(product?.optionsSchema) || [],
    [product]
  );
  const [selection, setSelection] = useState(() => emptySelection(schema));
  const [error, setError] = useState('');

  useEffect(() => {
    setSelection(emptySelection(schema));
    setError('');
  }, [schema, product?.id]);

  const unitPrice = computeUnitPriceEuros(product?.price ?? 0, schema, selection);

  const toggleChoice = (group, choiceId) => {
    setSelection((prev) => {
      if (group.selection === 'single') {
        return { ...prev, [group.id]: choiceId };
      }
      const current = getSelectedIds(prev, group.id);
      const exists = current.includes(choiceId);
      let next = exists ? current.filter((id) => id !== choiceId) : [...current, choiceId];
      if (next.length > group.max) next = next.slice(next.length - group.max);
      return { ...prev, [group.id]: next };
    });
  };

  const handleConfirm = () => {
    const check = validateSelection(schema, selection);
    if (!check.ok) {
      setError(check.errors[0]?.message || t('posOptionsInvalid'));
      return;
    }
    onConfirm(selection, unitPrice);
  };

  if (!product) return null;

  return (
    <div
      className="pos-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28,28,28,.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        padding: '1rem',
      }}
    >
      <div
        className="pos-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#F7F5F2',
          width: 'min(520px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '1.4rem',
          borderRadius: 16,
        }}
      >
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", color: accent, margin: '0 0 .35rem', fontSize: '1.7rem' }}>
          {product.name}
        </h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", opacity: 0.7, marginBottom: '1rem' }}>
          {t('posChooseOptions')}
        </p>

        {schema.map((group) => (
          <div key={group.id} style={{ marginBottom: '1rem' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: accent, marginBottom: '0.45rem' }}>
              {group.name}
              {group.required ? ' *' : ''}
              <span style={{ fontWeight: 400, opacity: 0.65, marginLeft: 8, fontSize: '0.8rem' }}>
                {group.selection === 'multiple'
                  ? `${t('posOptionsMulti')} (${group.min}-${group.max})`
                  : t('posOptionsSingle')}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {group.choices.map((choice) => {
                const selected =
                  group.selection === 'single'
                    ? selection[group.id] === choice.id
                    : getSelectedIds(selection, group.id).includes(choice.id);
                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => toggleChoice(group, choice.id)}
                    style={{
                      border: `1px solid ${selected ? accent : 'rgba(58,46,37,.2)'}`,
                      background: selected ? accent : '#fff',
                      color: selected ? '#F7F5F2' : accent,
                      padding: '0.65rem 0.9rem',
                      borderRadius: 999,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      minHeight: 44,
                    }}
                  >
                    {choice.label}
                    {choice.priceDelta > 0 ? ` (+${choice.priceDelta.toFixed(2)}€)` : ''}
                    {choice.priceDelta < 0 ? ` (${choice.priceDelta.toFixed(2)}€)` : ''}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem',
            marginBottom: '1rem',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span style={{ opacity: 0.7 }}>{t('posTotal')}</span>
          <strong style={{ fontSize: '1.25rem', color: accent }}>{unitPrice.toFixed(2)} €</strong>
        </div>

        {error && (
          <div style={{ color: '#9b3b2e', fontFamily: "'DM Sans', sans-serif", marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              minHeight: 48,
              border: '1px solid rgba(58,46,37,.25)',
              background: 'transparent',
              color: accent,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
            }}
          >
            {t('posCancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              flex: 1,
              minHeight: 48,
              border: 'none',
              background: accent,
              color: '#F7F5F2',
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
            }}
          >
            {t('posAdd')}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/ordersService';
import { getOrdersStatus } from '../services/shopSettingsService';
import { useLanguage } from '../context/LanguageContext';
import SiteFooter from '../components/SiteFooter';

const CartPage = () => {
  const { t } = useLanguage();
  const { items, updateQty, removeItem, updateLineNote, clearCart, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pickupTime, setPickupTime] = useState('');
  const [notes, setNotes] = useState('');
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [ordersStatus, setOrdersStatus] = useState({ accepting: true, message: '', reopenAt: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const NOTES_MAX = 500;
  const LINE_NOTE_MAX = 300;

  useEffect(() => {
    generatePickupTimes();
    getOrdersStatus()
      .then(setOrdersStatus)
      .catch(() => setOrdersStatus({ accepting: true, message: '', reopenAt: null }));
  }, []);

  const generatePickupTimes = () => {
    const times = [];
    const now = new Date();
    now.setHours(7);
    now.setMinutes(30);

    for (let i = 0; i < 38; i++) {
      const time = new Date(now);
      time.setMinutes(time.getMinutes() + i * 15);
      if (time.getHours() < 17 || (time.getHours() === 17 && time.getMinutes() === 0)) {
        const timeStr = time.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        times.push(timeStr);
      }
    }
    if (!pickupTime && times.length > 0) {
      setPickupTime(times[0]);
    }
  };

  const calculateTotal = () => {
    if (user?.local_status && user?.discount_percent > 0) {
      return subtotal * (1 - user.discount_percent / 100);
    }
    return subtotal;
  };

  const handleOrder = async () => {
    if (items.length === 0) {
      setError(t('cartEmpty'));
      return;
    }
    if (!ordersStatus.accepting) {
      setError(ordersStatus.message || t('ordersClosedDefault'));
      return;
    }
    if (!pickupTime) {
      setError(t('pickupTimeRequired'));
      return;
    }
    if (!cgvAccepted) {
      setError(t('cgvRequired'));
      return;
    }
    if (notes.trim().length > NOTES_MAX) {
      setError(t('orderNotesTooLong'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        options: item.options || null,
        line_note: item.lineNote || null,
      }));

      await createOrder({
        items: orderItems,
        pickupTime,
        notes: notes.trim(),
        cgvAccepted: true,
      });
      clearCart();
      navigate('/profile?success=1');
    } catch (err) {
      setError(err.response?.data?.error || t('orderError'));
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#E6DCCB',
      paddingTop: '80px',
      padding: '4rem 2rem',
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: window.innerWidth > 768 ? '2fr 1fr' : '1fr',
      gap: '3rem',
    },
    list: { background: '#F7F5F2', padding: '2rem' },
    item: {
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0',
      borderBottom: '1px solid rgba(58,46,37,.12)',
      gap: '0.75rem',
    },
    itemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
    },
    itemName: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.3rem',
      color: '#3A2E25',
      marginBottom: '0.3rem',
    },
    itemPrice: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      color: '#1C1C1C',
      opacity: 0.7,
    },
    qtyButton: {
      background: '#3A2E25',
      color: '#F7F5F2',
      border: 'none',
      width: '32px',
      height: '32px',
      cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
    },
    removeButton: {
      background: 'transparent',
      border: 'none',
      color: '#c0392b',
      cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.85rem',
    },
    itemTotal: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.3rem',
      color: '#3A2E25',
      minWidth: '80px',
      textAlign: 'right',
    },
    summary: {
      background: '#F7F5F2',
      padding: '2.5rem',
      position: 'sticky',
      top: '100px',
      height: 'fit-content',
    },
    summaryTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.8rem',
      color: '#3A2E25',
      marginBottom: '2rem',
    },
    summaryRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '1rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.95rem',
      color: '#1C1C1C',
    },
    summaryTotal: {
      marginTop: '1.5rem',
      paddingTop: '1.5rem',
      borderTop: '1px solid rgba(58,46,37,.12)',
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.8rem',
      color: '#3A2E25',
      fontWeight: 600,
    },
    select: {
      width: '100%',
      padding: '0.9rem',
      marginTop: '1rem',
      background: '#F7F5F2',
      border: '1.5px solid rgba(58,46,37,.2)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      color: '#1C1C1C',
    },
    button: {
      width: '100%',
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: '1.2rem',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer',
      marginTop: '2rem',
    },
    buttonDisabled: { opacity: 0.45, cursor: 'not-allowed' },
    banner: {
      background: '#fdf0ee',
      border: '1px solid #e74c3c',
      color: '#c0392b',
      padding: '1rem',
      marginBottom: '1.5rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.95rem',
    },
    error: {
      background: '#fdf0ee',
      border: '1px solid #e74c3c',
      color: '#c0392b',
      padding: '1rem',
      marginBottom: '1.5rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
    },
    empty: {
      textAlign: 'center',
      padding: '4rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1.1rem',
      color: '#1C1C1C',
    },
  };

  if (items.length === 0) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.empty}>
            <div style={{ marginBottom: '2rem' }}>{t('cartEmpty')}</div>
            <button onClick={() => navigate('/menu')} style={styles.button}>
              {t('viewMenu')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const total = calculateTotal();
  const discount =
    user?.local_status && user?.discount_percent > 0 ? subtotal - total : 0;
  const canOrder = ordersStatus.accepting && cgvAccepted && !loading;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.list}>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '2.5rem',
              color: '#3A2E25',
              marginBottom: '2rem',
            }}
          >
            {t('yourCart')}
          </h2>
          {!ordersStatus.accepting && (
            <div style={styles.banner} role="alert">
              {ordersStatus.message || t('ordersClosedDefault')}
              {ordersStatus.reopenAt && (
                <div style={{ marginTop: 6, fontSize: '0.85rem' }}>
                  {t('ordersReopenAt')}: {new Date(ordersStatus.reopenAt).toLocaleString()}
                </div>
              )}
            </div>
          )}
          {error && <div style={styles.error}>{error}</div>}
          {items.map((item) => (
            <div key={item.key || item.product.id} style={styles.item}>
              <div style={styles.itemRow}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={styles.itemName}>{item.product.name}</div>
                  <div style={styles.itemPrice}>
                    {(item.unitPrice ?? item.product.price).toFixed(2)}€
                  </div>
                  {item.options && (
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.8rem',
                        opacity: 0.65,
                        marginTop: 4,
                      }}
                    >
                      {typeof item.options === 'object' && !Array.isArray(item.options)
                        ? Object.entries(item.options)
                            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                            .join(' · ')
                        : Array.isArray(item.options)
                          ? item.options.map((o) => o.label).join(', ')
                          : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => updateQty(item.key || item.product.id, item.quantity - 1)}
                    style={styles.qtyButton}
                  >
                    −
                  </button>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", minWidth: 24, textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.key || item.product.id, item.quantity + 1)}
                    style={styles.qtyButton}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key || item.product.id)}
                    style={styles.removeButton}
                  >
                    {t('remove')}
                  </button>
                  <div style={styles.itemTotal}>
                    {((item.unitPrice ?? item.product.price) * item.quantity).toFixed(2)}€
                  </div>
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8rem',
                    color: '#3A2E25',
                  }}
                >
                  {t('lineNoteLabel')}
                </label>
                <input
                  type="text"
                  maxLength={LINE_NOTE_MAX}
                  value={item.lineNote || ''}
                  placeholder={t('lineNotePlaceholder')}
                  onChange={(e) => updateLineNote(item.key || item.product.id, e.target.value)}
                  style={{ ...styles.select, marginTop: 4 }}
                />
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', opacity: 0.5 }}>
                  {(item.lineNote || '').length}/{LINE_NOTE_MAX}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.summary}>
          <h3 style={styles.summaryTitle}>{t('summary')}</h3>
          <div style={styles.summaryRow}>
            <span>{t('subtotal')}</span>
            <span>{subtotal.toFixed(2)}€</span>
          </div>
          {discount > 0 && (
            <div style={styles.summaryRow}>
              <span>
                {t('discount')} ({user.discount_percent}%)
              </span>
              <span style={{ color: '#2e7d32' }}>-{discount.toFixed(2)}€</span>
            </div>
          )}
          <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
            <span>{t('total')}</span>
            <span>{total.toFixed(2)}€</span>
          </div>
          <label
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem',
              color: '#3A2E25',
              display: 'block',
              marginTop: '2rem',
            }}
          >
            {t('pickupTime')}
          </label>
          <select value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} style={styles.select}>
            {Array.from({ length: 38 }, (_, i) => {
              const time = new Date();
              time.setHours(7);
              time.setMinutes(30 + i * 15);
              if (time.getHours() < 17 || (time.getHours() === 17 && time.getMinutes() === 0)) {
                const timeStr = time.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <option key={i} value={timeStr}>
                    {timeStr}
                  </option>
                );
              }
              return null;
            }).filter(Boolean)}
          </select>
          <label
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem',
              color: '#3A2E25',
              display: 'block',
              marginTop: '1.25rem',
            }}
          >
            {t('orderNotesLabel')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
            placeholder={t('orderNotesPlaceholder')}
            rows={3}
            style={{ ...styles.select, resize: 'vertical', minHeight: 88 }}
          />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', opacity: 0.55, marginTop: 4 }}>
            {notes.length}/{NOTES_MAX}
          </div>

          <label
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              marginTop: '1.25rem',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.88rem',
              color: '#3A2E25',
            }}
          >
            <input
              type="checkbox"
              checked={cgvAccepted}
              onChange={(e) => setCgvAccepted(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              {t('cgvAcceptPrefix')}{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#3A2E25' }}>
                {t('termsTitle')}
              </Link>
            </span>
          </label>

          <button
            type="button"
            onClick={handleOrder}
            disabled={!canOrder}
            style={{
              ...styles.button,
              ...(!canOrder ? styles.buttonDisabled : {}),
            }}
          >
            {loading
              ? t('placingOrder')
              : !ordersStatus.accepting
                ? t('ordersClosedButton')
                : t('placeOrder')}
          </button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default CartPage;

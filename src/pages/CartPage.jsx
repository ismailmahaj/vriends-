import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/ordersService';

const CartPage = () => {
  const { items, updateQty, removeItem, clearCart, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pickupTime, setPickupTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    generatePickupTimes();
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
          minute: '2-digit'
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
      setError('Votre panier est vide');
      return;
    }

    if (!pickupTime) {
      setError('Veuillez sélectionner une heure de retrait');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));

      await createOrder(orderItems, pickupTime, calculateTotal());
      clearCart();
      navigate('/profile?success=1');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#E6DCCB',
      paddingTop: '80px',
      padding: '4rem 2rem'
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: window.innerWidth > 768 ? '2fr 1fr' : '1fr',
      gap: '3rem'
    },
    list: {
      background: '#F7F5F2',
      padding: '2rem'
    },
    item: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.5rem 0',
      borderBottom: '1px solid rgba(58,46,37,.12)'
    },
    itemInfo: {
      flex: 1
    },
    itemName: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.3rem',
      color: '#3A2E25',
      marginBottom: '0.3rem'
    },
    itemPrice: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      color: '#1C1C1C',
      opacity: 0.7
    },
    itemControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      margin: '0 1.5rem'
    },
    qtyButton: {
      background: '#3A2E25',
      color: '#F7F5F2',
      border: 'none',
      width: '32px',
      height: '32px',
      cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem'
    },
    qty: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      minWidth: '2rem',
      textAlign: 'center'
    },
    removeButton: {
      background: 'transparent',
      border: 'none',
      color: '#c0392b',
      cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.85rem'
    },
    itemTotal: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.3rem',
      color: '#3A2E25',
      minWidth: '80px',
      textAlign: 'right'
    },
    summary: {
      background: '#F7F5F2',
      padding: '2.5rem',
      position: 'sticky',
      top: '100px',
      height: 'fit-content'
    },
    summaryTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.8rem',
      color: '#3A2E25',
      marginBottom: '2rem'
    },
    summaryRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '1rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.95rem',
      color: '#1C1C1C'
    },
    summaryTotal: {
      marginTop: '1.5rem',
      paddingTop: '1.5rem',
      borderTop: '1px solid rgba(58,46,37,.12)',
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.8rem',
      color: '#3A2E25',
      fontWeight: 600
    },
    discount: {
      color: '#2e7d32',
      fontSize: '0.9rem',
      marginTop: '0.5rem'
    },
    select: {
      width: '100%',
      padding: '0.9rem',
      marginTop: '1rem',
      background: '#F7F5F2',
      border: '1.5px solid rgba(58,46,37,.2)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      color: '#1C1C1C'
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
      marginTop: '2rem'
    },
    error: {
      background: '#fdf0ee',
      border: '1px solid #e74c3c',
      color: '#c0392b',
      padding: '1rem',
      marginBottom: '1.5rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem'
    },
    empty: {
      textAlign: 'center',
      padding: '4rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1.1rem',
      color: '#1C1C1C'
    }
  };

  if (items.length === 0) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.empty}>
            <div style={{ marginBottom: '2rem' }}>Votre panier est vide</div>
            <button
              onClick={() => navigate('/menu')}
              style={styles.button}
            >
              Voir le menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const total = calculateTotal();
  const discount = user?.local_status && user?.discount_percent > 0
    ? subtotal - total
    : 0;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.list}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem', color: '#3A2E25', marginBottom: '2rem' }}>
            Votre panier
          </h2>
          {error && <div style={styles.error}>{error}</div>}
          {items.map((item) => (
            <div key={item.product.id} style={styles.item}>
              <div style={styles.itemInfo}>
                <div style={styles.itemName}>{item.product.name}</div>
                <div style={styles.itemPrice}>{item.product.price.toFixed(2)}€</div>
              </div>
              <div style={styles.itemControls}>
                <button
                  onClick={() => updateQty(item.product.id, item.quantity - 1)}
                  style={styles.qtyButton}
                >
                  −
                </button>
                <div style={styles.qty}>{item.quantity}</div>
                <button
                  onClick={() => updateQty(item.product.id, item.quantity + 1)}
                  style={styles.qtyButton}
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.product.id)}
                  style={styles.removeButton}
                >
                  Supprimer
                </button>
              </div>
              <div style={styles.itemTotal}>
                {(item.product.price * item.quantity).toFixed(2)}€
              </div>
            </div>
          ))}
        </div>

        <div style={styles.summary}>
          <h3 style={styles.summaryTitle}>Récapitulatif</h3>
          <div style={styles.summaryRow}>
            <span>Sous-total</span>
            <span>{subtotal.toFixed(2)}€</span>
          </div>
          {discount > 0 && (
            <>
              <div style={styles.summaryRow}>
                <span>Réduction ({user.discount_percent}%)</span>
                <span style={{ color: '#2e7d32' }}>-{discount.toFixed(2)}€</span>
              </div>
            </>
          )}
          <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
            <span>Total</span>
            <span>{total.toFixed(2)}€</span>
          </div>
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#3A2E25', display: 'block', marginTop: '2rem' }}>
            Heure de retrait
          </label>
          <select
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            style={styles.select}
          >
            {Array.from({ length: 38 }, (_, i) => {
              const time = new Date();
              time.setHours(7);
              time.setMinutes(30 + i * 15);
              if (time.getHours() < 17 || (time.getHours() === 17 && time.getMinutes() === 0)) {
                const timeStr = time.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
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
          <button
            onClick={handleOrder}
            disabled={loading}
            style={styles.button}
          >
            {loading ? 'Traitement...' : 'Passer la commande'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

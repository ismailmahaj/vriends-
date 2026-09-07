import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyOrders } from '../services/ordersService';
import { updateMyProfile } from '../services/authService';
import { useLanguage } from '../context/LanguageContext';

const ProfilePage = () => {
  const { t } = useLanguage();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addr, setAddr] = useState({
    phone: '',
    street: '',
    houseNumber: '',
    box: '',
    postalCode: '',
    city: '',
    country: 'Belgique',
    deliveryInstructions: '',
  });
  const [addrMsg, setAddrMsg] = useState('');
  const [addrSaving, setAddrSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
      setAddr({
        phone: user.phone || '',
        street: user.street || '',
        houseNumber: user.house_number || '',
        box: user.box || '',
        postalCode: user.postal_code || '',
        city: user.city || '',
        country: user.country || 'Belgique',
        deliveryInstructions: user.delivery_instructions || '',
      });
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'confirmed': return '#fb8c00';
      case 'preparing': return '#8d6e63';
      case 'ready': return '#4caf50';
      case 'delivering': return '#26a69a';
      case 'delivered':
      case 'completed': return '#2196f3';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    const map = {
      pending: t('pending'),
      confirmed: t('confirmed'),
      preparing: t('preparing'),
      ready: t('ready'),
      delivering: t('delivering'),
      delivered: t('delivered'),
      completed: t('completed'),
      cancelled: t('cancelled'),
    };
    return map[status] || status;
  };

  const statusSteps = (status) => {
    if (status === 'cancelled') return [];
    const delivery = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered'];
    const pickup = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
    const flow = status === 'delivering' || status === 'delivered' ? delivery : pickup;
    const idx = flow.indexOf(status);
    return flow.map((s, i) => ({ key: s, done: idx >= 0 && i <= idx, label: getStatusText(s) }));
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#E6DCCB',
      paddingTop: '80px',
      padding: '4rem 2rem'
    },
    container: {
      maxWidth: '700px',
      margin: '0 auto'
    },
    title: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '3rem',
      color: '#3A2E25',
      marginBottom: '3rem'
    },
    section: {
      background: '#F7F5F2',
      padding: '2.5rem',
      marginBottom: '2rem'
    },
    sectionTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.8rem',
      color: '#3A2E25',
      marginBottom: '1.5rem'
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '1rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      color: '#1C1C1C'
    },
    label: {
      fontWeight: 500,
      color: '#3A2E25'
    },
    badge: {
      display: 'inline-block',
      background: '#2e7d32',
      color: '#F7F5F2',
      padding: '0.3rem 0.8rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.85rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em'
    },
    discount: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.5rem',
      color: '#3A2E25',
      fontWeight: 600
    },
    orderCard: {
      background: '#F7F5F2',
      padding: '2rem',
      marginBottom: '1.5rem',
      border: '1px solid rgba(58,46,37,.12)'
    },
    orderHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    orderId: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.3rem',
      color: '#3A2E25'
    },
    statusBadge: {
      padding: '0.4rem 1rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.85rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: '#F7F5F2'
    },
    orderInfo: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.95rem',
      color: '#1C1C1C',
      marginBottom: '0.5rem'
    },
    orderItems: {
      marginTop: '1rem',
      paddingTop: '1rem',
      borderTop: '1px solid rgba(58,46,37,.12)'
    },
    orderItem: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      color: '#1C1C1C',
      marginBottom: '0.3rem'
    },
    button: {
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: '1rem 2rem',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer',
      marginTop: '2rem'
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>{t('profile')}</h1>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>{t('identity')}</h2>
          <div style={styles.infoRow}>
            <span style={styles.label}>{t('name')} :</span>
            <span>{user.name}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>{t('email')} :</span>
            <span>{user.email}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>{t('orderStatus')} :</span>
            <span>
              {user.local_status ? (
                <span style={styles.badge}>✓ {t('localBadge')}</span>
              ) : (
                t('nonLocal')
              )}
            </span>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>{t('advantages')}</h2>
          {user.local_status && user.discount_percent > 0 ? (
            <div style={styles.discount}>{t('discountActive')} : {user.discount_percent}%</div>
          ) : (
            <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#1C1C1C', opacity: 0.7 }}>
              {t('noDiscount')}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Adresse</h2>
          <div style={{ display: 'grid', gap: '0.65rem', maxWidth: 480 }}>
            {[
              ['phone', 'Téléphone'],
              ['street', 'Rue'],
              ['houseNumber', 'Numéro'],
              ['box', 'Boîte'],
              ['postalCode', 'Code postal'],
              ['city', 'Ville'],
              ['country', 'Pays'],
            ].map(([key, label]) => (
              <label key={key} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#3A2E25' }}>
                {label}
                <input
                  value={addr[key]}
                  onChange={(e) => setAddr((a) => ({ ...a, [key]: e.target.value }))}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: 4,
                    padding: '0.7rem 0.85rem',
                    border: '1.5px solid rgba(58,46,37,.2)',
                    background: '#F7F5F2',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </label>
            ))}
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#3A2E25' }}>
              Instructions de livraison
              <textarea
                value={addr.deliveryInstructions}
                onChange={(e) => setAddr((a) => ({ ...a, deliveryInstructions: e.target.value }))}
                rows={2}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 4,
                  padding: '0.7rem 0.85rem',
                  border: '1.5px solid rgba(58,46,37,.2)',
                  background: '#F7F5F2',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </label>
            <button
              type="button"
              disabled={addrSaving}
              onClick={async () => {
                setAddrSaving(true);
                setAddrMsg('');
                try {
                  const res = await updateMyProfile(addr);
                  updateUser(res.user);
                  setAddrMsg('Adresse enregistrée');
                } catch (e) {
                  setAddrMsg(e.response?.data?.error || t('error'));
                } finally {
                  setAddrSaving(false);
                }
              }}
              style={{
                ...styles.button,
                marginTop: '0.5rem',
                width: 'auto',
                alignSelf: 'start',
              }}
            >
              {addrSaving ? '…' : t('save')}
            </button>
            {addrMsg && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>{addrMsg}</div>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>{t('myOrders')}</h2>
          {loading ? (
            <div>{t('loading')}</div>
          ) : orders.length === 0 ? (
            <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#1C1C1C', opacity: 0.7 }}>
              {t('noOrders')}
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <div style={styles.orderId}>{t('orderNumber')} #{order.id}</div>
                  <div
                    style={{
                      ...styles.statusBadge,
                      background: getStatusColor(order.status)
                    }}
                  >
                    {getStatusText(order.status)}
                  </div>
                </div>
                {order.status !== 'cancelled' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.9rem' }}>
                    {statusSteps(order.status).map((step) => (
                      <span
                        key={step.key}
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.7rem',
                          padding: '0.25rem 0.55rem',
                          borderRadius: 999,
                          background: step.done ? '#3A2E25' : 'rgba(58,46,37,.08)',
                          color: step.done ? '#F7F5F2' : '#3A2E25',
                        }}
                      >
                        {step.label}
                      </span>
                    ))}
                  </div>
                )}
                <div style={styles.orderInfo}>{t('pickupTimeLabel')} : {order.pickup_time}</div>
                <div style={styles.orderInfo}>{t('total')} : {Number(order.total_price).toFixed(2)}€</div>
                {order.notes && (
                  <div style={{ ...styles.orderInfo, fontStyle: 'italic' }}>
                    {t('orderNotesLabel')} : {order.notes}
                  </div>
                )}
                {order.items && order.items.length > 0 && (
                  <div style={styles.orderItems}>
                    {order.items.map((item, i) => (
                      <div key={i} style={styles.orderItem}>
                        {item.product_name} x{item.quantity} - {(item.price * item.quantity).toFixed(2)}€
                        {item.options?.length > 0 && (
                          <div style={{ opacity: 0.65, fontSize: '0.8rem' }}>
                            {item.options.map((o) => o.label).join(', ')}
                          </div>
                        )}
                        {item.line_note && (
                          <div style={{ opacity: 0.75, fontSize: '0.8rem', fontStyle: 'italic' }}>
                            {t('lineNoteLabel')} : {item.line_note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ ...styles.orderInfo, fontSize: '0.85rem', opacity: 0.6, marginTop: '0.5rem' }}>
                  {new Date(order.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        <button onClick={handleLogout} style={styles.button}>
          {t('disconnect')}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;

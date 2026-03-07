import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyOrders } from '../services/ordersService';
import { useLanguage } from '../context/LanguageContext';

const ProfilePage = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
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
      case 'ready': return '#4caf50';
      case 'completed': return '#2196f3';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return t('pending');
      case 'ready': return t('ready');
      case 'completed': return t('completed');
      case 'cancelled': return t('cancelled');
      default: return status;
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
          <h2 style={styles.sectionTitle}>{t('orders')}</h2>
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
                <div style={styles.orderInfo}>{t('pickupTimeLabel')} : {order.pickup_time}</div>
                <div style={styles.orderInfo}>{t('total')} : {order.total_price.toFixed(2)}€</div>
                {order.items && order.items.length > 0 && (
                  <div style={styles.orderItems}>
                    {order.items.map((item, i) => (
                      <div key={i} style={styles.orderItem}>
                        {item.product_name} x{item.quantity} - {(item.price * item.quantity).toFixed(2)}€
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ ...styles.orderInfo, fontSize: '0.85rem', opacity: 0.6, marginTop: '0.5rem' }}>
                  {new Date(order.created_at).toLocaleString('fr-FR')}
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

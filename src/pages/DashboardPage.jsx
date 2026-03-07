import { useState, useEffect } from 'react';
import { getAllOrders, updateStatus } from '../services/ordersService';
import { getProducts, toggleProduct } from '../services/productsService';
import { getContacts, markTreated, deleteContact, exportCSV } from '../services/contactsService';
import { getUsers, exportUsersCSV } from '../services/authService';
import { getQRStats } from '../services/qrService';
import { getSetting, updateSetting } from '../services/settingsService';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [contacts, setContacts] = useState({ contacts: [], total: 0, newCount: 0 });
  const [users, setUsers] = useState([]);
  const [qrStats, setQrStats] = useState({ total: 0, today: 0, thisWeek: 0, thisMonth: 0 });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeUrlEditing, setQrCodeUrlEditing] = useState(false);
  const [qrCodeUrlTemp, setQrCodeUrlTemp] = useState('');
  const [qrCodeUrlSaving, setQrCodeUrlSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedContact, setExpandedContact] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Charger les stats QR et l'URL du QR code au montage
  useEffect(() => {
    const loadQRData = async () => {
      try {
        const stats = await getQRStats();
        setQrStats(stats);
        
        // Charger l'URL du QR code
        const url = await getSetting('qr_code_url');
        if (url) {
          setQrCodeUrl(url);
          setQrCodeUrlTemp(url);
        }
      } catch (error) {
        console.error('Erreur chargement données QR:', error);
      }
    };
    loadQRData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const data = await getAllOrders();
        setOrders(data);
      } else if (activeTab === 'products') {
        const data = await getProducts();
        setProducts(data);
      } else if (activeTab === 'contacts') {
        const data = await getContacts();
        setContacts(data);
      } else if (activeTab === 'users') {
        const data = await getUsers();
        setUsers(data);
      }
      
      // Toujours charger les stats QR
      const stats = await getQRStats();
      setQrStats(stats);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus(id, status);
      loadData();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  const handleToggleProduct = async (id, available) => {
    try {
      await toggleProduct(id);
      loadData();
    } catch (error) {
      console.error('Erreur toggle produit:', error);
    }
  };

  const handleMarkTreated = async (id, treated) => {
    try {
      await markTreated(id, treated);
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDeleteContact = async (id) => {
    if (!confirm('Supprimer ce contact ?')) return;
    setDeletingId(id);
    try {
      await deleteContact(id);
      loadData();
    } catch (error) {
      console.error('Erreur suppression:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const ordersByPickupTime = orders.reduce((acc, order) => {
    if (!acc[order.pickup_time]) {
      acc[order.pickup_time] = [];
    }
    acc[order.pickup_time].push(order);
    return acc;
  }, {});

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#E6DCCB',
      paddingTop: '80px',
      padding: '4rem 2rem'
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    title: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '3.5rem',
      color: '#3A2E25',
      marginBottom: '3rem'
    },
    tabs: {
      display: 'flex',
      gap: '2rem',
      marginBottom: '3rem',
      borderBottom: '1px solid rgba(58,46,37,.12)'
    },
    tab: {
      padding: '1rem 0',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: '#1C1C1C',
      opacity: 0.6,
      cursor: 'pointer',
      borderBottom: '2px solid transparent',
      marginBottom: '-1px'
    },
    tabActive: {
      opacity: 1,
      color: '#3A2E25',
      borderBottomColor: '#3A2E25'
    },
    badge: {
      display: 'inline-block',
      background: '#f44336',
      color: '#F7F5F2',
      padding: '0.2rem 0.6rem',
      borderRadius: '12px',
      fontSize: '0.75rem',
      marginLeft: '0.5rem'
    },
    section: {
      background: '#F7F5F2',
      padding: '2.5rem'
    },
    orderGroup: {
      marginBottom: '3rem'
    },
    groupTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.8rem',
      color: '#3A2E25',
      marginBottom: '1.5rem'
    },
    orderCard: {
      background: '#F7F5F2',
      border: '1px solid rgba(58,46,37,.12)',
      padding: '1.5rem',
      marginBottom: '1rem'
    },
    orderHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    orderInfo: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.95rem',
      color: '#1C1C1C',
      marginBottom: '0.3rem'
    },
    select: {
      padding: '0.6rem',
      background: '#F7F5F2',
      border: '1.5px solid rgba(58,46,37,.2)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem'
    },
    productCard: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.5rem',
      background: '#F7F5F2',
      border: '1px solid rgba(58,46,37,.12)',
      marginBottom: '1rem'
    },
    toggle: {
      position: 'relative',
      width: '50px',
      height: '26px',
      background: 'rgba(58,46,37,.2)',
      borderRadius: '13px',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    toggleActive: {
      background: '#3A2E25'
    },
    toggleDot: {
      position: 'absolute',
      top: '3px',
      left: '3px',
      width: '20px',
      height: '20px',
      background: '#F7F5F2',
      borderRadius: '50%',
      transition: 'transform 0.2s'
    },
    toggleDotActive: {
      transform: 'translateX(24px)'
    },
    contactCard: {
      background: '#F7F5F2',
      border: '1px solid rgba(58,46,37,.12)',
      padding: '1.5rem',
      marginBottom: '1rem'
    },
    contactHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    contactName: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.15rem',
      color: '#3A2E25'
    },
    contactBadge: {
      padding: '0.3rem 0.8rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em'
    },
    button: {
      padding: '0.5rem 1rem',
      margin: '0.3rem',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.85rem',
      cursor: 'pointer'
    },
    exportButton: {
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: '0.8rem 1.5rem',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer',
      marginBottom: '2rem'
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Dashboard Commerçant</h1>

        <div style={styles.tabs}>
          <div
            style={{ ...styles.tab, ...(activeTab === 'orders' && styles.tabActive) }}
            onClick={() => setActiveTab('orders')}
          >
            Commandes {pendingCount > 0 && <span style={styles.badge}>{pendingCount}</span>}
          </div>
          <div
            style={{ ...styles.tab, ...(activeTab === 'products' && styles.tabActive) }}
            onClick={() => setActiveTab('products')}
          >
            Produits
          </div>
          <div
            style={{ ...styles.tab, ...(activeTab === 'contacts' && styles.tabActive) }}
            onClick={() => setActiveTab('contacts')}
          >
            Contacts & Leads {contacts.newCount > 0 && <span style={styles.badge}>{contacts.newCount}</span>}
          </div>
          <div
            style={{ ...styles.tab, ...(activeTab === 'users' && styles.tabActive) }}
            onClick={() => setActiveTab('users')}
          >
            Utilisateurs
          </div>
        </div>

        {loading ? (
          <div>Chargement...</div>
        ) : (
          <div style={styles.section}>
            {activeTab === 'orders' && (
              <div>
                {Object.entries(ordersByPickupTime)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([pickupTime, timeOrders]) => (
                    <div key={pickupTime} style={styles.orderGroup}>
                      <h3 style={styles.groupTitle}>Retrait à {pickupTime}</h3>
                      {timeOrders.map((order) => (
                        <div key={order.id} style={styles.orderCard}>
                          <div style={styles.orderHeader}>
                            <div>
                              <div style={styles.orderInfo}>
                                <strong>Commande #{order.id}</strong> - {order.user?.name || 'N/A'} ({order.user?.email || 'N/A'})
                              </div>
                              <div style={styles.orderInfo}>Total : {order.total_price.toFixed(2)}€</div>
                            </div>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              style={styles.select}
                            >
                              <option value="pending">En attente</option>
                              <option value="ready">Prêt</option>
                              <option value="completed">Terminée</option>
                              <option value="cancelled">Annulée</option>
                            </select>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(58,46,37,.12)' }}>
                              {order.items.map((item, i) => (
                                <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                                  {item.product_name} x{item.quantity} - {(item.price * item.quantity).toFixed(2)}€
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                {products.map((product) => (
                  <div key={product.id} style={styles.productCard}>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', color: '#3A2E25' }}>
                        {product.name}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#1C1C1C', opacity: 0.7 }}>
                        {product.price.toFixed(2)}€
                      </div>
                    </div>
                    <div
                      style={{ ...styles.toggle, ...(product.available && styles.toggleActive) }}
                      onClick={() => handleToggleProduct(product.id, !product.available)}
                    >
                      <div style={{ ...styles.toggleDot, ...(product.available && styles.toggleDotActive) }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'contacts' && (
              <div>
                {/* Configuration URL QR Code */}
                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#F7F5F2', borderRadius: '2px' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#3A2E25', marginBottom: '1rem' }}>
                    🔗 Configuration QR Code
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", marginBottom: '1rem', padding: '1rem', background: '#E6DCCB', borderRadius: '4px', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#3A2E25', fontWeight: 500, marginBottom: '0.5rem' }}>
                      ℹ️ Le QR code pointe toujours vers une URL fixe de redirection
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#1C1C1C', opacity: 0.7 }}>
                      Même si vous changez l'URL ci-dessous, le QR code imprimé continuera de fonctionner et redirigera automatiquement vers la nouvelle URL.
                    </div>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#1C1C1C', opacity: 0.7, marginBottom: '0.5rem' }}>
                      URL de destination (où rediriger les scans du QR code)
                    </label>
                    {qrCodeUrlEditing ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={qrCodeUrlTemp}
                          onChange={(e) => setQrCodeUrlTemp(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '0.7rem',
                            border: '1.5px solid rgba(58,46,37,.2)',
                            background: '#F7F5F2',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.9rem'
                          }}
                          placeholder="https://votre-domaine.com/contact?qr=true"
                        />
                        <button
                          onClick={async () => {
                            setQrCodeUrlSaving(true);
                            try {
                              const urlToSave = qrCodeUrlTemp.trim();
                              console.log('🔍 Dashboard: Sauvegarde URL QR code:', urlToSave);
                              
                              if (!urlToSave || urlToSave === '') {
                                alert('❌ L\'URL ne peut pas être vide');
                                setQrCodeUrlSaving(false);
                                return;
                              }
                              
                              const response = await updateSetting('qr_code_url', urlToSave);
                              console.log('🔍 Dashboard: Réponse API:', response);
                              
                              setQrCodeUrl(urlToSave);
                              setQrCodeUrlEditing(false);
                              alert(`✅ URL du QR Code mise à jour avec succès !\n\nL'URL sauvegardée est : ${urlToSave}\n\nLes scans du QR code redirigeront maintenant vers cette URL.`);
                            } catch (error) {
                              console.error('❌ Dashboard: Erreur mise à jour URL QR code:', error);
                              console.error('❌ Dashboard: Détails erreur:', error.response?.data || error.message);
                              alert('❌ Erreur lors de la mise à jour. Vérifiez la console pour plus de détails.');
                            } finally {
                              setQrCodeUrlSaving(false);
                            }
                          }}
                          disabled={qrCodeUrlSaving}
                          style={{
                            padding: '0.7rem 1.5rem',
                            background: '#3A2E25',
                            color: '#F7F5F2',
                            border: 'none',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '.1em',
                            cursor: 'pointer'
                          }}
                        >
                          {qrCodeUrlSaving ? 'Sauvegarde...' : '✓ Sauvegarder'}
                        </button>
                        <button
                          onClick={() => {
                            setQrCodeUrlTemp(qrCodeUrl);
                            setQrCodeUrlEditing(false);
                          }}
                          style={{
                            padding: '0.7rem 1.5rem',
                            background: 'transparent',
                            color: '#3A2E25',
                            border: '1.5px solid #3A2E25',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '.1em',
                            cursor: 'pointer'
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ flex: 1, padding: '0.7rem', background: '#E6DCCB', borderRadius: '2px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#1C1C1C' }}>
                          {qrCodeUrl || 'Non configuré'}
                        </div>
                        <button
                          onClick={() => {
                            setQrCodeUrlTemp(qrCodeUrl);
                            setQrCodeUrlEditing(true);
                          }}
                          style={{
                            padding: '0.7rem 1.5rem',
                            background: '#3A2E25',
                            color: '#F7F5F2',
                            border: 'none',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '.1em',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Modifier
                        </button>
                      </div>
                    )}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#1C1C1C', opacity: 0.6 }}>
                      Le QR code pointe vers une URL fixe de redirection. Cette URL est la destination finale où les utilisateurs seront redirigés après avoir scanné le QR code.
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#F7F5F2', borderRadius: '2px' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#3A2E25', marginBottom: '1rem' }}>
                    📱 Statistiques QR Code
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: '1.5rem', fontFamily: "'DM Sans', sans-serif" }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#1C1C1C', opacity: 0.7, marginBottom: '0.5rem' }}>Total</div>
                      <div style={{ fontSize: '1.8rem', color: '#3A2E25', fontWeight: 600 }}>{qrStats.total}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#1C1C1C', opacity: 0.7, marginBottom: '0.5rem' }}>Aujourd'hui</div>
                      <div style={{ fontSize: '1.8rem', color: '#3A2E25', fontWeight: 600 }}>{qrStats.today}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#1C1C1C', opacity: 0.7, marginBottom: '0.5rem' }}>Cette semaine</div>
                      <div style={{ fontSize: '1.8rem', color: '#3A2E25', fontWeight: 600 }}>{qrStats.thisWeek}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#1C1C1C', opacity: 0.7, marginBottom: '0.5rem' }}>Ce mois</div>
                      <div style={{ fontSize: '1.8rem', color: '#3A2E25', fontWeight: 600 }}>{qrStats.thisMonth}</div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (contacts.contacts.length === 0) {
                      alert('Aucun contact à exporter');
                      return;
                    }
                    await exportCSV();
                  }} 
                  style={styles.exportButton}
                >
                  ↓ Exporter CSV ({contacts.total} contact{contacts.total > 1 ? 's' : ''})
                </button>
                {contacts.contacts.map((contact) => (
                  <div key={contact.id} style={styles.contactCard}>
                    <div style={styles.contactHeader}>
                      <div style={styles.contactName}>{contact.name}</div>
                      <div
                        style={{
                          ...styles.contactBadge,
                          background: contact.treated ? '#4caf50' : '#ff9800',
                          color: '#F7F5F2'
                        }}
                      >
                        {contact.treated ? 'Traité' : 'Nouveau'}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#1C1C1C', marginBottom: '0.5rem' }}>
                      {contact.email} {contact.phone && `· ${contact.phone}`}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#1C1C1C', opacity: 0.6 }}>
                      {new Date(contact.created_at).toLocaleString('fr-FR')}
                    </div>
                    {expandedContact === contact.id ? (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(58,46,37,.12)' }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', color: '#1C1C1C', marginBottom: '1rem' }}>
                          {contact.message}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleMarkTreated(contact.id, !contact.treated)}
                            style={{ ...styles.button, background: contact.treated ? '#ff9800' : '#4caf50', color: '#F7F5F2' }}
                          >
                            {contact.treated ? '↩ Non traité' : '✓ Traité'}
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            disabled={deletingId === contact.id}
                            style={{ ...styles.button, background: '#f44336', color: '#F7F5F2' }}
                          >
                            {deletingId === contact.id ? 'Suppression...' : '✕ Supprimer'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#1C1C1C', marginBottom: '0.5rem' }}>
                          {contact.message.substring(0, 100)}...
                        </div>
                        <button
                          onClick={() => setExpandedContact(contact.id)}
                          style={{ ...styles.button, background: '#3A2E25', color: '#F7F5F2' }}
                        >
                          ▼ Lire
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <button 
                  onClick={async () => {
                    if (users.length === 0) {
                      alert('Aucun utilisateur à exporter');
                      return;
                    }
                    await exportUsersCSV();
                  }} 
                  style={styles.exportButton}
                >
                  ↓ Exporter CSV ({users.length} utilisateur{users.length > 1 ? 's' : ''})
                </button>
                {users.map((user) => (
                  <div key={user.id} style={styles.contactCard}>
                    <div style={styles.contactHeader}>
                      <div style={styles.contactName}>{user.name}</div>
                      <div
                        style={{
                          ...styles.contactBadge,
                          background: user.role === 'admin' ? '#3A2E25' : '#2196f3',
                          color: '#F7F5F2'
                        }}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Client'}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#1C1C1C', marginBottom: '0.5rem' }}>
                      {user.email}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#1C1C1C', marginBottom: '0.5rem' }}>
                      {user.local_status && (
                        <span style={{ color: '#2e7d32', fontWeight: 500 }}>✓ Résident local</span>
                      )}
                      {user.local_status && user.discount_percent > 0 && (
                        <span style={{ marginLeft: '1rem', color: '#3A2E25' }}>
                          Réduction: {user.discount_percent}%
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#1C1C1C', opacity: 0.6 }}>
                      Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

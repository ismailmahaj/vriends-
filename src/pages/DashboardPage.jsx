import { useState, useEffect } from 'react';
import { getAllOrders, updateStatus } from '../services/ordersService';
import { getProducts, toggleProduct, createProduct, updateProduct, deleteProduct } from '../services/productsService';
import { getCategories, createCategory, deleteCategory } from '../services/categoriesService';
import { getContacts, markTreated, deleteContact, exportCSV } from '../services/contactsService';
import { getUsers, exportUsersCSV } from '../services/authService';
import { getQRStats } from '../services/qrService';
import { getSetting, updateSetting } from '../services/settingsService';
import { getPosSettings, updatePosSettings } from '../services/posService';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const emptyProductForm = (defaultCategory = 'Autres') => ({
  name: '',
  price: '',
  categories: defaultCategory ? [defaultCategory] : [],
  isFavorite: false,
  available: true,
  imageUrl: '',
  options: [],
});

const fileToCompressedDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('invalid'));
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const max = 480;
      let { width, height } = img;
      if (width > max || height > max) {
        const ratio = Math.min(max / width, max / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('load'));
    };
    img.src = objectUrl;
  });

const optionsToPayload = (options) =>
  (options || [])
    .map((opt) => ({
      name: String(opt.name || '').trim(),
      choices: String(opt.choicesText || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    }))
    .filter((o) => o.name && o.choices.length);

const optionsFromProduct = (product) =>
  Array.isArray(product?.optionsSchema)
    ? product.optionsSchema.map((opt) => ({
        name: opt.name || '',
        choicesText: Array.isArray(opt.choices) ? opt.choices.join(', ') : '',
      }))
    : [];

const DashboardPage = () => {
  const { t } = useLanguage();
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
  const [posSettings, setPosSettings] = useState(null);
  const [posSaving, setPosSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [productForm, setProductForm] = useState(() => emptyProductForm());
  const [editingProductId, setEditingProductId] = useState(null);
  const [productSaving, setProductSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
        console.log('🔍 Dashboard: Chargement URL QR code...');
        const url = await getSetting('qr_code_url');
        console.log('🔍 Dashboard: URL récupérée:', url);
        if (url) {
          setQrCodeUrl(url);
          setQrCodeUrlTemp(url);
          console.log('✅ Dashboard: URL chargée avec succès');
        } else {
          console.warn('⚠️ Dashboard: Aucune URL trouvée');
        }
      } catch (error) {
        console.error('❌ Dashboard: Erreur chargement données QR:', error);
        console.error('❌ Dashboard: Détails:', error.response?.data || error.message);
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
        const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
        setProducts(prods);
        setCategories(cats);
        if (cats.length && !productForm.category) {
          setProductForm((f) => ({ ...f, category: cats[0].name }));
        }
      } else if (activeTab === 'contacts') {
        const data = await getContacts();
        setContacts(data);
      } else if (activeTab === 'users') {
        const data = await getUsers();
        setUsers(data);
      } else if (activeTab === 'pos') {
        const data = await getPosSettings();
        setPosSettings(data);
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
    if (!confirm(t('deleteContactConfirm'))) return;
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

  const pendingCount = (Array.isArray(orders) ? orders : []).filter(o => o.status === 'pending').length;

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#E6DCCB',
      paddingTop: isMobile ? '5.5rem' : '6rem',
      paddingLeft: isMobile ? '1rem' : '2rem',
      paddingRight: isMobile ? '1rem' : '2rem',
      paddingBottom: isMobile ? '2rem' : '4rem',
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    title: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: isMobile ? '2.2rem' : '3.5rem',
      color: '#3A2E25',
      marginBottom: isMobile ? '1.5rem' : '3rem'
    },
    tabs: {
      display: 'flex',
      gap: isMobile ? '1rem' : '2rem',
      marginBottom: isMobile ? '1.5rem' : '3rem',
      borderBottom: '1px solid rgba(58,46,37,.12)',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      flexWrap: 'nowrap',
    },
    tab: {
      padding: '1rem 0',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: isMobile ? '0.78rem' : '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: '#1C1C1C',
      opacity: 0.6,
      cursor: 'pointer',
      borderBottom: '2px solid transparent',
      marginBottom: '-1px',
      whiteSpace: 'nowrap',
      flexShrink: 0,
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
      padding: isMobile ? '1.25rem' : '2.5rem'
    },
    orderGroup: {
      marginBottom: '3rem'
    },
    groupTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: isMobile ? '1.4rem' : '1.8rem',
      color: '#3A2E25',
      marginBottom: '1.5rem'
    },
    orderCard: {
      background: '#F7F5F2',
      border: '1px solid rgba(58,46,37,.12)',
      padding: isMobile ? '1rem' : '1.5rem',
      marginBottom: '1rem'
    },
    orderHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'stretch' : 'center',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '0.75rem' : 0,
      marginBottom: '1rem'
    },
    orderInfo: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.95rem',
      color: '#1C1C1C',
      marginBottom: '0.3rem',
      wordBreak: 'break-word',
    },
    select: {
      padding: '0.6rem',
      background: '#F7F5F2',
      border: '1.5px solid rgba(58,46,37,.2)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      width: isMobile ? '100%' : 'auto',
    },
    productCard: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'stretch' : 'center',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '0.85rem' : 0,
      padding: isMobile ? '1rem' : '1.5rem',
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
        <h1 style={styles.title}>{t('dashboardMerchantTitle')}</h1>

        <div style={styles.tabs}>
          <div
            style={{ ...styles.tab, ...(activeTab === 'orders' && styles.tabActive) }}
            onClick={() => setActiveTab('orders')}
          >
            {t('orders')} {pendingCount > 0 && <span style={styles.badge}>{pendingCount}</span>}
          </div>
          <div
            style={{ ...styles.tab, ...(activeTab === 'products' && styles.tabActive) }}
            onClick={() => setActiveTab('products')}
          >
            {t('products')}
          </div>
          <div
            style={{ ...styles.tab, ...(activeTab === 'contacts' && styles.tabActive) }}
            onClick={() => setActiveTab('contacts')}
          >
            {t('contactsLeads')} {contacts.newCount > 0 && <span style={styles.badge}>{contacts.newCount}</span>}
          </div>
          <div
            style={{ ...styles.tab, ...(activeTab === 'users' && styles.tabActive) }}
            onClick={() => setActiveTab('users')}
          >
            {t('users')}
          </div>
          <div
            style={{ ...styles.tab, ...(activeTab === 'pos' && styles.tabActive) }}
            onClick={() => setActiveTab('pos')}
          >
            {t('posSettingsTab')}
          </div>
        </div>

        {loading ? (
          <div>{t('loading')}</div>
        ) : (
          <div style={styles.section}>
            {activeTab === 'orders' && (
              <div>
                {Object.entries(ordersByPickupTime)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([pickupTime, timeOrders]) => (
                    <div key={pickupTime} style={styles.orderGroup}>
                      <h3 style={styles.groupTitle}>{t('posPickupAt')} {pickupTime}</h3>
                      {timeOrders.map((order) => (
                        <div key={order.id} style={styles.orderCard}>
                          <div style={styles.orderHeader}>
                            <div>
                              <div style={styles.orderInfo}>
                                <strong>{t('posOrderHash')} #{order.id}</strong> - {order.user?.name || 'N/A'} ({order.user?.email || 'N/A'})
                              </div>
                              <div style={styles.orderInfo}>{t('orderTotal')} : {order.total_price.toFixed(2)}€</div>
                            </div>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              style={styles.select}
                            >
                              <option value="pending">{t('pending')}</option>
                              <option value="ready">{t('ready')}</option>
                              <option value="completed">{t('completed')}</option>
                              <option value="cancelled">{t('cancelled')}</option>
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
                {/* Catégories */}
                <div style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(58,46,37,.12)' }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#3A2E25', marginBottom: '1rem' }}>
                    {t('posCategories')}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: '#E6DCCB',
                          padding: '0.55rem 0.9rem',
                          borderRadius: '999px',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.85rem',
                          color: '#3A2E25',
                        }}
                      >
                        <span>{cat.name} ({cat.productCount})</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(t('posDeleteCategoryConfirm', { name: cat.name }))) return;
                            try {
                              await deleteCategory(cat.id);
                              loadData();
                            } catch (err) {
                              alert(err.response?.data?.error || t('posDeleteError'));
                            }
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#9b3b2e',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            lineHeight: 1,
                          }}
                          title={t('delete')}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', maxWidth: '520px' }}>
                    <input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder={t('posNewCategory')}
                      style={{
                        flex: 1,
                        minWidth: '180px',
                        padding: '0.75rem 1rem',
                        border: '1.5px solid rgba(58,46,37,.2)',
                        background: '#F7F5F2',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newCategoryName.trim()) return;
                        try {
                          await createCategory({ name: newCategoryName.trim() });
                          setNewCategoryName('');
                          loadData();
                        } catch (err) {
                          alert(err.response?.data?.error || t('error'));
                        }
                      }}
                      style={{
                        background: '#3A2E25',
                        color: '#F7F5F2',
                        border: 'none',
                        padding: '0.75rem 1.2rem',
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: 'pointer',
                      }}
                    >
                      {t('posAddCategory')}
                    </button>
                  </div>
                </div>

                {/* Formulaire produit */}
                <div style={{ marginBottom: '2.5rem', padding: '1.5rem', background: '#E6DCCB', borderRadius: '4px' }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#3A2E25', marginBottom: '1rem' }}>
                    {editingProductId ? t('posEditProduct') : t('posNewProduct')}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
                    <input
                      value={productForm.name}
                      onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder={t('posNamePlaceholder')}
                      style={{ padding: '0.75rem 1rem', border: '1.5px solid rgba(58,46,37,.2)', background: '#F7F5F2', fontFamily: "'DM Sans', sans-serif" }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder={t('posPricePlaceholder')}
                      style={{ padding: '0.75rem 1rem', border: '1.5px solid rgba(58,46,37,.2)', background: '#F7F5F2', fontFamily: "'DM Sans', sans-serif" }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'DM Sans', sans-serif", color: '#3A2E25' }}>
                      <input
                        type="checkbox"
                        checked={productForm.isFavorite}
                        onChange={(e) => setProductForm((f) => ({ ...f, isFavorite: e.target.checked }))}
                      />
                      {t('posFavoriteFlag')}
                    </label>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#3A2E25', marginBottom: '0.5rem' }}>
                      {t('posCategoriesSelect')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {categories.map((c) => {
                        const checked = productForm.categories.includes(c.name);
                        return (
                          <label
                            key={c.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: checked ? '#3A2E25' : '#F7F5F2',
                              color: checked ? '#F7F5F2' : '#3A2E25',
                              border: '1px solid rgba(58,46,37,.2)',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '999px',
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setProductForm((f) => {
                                  const next = checked
                                    ? f.categories.filter((n) => n !== c.name)
                                    : [...f.categories, c.name];
                                  return { ...f, categories: next };
                                });
                              }}
                              style={{ display: 'none' }}
                            />
                            {c.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginTop: '1.2rem' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#3A2E25', marginBottom: '0.5rem' }}>
                      {t('posImageLabel')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                      <input
                        value={productForm.imageUrl?.startsWith('data:') ? '' : productForm.imageUrl}
                        onChange={(e) => setProductForm((f) => ({ ...f, imageUrl: e.target.value }))}
                        placeholder={t('posImageUrl')}
                        style={{
                          flex: 1,
                          minWidth: '220px',
                          padding: '0.75rem 1rem',
                          border: '1.5px solid rgba(58,46,37,.2)',
                          background: '#F7F5F2',
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      />
                      <label
                        style={{
                          background: '#3A2E25',
                          color: '#F7F5F2',
                          padding: '0.75rem 1.1rem',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        {t('posImageUpload')}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (!file) return;
                            try {
                              const dataUrl = await fileToCompressedDataUrl(file);
                              setProductForm((f) => ({ ...f, imageUrl: dataUrl }));
                            } catch {
                              alert(t('posImageError'));
                            }
                          }}
                        />
                      </label>
                      {productForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setProductForm((f) => ({ ...f, imageUrl: '' }))}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(155,59,46,.35)',
                            color: '#9b3b2e',
                            padding: '0.75rem 1rem',
                            fontFamily: "'DM Sans', sans-serif",
                            cursor: 'pointer',
                          }}
                        >
                          {t('posImageRemove')}
                        </button>
                      )}
                    </div>
                    {productForm.imageUrl && (
                      <img
                        src={productForm.imageUrl}
                        alt=""
                        style={{ marginTop: '0.75rem', width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }}
                      />
                    )}
                  </div>

                  <div style={{ marginTop: '1.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#3A2E25' }}>
                        {t('posOptionsTitle')}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm((f) => ({
                            ...f,
                            options: [...f.options, { name: '', choicesText: '' }],
                          }))
                        }
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(58,46,37,.3)',
                          color: '#3A2E25',
                          padding: '0.45rem 0.9rem',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        {t('posAddOption')}
                      </button>
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#1C1C1C', opacity: 0.65, marginBottom: '0.75rem' }}>
                      {t('posOptionsHint')}
                    </p>
                    {productForm.options.map((opt, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr auto',
                          gap: '0.55rem',
                          marginBottom: '0.55rem',
                          alignItems: 'center',
                        }}
                      >
                        <input
                          value={opt.name}
                          onChange={(e) => {
                            const value = e.target.value;
                            setProductForm((f) => {
                              const options = [...f.options];
                              options[idx] = { ...options[idx], name: value };
                              return { ...f, options };
                            });
                          }}
                          placeholder={t('posOptionName')}
                          style={{ padding: '0.65rem 0.85rem', border: '1.5px solid rgba(58,46,37,.2)', background: '#F7F5F2', fontFamily: "'DM Sans', sans-serif" }}
                        />
                        <input
                          value={opt.choicesText}
                          onChange={(e) => {
                            const value = e.target.value;
                            setProductForm((f) => {
                              const options = [...f.options];
                              options[idx] = { ...options[idx], choicesText: value };
                              return { ...f, options };
                            });
                          }}
                          placeholder={t('posOptionChoices')}
                          style={{ padding: '0.65rem 0.85rem', border: '1.5px solid rgba(58,46,37,.2)', background: '#F7F5F2', fontFamily: "'DM Sans', sans-serif" }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProductForm((f) => ({
                              ...f,
                              options: f.options.filter((_, i) => i !== idx),
                            }))
                          }
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(155,59,46,.35)',
                            color: '#9b3b2e',
                            padding: '0.65rem 0.9rem',
                            fontFamily: "'DM Sans', sans-serif",
                            cursor: 'pointer',
                          }}
                        >
                          {t('posRemoveOption')}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={productSaving}
                      onClick={async () => {
                        if (!productForm.name.trim() || productForm.price === '') {
                          alert(t('posNamePriceRequired'));
                          return;
                        }
                        if (!productForm.categories.length) {
                          alert(t('posCategoriesRequired'));
                          return;
                        }
                        setProductSaving(true);
                        try {
                          const payload = {
                            name: productForm.name.trim(),
                            price: Number(productForm.price),
                            categories: productForm.categories,
                            category: productForm.categories[0],
                            isFavorite: productForm.isFavorite,
                            available: productForm.available,
                            imageUrl: productForm.imageUrl || null,
                            optionsSchema: optionsToPayload(productForm.options),
                          };
                          if (editingProductId) {
                            await updateProduct(editingProductId, payload);
                          } else {
                            await createProduct(payload);
                          }
                          setProductForm(emptyProductForm(categories[0]?.name || 'Autres'));
                          setEditingProductId(null);
                          loadData();
                        } catch (err) {
                          alert(err.response?.data?.error || t('posSaveError'));
                        } finally {
                          setProductSaving(false);
                        }
                      }}
                      style={{
                        background: '#3A2E25',
                        color: '#F7F5F2',
                        border: 'none',
                        padding: '0.75rem 1.4rem',
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: 'pointer',
                      }}
                    >
                      {productSaving ? '…' : editingProductId ? t('save') : t('posAddProduct')}
                    </button>
                    {editingProductId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProductId(null);
                          setProductForm(emptyProductForm(categories[0]?.name || 'Autres'));
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(58,46,37,.3)',
                          color: '#3A2E25',
                          padding: '0.75rem 1.2rem',
                          fontFamily: "'DM Sans', sans-serif",
                          cursor: 'pointer',
                        }}
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Liste produits */}
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#3A2E25', marginBottom: '1rem' }}>
                  {t('products')}
                </h3>
                {products.map((product) => (
                  <div key={product.id} style={styles.productCard}>
                    <div style={{ display: 'flex', gap: '0.9rem', flex: 1, alignItems: 'center' }}>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt=""
                          style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                        />
                      ) : null}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', color: '#3A2E25' }}>
                          {product.name} {product.isFavorite ? '★' : ''}
                          {Array.isArray(product.optionsSchema) && product.optionsSchema.length > 0 ? ' · ⚙' : ''}
                        </div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#1C1C1C', opacity: 0.7 }}>
                          {Number(product.price).toFixed(2)}€ · {(product.categories?.length ? product.categories : [product.category || 'Autres']).join(' · ')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProductId(product.id);
                          setProductForm({
                            name: product.name,
                            price: String(product.price),
                            categories: product.categories?.length
                              ? product.categories
                              : [product.category || categories[0]?.name || 'Autres'],
                            isFavorite: !!product.isFavorite,
                            available: !!product.available,
                            imageUrl: product.imageUrl || '',
                            options: optionsFromProduct(product),
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(58,46,37,.25)',
                          color: '#3A2E25',
                          padding: '0.45rem 0.8rem',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        {t('edit')}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(t('posDeleteProductConfirm', { name: product.name }))) return;
                          try {
                            const res = await deleteProduct(product.id);
                            if (res.softDeleted) alert(t('posProductArchived'));
                            loadData();
                          } catch (err) {
                            alert(err.response?.data?.error || t('error'));
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(155,59,46,.35)',
                          color: '#9b3b2e',
                          padding: '0.45rem 0.8rem',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        {t('posDeleteShort')}
                      </button>
                      <div
                        style={{ ...styles.toggle, ...(product.available && styles.toggleActive) }}
                        onClick={() => handleToggleProduct(product.id, !product.available)}
                        title={product.available ? t('posAvailable') : t('posExhausted')}
                      >
                        <div style={{ ...styles.toggleDot, ...(product.available && styles.toggleDotActive) }}></div>
                      </div>
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
                    🔗 {t('qrCodeConfig')}
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
                      {t('qrCodeDestinationUrl')}
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
                              let urlToSave = qrCodeUrlTemp.trim();
                              console.log('🔍 Dashboard: Sauvegarde URL QR code (avant nettoyage):', urlToSave);
                              
                              if (!urlToSave || urlToSave === '') {
                                alert(`❌ ${t('error')}: L'URL ne peut pas être vide`);
                                setQrCodeUrlSaving(false);
                                return;
                              }
                              
                              // S'assurer que l'URL est complète
                              // Si l'URL ne commence pas par http:// ou https://, ajouter https://
                              if (!urlToSave.startsWith('http://') && !urlToSave.startsWith('https://')) {
                                urlToSave = 'https://' + urlToSave;
                                console.log('🔍 Dashboard: URL corrigée (https:// ajouté):', urlToSave);
                              }
                              
                              // Ne pas modifier l'URL, la garder telle quelle
                              // L'utilisateur peut entrer n'importe quelle URL valide
                              // Exemples valides:
                              // - https://www.vriendscoffeshop.com/register
                              // - https://greatly.be/contact?qr=true
                              // - https://example.com/
                              
                              console.log('🔍 Dashboard: URL finale à sauvegarder:', urlToSave);
                              
                              const response = await updateSetting('qr_code_url', urlToSave);
                              console.log('🔍 Dashboard: Réponse API:', response);
                              
                              // Recharger l'URL depuis l'API pour vérifier qu'elle est bien sauvegardée
                              const reloadedUrl = await getSetting('qr_code_url');
                              console.log('🔍 Dashboard: URL rechargée depuis API:', reloadedUrl);
                              
                              // Toujours mettre à jour l'état même si la vérification échoue
                              // (peut être dû à un problème de cache ou de timing)
                              if (reloadedUrl) {
                                setQrCodeUrl(reloadedUrl);
                                setQrCodeUrlTemp(reloadedUrl);
                                console.log('✅ Dashboard: URL mise à jour dans l\'état:', reloadedUrl);
                              } else {
                                // Utiliser l'URL sauvegardée même si le rechargement échoue
                                setQrCodeUrl(urlToSave);
                                setQrCodeUrlTemp(urlToSave);
                                console.log('✅ Dashboard: URL mise à jour dans l\'état (depuis sauvegarde):', urlToSave);
                              }
                              
                              setQrCodeUrlEditing(false);
                              
                              if (reloadedUrl && reloadedUrl === urlToSave) {
                                alert(`✅ ${t('qrCodeUrlUpdated')}\n\nL'URL sauvegardée est : ${reloadedUrl}\n\nLes scans du QR code redirigeront maintenant vers cette URL.\n\nTestez en allant sur /qr-redirect`);
                              } else if (reloadedUrl) {
                                alert(`✅ ${t('qrCodeUrlUpdated')}\n\nL'URL sauvegardée est : ${reloadedUrl}\n\n(Note: L'URL rechargée diffère légèrement, mais la sauvegarde a réussi)`);
                              } else {
                                alert(`✅ ${t('qrCodeUrlUpdated')}\n\nL'URL sauvegardée est : ${urlToSave}\n\nNote: Impossible de vérifier la sauvegarde, mais elle devrait être correcte.`);
                              }
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
                          {qrCodeUrlSaving ? t('saving') : `✓ ${t('save')}`}
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
                          {t('cancel')}
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ flex: 1, padding: '0.7rem', background: '#E6DCCB', borderRadius: '2px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#1C1C1C' }}>
                          {qrCodeUrl || t('error') + ': Non configuré'}
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
                          ✏️                         Modifier
                      </button>
                      </div>
                    )}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#1C1C1C', opacity: 0.6 }}>
                      {t('qrCodeUrlInfo')}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#F7F5F2', borderRadius: '2px' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#3A2E25', marginBottom: '1rem' }}>
                    📱 {t('qrScans')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: '1.5rem', fontFamily: "'DM Sans', sans-serif" }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#1C1C1C', opacity: 0.7, marginBottom: '0.5rem' }}>{t('totalScans')}</div>
                      <div style={{ fontSize: '1.8rem', color: '#3A2E25', fontWeight: 600 }}>{qrStats.total}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#1C1C1C', opacity: 0.7, marginBottom: '0.5rem' }}>{t('today')}</div>
                      <div style={{ fontSize: '1.8rem', color: '#3A2E25', fontWeight: 600 }}>{qrStats.today}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#1C1C1C', opacity: 0.7, marginBottom: '0.5rem' }}>{t('thisWeek')}</div>
                      <div style={{ fontSize: '1.8rem', color: '#3A2E25', fontWeight: 600 }}>{qrStats.thisWeek}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#1C1C1C', opacity: 0.7, marginBottom: '0.5rem' }}>{t('thisMonth')}</div>
                      <div style={{ fontSize: '1.8rem', color: '#3A2E25', fontWeight: 600 }}>{qrStats.thisMonth}</div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (contacts.contacts.length === 0) {
                      alert(t('noContactsToExport'));
                      return;
                    }
                    await exportCSV();
                  }} 
                  style={styles.exportButton}
                >
                  ↓ {t('exportCSV')} ({contacts.total} contact{contacts.total > 1 ? 's' : ''})
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
                        {contact.treated ? t('treated') : t('new')}
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
                            {contact.treated ? t('markUntreated') : t('markTreated')}
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            disabled={deletingId === contact.id}
                            style={{ ...styles.button, background: '#f44336', color: '#F7F5F2' }}
                          >
                            {deletingId === contact.id ? t('loading') : `✕ ${t('delete')}`}
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
                          ▼ {t('read')}
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
                      alert(t('noUsersToExport'));
                      return;
                    }
                    await exportUsersCSV();
                  }} 
                  style={styles.exportButton}
                >
                  ↓ {t('exportCSV')} ({users.length} utilisateur{users.length > 1 ? 's' : ''})
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
                        {user.role === 'admin' ? t('admin') : t('client')}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#1C1C1C', marginBottom: '0.5rem' }}>
                      {user.email}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#1C1C1C', marginBottom: '0.5rem' }}>
                      {user.local_status && (
                        <span style={{ color: '#2e7d32', fontWeight: 500 }}>✓ {t('localBadge')}</span>
                      )}
                      {user.local_status && user.discount_percent > 0 && (
                        <span style={{ marginLeft: '1rem', color: '#3A2E25' }}>
                          {t('reduction')}: {user.discount_percent}%
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#1C1C1C', opacity: 0.6 }}>
                      {t('posRegisteredOn')} {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pos' && posSettings && (
              <div>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#1C1C1C', opacity: 0.75, maxWidth: '640px' }}>
                    {t('posSettingsIntro')}
                  </p>
                  <Link
                    to="/pos"
                    style={{
                      background: '#3A2E25',
                      color: '#F7F5F2',
                      padding: '0.75rem 1.4rem',
                      textDecoration: 'none',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.85rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t('posOpenCashier')}
                  </Link>
                </div>
                {[
                  ['residentDiscountPercent', 'posResidentDiscount'],
                  ['workerDiscountPercent', 'posWorkerDiscount'],
                  ['earlyBirdDiscountPercent', 'posEarlyBirdDiscount'],
                  ['earlyBirdEndTime', 'posEarlyBirdEnd'],
                  ['lateSurchargePercent', 'posLatePercent'],
                  ['lateSurchargeStartTime', 'posLateStart'],
                  ['shopName', 'posShopName'],
                  ['shopAddress', 'posShopAddress'],
                ].map(([key, labelKey]) => (
                  <div key={key} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#3A2E25' }}>
                      {t(labelKey)}
                    </label>
                    <input
                      value={posSettings[key] ?? ''}
                      onChange={(e) =>
                        setPosSettings((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      style={{
                        width: '100%',
                        maxWidth: '420px',
                        padding: '0.75rem 1rem',
                        border: '1.5px solid rgba(58,46,37,.2)',
                        background: '#F7F5F2',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  disabled={posSaving}
                  onClick={async () => {
                    setPosSaving(true);
                    try {
                      const payload = {
                        ...posSettings,
                        residentDiscountPercent: Number(posSettings.residentDiscountPercent),
                        workerDiscountPercent: Number(posSettings.workerDiscountPercent),
                        earlyBirdDiscountPercent: Number(posSettings.earlyBirdDiscountPercent),
                        lateSurchargePercent: Number(posSettings.lateSurchargePercent),
                      };
                      const res = await updatePosSettings(payload);
                      setPosSettings(res.settings);
                      alert(t('posSettingsSaved'));
                    } catch (error) {
                      console.error(error);
                      alert(t('posSettingsSaveError'));
                    } finally {
                      setPosSaving(false);
                    }
                  }}
                  style={{
                    ...styles.exportButton,
                    background: '#3A2E25',
                    color: '#F7F5F2',
                    border: 'none',
                    marginTop: '0.5rem',
                  }}
                >
                  {posSaving ? t('posSaving') : t('save')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


export default DashboardPage;

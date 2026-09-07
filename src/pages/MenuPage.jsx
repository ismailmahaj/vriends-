import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getProducts } from '../services/productsService';
import { getCategories } from '../services/categoriesService';
import { getOrdersStatus } from '../services/shopSettingsService';
import { useLanguage } from '../context/LanguageContext';
import ProductOptionsModal from '../components/ProductOptionsModal';
import ImageLightbox from '../components/ImageLightbox';
import { normalizeOptionsSchema } from '../lib/optionsEngine';

const MenuPage = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [optionsProduct, setOptionsProduct] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [ordersStatus, setOrdersStatus] = useState({ accepting: true, message: '' });
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const { user } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    loadCatalog();
    getOrdersStatus()
      .then(setOrdersStatus)
      .catch(() => {});
  }, []);

  const loadCatalog = async () => {
    try {
      const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats.filter((c) => c.isActive !== false) : []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => p.available !== false);
    if (activeCategory === 'ALL') return list;
    return list.filter((p) => {
      const cats = p.categories?.length ? p.categories : [p.category];
      return cats.includes(activeCategory);
    });
  }, [products, activeCategory]);

  const handleAddToCart = (product) => {
    if (!product.available) return;
    const schema = normalizeOptionsSchema(product.optionsSchema);
    if (schema?.length) {
      setOptionsProduct(product);
      return;
    }
    addItem(product);
    setToast(t('addedToCart'));
    setTimeout(() => setToast(null), 2000);
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#E6DCCB',
      paddingTop: isMobile ? '5.5rem' : '6rem',
      paddingLeft: isMobile ? '1rem' : '2rem',
      paddingRight: isMobile ? '1rem' : '2rem',
      paddingBottom: '3rem',
    },
    container: { maxWidth: '1400px', margin: '0 auto' },
    header: { marginBottom: isMobile ? '1.5rem' : '2.5rem', textAlign: 'center' },
    title: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: isMobile ? '2.4rem' : '4rem',
      color: '#3A2E25',
      marginBottom: '0.5rem',
    },
    subtitle: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      color: '#1C1C1C',
      opacity: 0.7,
    },
    banner: {
      background: '#fdf0ee',
      border: '1px solid #e74c3c',
      color: '#c0392b',
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.95rem',
      textAlign: 'center',
    },
    catsWrap: {
      display: 'flex',
      gap: '0.55rem',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      paddingBottom: '0.75rem',
      marginBottom: '1.5rem',
    },
    catBtn: (active) => ({
      flexShrink: 0,
      border: `1.5px solid ${active ? '#3A2E25' : 'rgba(58,46,37,.2)'}`,
      background: active ? '#3A2E25' : '#F7F5F2',
      color: active ? '#F7F5F2' : '#3A2E25',
      padding: '0.7rem 1.1rem',
      borderRadius: 999,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.82rem',
      letterSpacing: '.04em',
      cursor: 'pointer',
      minHeight: 44,
    }),
    grid: {
      display: 'grid',
      gridTemplateColumns: isMobile
        ? '1fr'
        : window.innerWidth > 1024
          ? 'repeat(4, 1fr)'
          : 'repeat(2, 1fr)',
      gap: '1.25rem',
    },
    card: {
      background: '#F7F5F2',
      padding: isMobile ? '1.4rem' : '2rem',
      position: 'relative',
    },
    cardUnavailable: { opacity: 0.5 },
    name: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.55rem',
      color: '#3A2E25',
      marginBottom: '0.35rem',
    },
    price: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1.05rem',
      color: '#1C1C1C',
    },
    priceReduced: {
      textDecoration: 'line-through',
      opacity: 0.5,
      marginRight: '0.5rem',
    },
    unavailable: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      color: '#c0392b',
      marginTop: '0.75rem',
    },
    button: {
      marginTop: '1.2rem',
      width: '100%',
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: '0.9rem',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.85rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer',
      minHeight: 48,
    },
    buttonDisabled: { opacity: 0.5, cursor: 'not-allowed' },
    toast: {
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: '1rem 2rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      zIndex: 1000,
    },
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>{t('loading')}</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('ourMenu')}</h1>
          <p style={styles.subtitle}>{t('menuSubtitle')}</p>
        </div>

        {!ordersStatus.accepting && (
          <div style={styles.banner} role="alert">
            {ordersStatus.message || t('ordersClosedDefault')}
          </div>
        )}

        <div style={styles.catsWrap}>
          <button type="button" style={styles.catBtn(activeCategory === 'ALL')} onClick={() => setActiveCategory('ALL')}>
            {t('posAllCategories') || 'Tous'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              style={styles.catBtn(activeCategory === cat.name)}
              onClick={() => setActiveCategory(cat.name)}
            >
              {cat.icon ? `${cat.icon} ` : ''}
              {cat.name}
            </button>
          ))}
        </div>

        <div style={styles.grid}>
          {filteredProducts.map((product) => {
            const discount = user?.local_status && user?.discount_percent > 0;
            const finalPrice = discount
              ? product.price * (1 - user.discount_percent / 100)
              : product.price;
            const hasOptions = !!normalizeOptionsSchema(product.optionsSchema)?.length;

            return (
              <div
                key={product.id}
                style={{
                  ...styles.card,
                  ...(!product.available && styles.cardUnavailable),
                }}
              >
                {product.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => setLightbox({ src: product.imageUrl, alt: product.name })}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'zoom-in',
                      marginBottom: '1rem',
                    }}
                    aria-label={`${t('enlargePhoto')} — ${product.name}`}
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 4, display: 'block' }}
                    />
                  </button>
                ) : (
                  <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }} aria-hidden>
                    ✨
                  </div>
                )}
                <div style={styles.name}>{product.name}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', opacity: 0.6, marginBottom: '0.45rem' }}>
                  {(product.categories || [product.category]).filter(Boolean).join(' · ')}
                  {hasOptions ? ` · ${t('posHasOptions')}` : ''}
                </div>
                <div style={styles.price}>
                  {discount && <span style={styles.priceReduced}>{product.price.toFixed(2)}€</span>}
                  {finalPrice.toFixed(2)}€
                </div>
                {!product.available && <div style={styles.unavailable}>{t('unavailable')}</div>}
                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.available}
                  style={{
                    ...styles.button,
                    ...(!product.available && styles.buttonDisabled),
                  }}
                >
                  + {hasOptions ? t('posCustomize') : t('addToCart')}
                </button>
              </div>
            );
          })}
        </div>
        {!filteredProducts.length && (
          <p style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif", opacity: 0.65, marginTop: '2rem' }}>
            {t('posNoProducts')}
          </p>
        )}
      </div>

      {optionsProduct && (
        <ProductOptionsModal
          product={optionsProduct}
          onClose={() => setOptionsProduct(null)}
          onConfirm={(selection, unitPrice) => {
            addItem(optionsProduct, selection, unitPrice);
            setOptionsProduct(null);
            setToast(t('addedToCart'));
            setTimeout(() => setToast(null), 2000);
          }}
        />
      )}
      {lightbox && (
        <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
};

export default MenuPage;

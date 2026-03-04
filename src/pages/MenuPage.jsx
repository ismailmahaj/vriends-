import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getProducts } from '../services/productsService';

const MenuPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const { user } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (!product.available) return;
    addItem(product);
    setToast('Ajouté au panier ✓');
    setTimeout(() => setToast(null), 2000);
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
      margin: '0 auto'
    },
    header: {
      marginBottom: '4rem',
      textAlign: 'center'
    },
    title: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '4rem',
      color: '#3A2E25',
      marginBottom: '1rem'
    },
    subtitle: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      color: '#1C1C1C',
      opacity: 0.7
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(4, 1fr)' : window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
      gap: '2rem'
    },
    card: {
      background: '#F7F5F2',
      padding: '2.4rem 2rem',
      position: 'relative'
    },
    cardUnavailable: {
      opacity: 0.5
    },
    emoji: {
      fontSize: '2.4rem',
      marginBottom: '1rem'
    },
    name: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.5rem',
      color: '#3A2E25',
      marginBottom: '0.5rem'
    },
    price: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.8rem',
      color: '#3A2E25',
      marginTop: '1rem'
    },
    priceReduced: {
      textDecoration: 'line-through',
      opacity: 0.5,
      fontSize: '1.2rem',
      marginRight: '0.5rem'
    },
    unavailable: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      color: '#c0392b',
      marginTop: '1rem'
    },
    button: {
      marginTop: '1.5rem',
      width: '100%',
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: '0.9rem',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.85rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    toast: {
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: '1rem 2rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      zIndex: 1000
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Notre Menu</h1>
          <p style={styles.subtitle}>Découvrez notre sélection</p>
        </div>
        <div style={styles.grid}>
          {products.map((product) => {
            const discount = user?.local_status && user?.discount_percent > 0;
            const finalPrice = discount
              ? product.price * (1 - user.discount_percent / 100)
              : product.price;

            return (
              <div
                key={product.id}
                style={{
                  ...styles.card,
                  ...(!product.available && styles.cardUnavailable)
                }}
              >
                <div style={styles.emoji}>
                  {product.name === 'Menu Phare' && '☕'}
                  {product.name === 'Croissant' && '🥐'}
                  {product.name === 'Jus Zumex' && '🍊'}
                  {(product.name === 'Gaufre-Crêpe' || product.name === 'Gaufre') && '🧇'}
                </div>
                <div style={styles.name}>{product.name}</div>
                <div style={styles.price}>
                  {discount && (
                    <span style={styles.priceReduced}>{product.price.toFixed(2)}€</span>
                  )}
                  {finalPrice.toFixed(2)}€
                </div>
                {!product.available && (
                  <div style={styles.unavailable}>Indisponible</div>
                )}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.available}
                  style={{
                    ...styles.button,
                    ...(!product.available && styles.buttonDisabled)
                  }}
                >
                  + Ajouter
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
};

export default MenuPage;

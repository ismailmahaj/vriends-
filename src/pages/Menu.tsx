import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, Product } from '../services/product.service';
import { authService } from '../services/auth.service';
import './Menu.css';

export default function Menu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadCart();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const addToCart = (product: Product) => {
    if (!product.available) return;

    const updatedCart = [...cart];
    const existingItem = updatedCart.find((item) => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      updatedCart.push({ product, quantity: 1 });
    }

    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const goToCart = () => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    navigate('/cart');
  };

  if (loading) {
    return <div className="menu-loading">Chargement...</div>;
  }

  return (
    <div className="menu-page">
      <div className="menu-container">
        <h1 className="menu-title">Notre Menu</h1>
        <div className="products-grid">
          {products.map((product) => (
            <div
              key={product.id}
              className={`product-card ${!product.available ? 'unavailable' : ''}`}
            >
              <h3>{product.name}</h3>
              <p className="product-price">{product.price.toFixed(2)} €</p>
              {!product.available && (
                <p className="product-unavailable">Indisponible</p>
              )}
              <button
                onClick={() => addToCart(product)}
                disabled={!product.available}
                className="btn-add-cart"
              >
                Ajouter au panier
              </button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="cart-summary">
            <p>
              {cart.reduce((sum, item) => sum + item.quantity, 0)} article(s) dans le panier
            </p>
            <button onClick={goToCart} className="btn-primary">
              Voir le panier
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

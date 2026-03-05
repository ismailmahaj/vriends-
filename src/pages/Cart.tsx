import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/order.service';
import { authService } from '../services/auth.service';
import type { User } from '../services/auth.service';
import './Cart.css';

export default function Cart() {
  const [cart, setCart] = useState<Array<{ product: any; quantity: number }>>([]);
  const [user, setUser] = useState<User | null>(null);
  const [pickupTime, setPickupTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    loadUser();
    generatePickupTimes();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const loadUser = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  };

  const generatePickupTimes = () => {
    const times = [];
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);

    for (let i = 0; i < 12; i++) {
      const time = new Date(now);
      time.setHours(time.getHours() + i);
      const timeStr = time.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      times.push(timeStr);
    }
    if (!pickupTime && times.length > 0) {
      setPickupTime(times[0]);
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    const updatedCart = cart.map((item) => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean) as Array<{ product: any; quantity: number }>;

    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (productId: number) => {
    const updatedCart = cart.filter((item) => item.product.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const calculateTotal = () => {
    let total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    if (user?.local_status && user?.discount_percent) {
      total = total * (1 - user.discount_percent / 100);
    }
    return total;
  };

  const handleOrder = async () => {
    if (cart.length === 0) {
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
      const items = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      await orderService.createOrder(items, pickupTime);
      localStorage.removeItem('cart');
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <h1>Votre panier</h1>
          <p>Votre panier est vide</p>
          <a href="/menu" className="btn-primary">
            Voir le menu
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1>Votre panier</h1>
        {error && <div className="error-message">{error}</div>}
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.product.id} className="cart-item">
              <div className="cart-item-info">
                <h3>{item.product.name}</h3>
                <p>{item.product.price.toFixed(2)} €</p>
              </div>
              <div className="cart-item-controls">
                <button onClick={() => updateQuantity(item.product.id, -1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, 1)}>+</button>
                <button onClick={() => removeItem(item.product.id)} className="btn-remove">
                  Supprimer
                </button>
              </div>
              <div className="cart-item-total">
                {(item.product.price * item.quantity).toFixed(2)} €
              </div>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          {user?.local_status && user?.discount_percent && (
            <div className="discount-info">
              Réduction locale : {user.discount_percent}%
            </div>
          )}
          <div className="pickup-time">
            <label>Heure de retrait :</label>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
            >
              {Array.from({ length: 12 }, (_, i) => {
                const time = new Date();
                time.setHours(time.getHours() + i + 1);
                time.setMinutes(0);
                const timeStr = time.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <option key={i} value={timeStr}>
                    {timeStr}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="cart-total">
            <strong>Total : {calculateTotal().toFixed(2)} €</strong>
          </div>
          <button
            onClick={handleOrder}
            disabled={loading}
            className="btn-primary btn-order"
          >
            {loading ? 'Traitement...' : 'Commander'}
          </button>
        </div>
      </div>
    </div>
  );
}

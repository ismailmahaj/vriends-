import { useState, useEffect } from 'react';
import { authService, User } from '../services/auth.service';
import { orderService, Order } from '../services/order.service';
import './Profile.css';

interface ProfileProps {
  user: User | null;
  setUser: (user: any) => void;
}

export default function Profile({ user, setUser }: ProfileProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Mon Profil</h1>
        <div className="profile-info">
          <div className="info-card">
            <h2>Informations</h2>
            <p><strong>Nom :</strong> {user.name}</p>
            <p><strong>Email :</strong> {user.email}</p>
            <p>
              <strong>Statut :</strong>{' '}
              {user.local_status ? (
                <span className="status-local">✓ Local</span>
              ) : (
                <span className="status-not-local">Non local</span>
              )}
            </p>
            {user.local_status && user.discount_percent > 0 && (
              <p>
                <strong>Réduction :</strong>{' '}
                <span className="discount">{user.discount_percent}%</span>
              </p>
            )}
          </div>
        </div>
        <div className="orders-section">
          <h2>Mes commandes</h2>
          {loading ? (
            <p>Chargement...</p>
          ) : orders.length === 0 ? (
            <p>Aucune commande</p>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <p>
                      <strong>Commande #{order.id}</strong>
                    </p>
                    <p className={`status status-${order.status}`}>
                      {order.status === 'pending' && 'En attente'}
                      {order.status === 'preparing' && 'En préparation'}
                      {order.status === 'ready' && 'Prête'}
                      {order.status === 'completed' && 'Terminée'}
                    </p>
                  </div>
                  <p>Retrait : {order.pickup_time}</p>
                  <p>Total : {order.total_price.toFixed(2)} €</p>
                  <div className="order-items">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="order-item">
                        {item.product.name} x{item.quantity} -{' '}
                        {(item.price * item.quantity).toFixed(2)} €
                      </div>
                    ))}
                  </div>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

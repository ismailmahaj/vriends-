import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboard.service';
import type { Order } from '../services/dashboard.service';
import { productService } from '../services/product.service';
import type { Product } from '../services/product.service';
import './Dashboard.css';

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersData, productsData] = await Promise.all([
        dashboardService.getOrders(),
        productService.getProducts(),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await dashboardService.updateOrderStatus(orderId, status);
      loadData();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  const handleProductToggle = async (productId: number, available: boolean) => {
    try {
      await productService.updateAvailability(productId, available);
      loadData();
    } catch (error) {
      console.error('Erreur mise à jour produit:', error);
    }
  };

  // Grouper les commandes par heure de retrait
  const ordersByPickupTime = orders.reduce((acc, order) => {
    if (!acc[order.pickup_time]) {
      acc[order.pickup_time] = [];
    }
    acc[order.pickup_time].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  if (loading) {
    return <div className="dashboard-loading">Chargement...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <h1>Dashboard Commerçant</h1>

        <div className="dashboard-section">
          <h2>Gestion des produits</h2>
          <div className="products-admin">
            {products.map((product) => (
              <div key={product.id} className="product-admin-card">
                <h3>{product.name}</h3>
                <p>{product.price.toFixed(2)} €</p>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={product.available}
                    onChange={(e) =>
                      handleProductToggle(product.id, e.target.checked)
                    }
                  />
                  <span>{product.available ? 'Disponible' : 'Indisponible'}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Commandes</h2>
          {Object.keys(ordersByPickupTime).length === 0 ? (
            <p>Aucune commande</p>
          ) : (
            Object.entries(ordersByPickupTime)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([pickupTime, timeOrders]) => (
                <div key={pickupTime} className="pickup-time-group">
                  <h3>Retrait à {pickupTime}</h3>
                  {timeOrders.map((order) => (
                    <div key={order.id} className="order-admin-card">
                      <div className="order-admin-header">
                        <div>
                          <p>
                            <strong>Commande #{order.id}</strong> - {order.user.name} (
                            {order.user.email})
                          </p>
                          <p>Total : {order.total_price.toFixed(2)} €</p>
                        </div>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          className="status-select"
                        >
                          <option value="pending">En attente</option>
                          <option value="preparing">En préparation</option>
                          <option value="ready">Prête</option>
                          <option value="completed">Terminée</option>
                        </select>
                      </div>
                      <div className="order-admin-items">
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="order-admin-item">
                            {item.product.name} x{item.quantity} -{' '}
                            {(item.price * item.quantity).toFixed(2)} €
                          </div>
                        ))}
                      </div>
                      <p className="order-admin-date">
                        {new Date(order.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

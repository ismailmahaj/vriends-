import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPosOrder, getPosOrders } from '../services/posService';
import { formatCents } from '../lib/pricingEngine';
import PosTicket from './PosTicket';
import { getPosSettings } from '../services/posService';
import './pos.css';

const CUSTOMER_LABEL = {
  STANDARD: 'Standard',
  RESIDENT: 'Résident',
  WORKER: 'Travailleur',
  REGISTERED: 'Enregistré',
};

const PAY_LABEL = {
  CARD: 'Carte',
  CASH: 'Espèces',
  OTHER: 'Autre',
};

export default function PosOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [list, s] = await Promise.all([getPosOrders({ limit: 200 }), getPosSettings()]);
        setOrders(list);
        setSettings(s);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openOrder = async (id) => {
    try {
      const order = await getPosOrder(id);
      setSelected(order);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="pos-orders-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <h1>Historique caisse</h1>
        <Link to="/pos" className="pos-btn pos-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '0 1.4rem' }}>
          Retour caisse
        </Link>
      </div>

      {loading ? (
        <div className="pos-spinner" />
      ) : (
        <table className="pos-orders-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Heure</th>
              <th>Total</th>
              <th>Client</th>
              <th>Paiement</th>
              <th>Employé</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} onClick={() => openOrder(o.id)}>
                <td>{o.orderNumber}</td>
                <td>{new Date(o.createdAt).toLocaleString('fr-BE')}</td>
                <td>{formatCents(o.totalCents)}</td>
                <td>{CUSTOMER_LABEL[o.customerType] || o.customerType}</td>
                <td>{PAY_LABEL[o.paymentMethod] || o.paymentMethod || '—'}</td>
                <td>{o.cashierName || '—'}</td>
                <td>{o.status}</td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={7}>Aucune commande caisse</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="pos-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{selected.orderNumber}</h3>
            <p className="lead">
              {CUSTOMER_LABEL[selected.customerType]} · {selected.orderType} · {selected.cashierName}
            </p>
            {selected.items.map((it) => (
              <div key={it.id} className="pos-total-row">
                <span>
                  {it.quantity}× {it.productNameSnapshot}
                </span>
                <span>{formatCents(it.subtotalCents)}</span>
              </div>
            ))}
            <div className="pos-totals" style={{ marginTop: '0.8rem' }}>
              <div className="pos-total-row">
                <span>Sous-total</span>
                <span>{formatCents(selected.subtotalCents)}</span>
              </div>
              {selected.customerDiscountCents > 0 && (
                <div className="pos-total-row discount">
                  <span>Réduction client</span>
                  <span>−{formatCents(selected.customerDiscountCents)}</span>
                </div>
              )}
              {selected.earlyBirdDiscountCents > 0 && (
                <div className="pos-total-row discount">
                  <span>Vroege Vogel</span>
                  <span>−{formatCents(selected.earlyBirdDiscountCents)}</span>
                </div>
              )}
              {selected.lateSurchargeCents > 0 && (
                <div className="pos-total-row surcharge">
                  <span>Majoration</span>
                  <span>+{formatCents(selected.lateSurchargeCents)}</span>
                </div>
              )}
              <div className="pos-total-final">
                <label>Total</label>
                <strong>{formatCents(selected.totalCents)}</strong>
              </div>
            </div>
            {selected.appliedRules?.length > 0 && (
              <p className="lead" style={{ marginTop: '0.8rem', fontSize: '0.85rem' }}>
                Règles : {selected.appliedRules.map((r) => r.type).join(', ')}
              </p>
            )}
            <div className="pos-modal-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="pos-btn pos-btn-secondary" onClick={() => window.print()}>
                Imprimer
              </button>
              <button type="button" className="pos-btn pos-btn-primary" onClick={() => setSelected(null)}>
                Fermer
              </button>
            </div>
            <PosTicket order={selected} settings={settings} />
          </div>
        </div>
      )}
    </div>
  );
}

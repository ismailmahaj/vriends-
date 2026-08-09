import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPosOrder, getPosOrders, getPosSettings } from '../services/posService';
import { formatCents } from '../lib/pricingEngine';
import { useLanguage } from '../context/LanguageContext';
import PosTicket from './PosTicket';
import './pos.css';

const localeMap = { fr: 'fr-BE', nl: 'nl-BE', en: 'en-GB' };

export default function PosOrdersPage() {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const customerLabel = {
    STANDARD: t('posCustomerStandard'),
    RESIDENT: t('posCustomerResident'),
    WORKER: t('posCustomerWorker'),
    REGISTERED: t('posCustomerRegistered'),
  };

  const payLabel = {
    CARD: t('posCard'),
    CASH: t('posCash'),
    OTHER: t('posOther'),
  };

  const orderTypeLabel = {
    DINE_IN: t('posTicketDineIn'),
    TAKEAWAY: t('posTicketTakeaway'),
    DELIVERY: t('posTicketDelivery'),
  };

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

  const locale = localeMap[language] || 'fr-BE';

  return (
    <div className="pos-orders-page">
      <div className="pos-orders-header">
        <h1>{t('posOrdersTitle')}</h1>
        <Link to="/pos" className="pos-btn pos-btn-primary pos-orders-back">
          {t('posBackToPos')}
        </Link>
      </div>

      {loading ? (
        <div className="pos-spinner" />
      ) : (
        <div className="pos-orders-table-wrap">
          <table className="pos-orders-table">
            <thead>
              <tr>
                <th>{t('posColNumber')}</th>
                <th>{t('posColTime')}</th>
                <th>{t('posColTotal')}</th>
                <th>{t('posColCustomer')}</th>
                <th>{t('posColPayment')}</th>
                <th>{t('posColCashier')}</th>
                <th>{t('posColStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} onClick={() => openOrder(o.id)}>
                  <td>{o.orderNumber}</td>
                  <td>{new Date(o.createdAt).toLocaleString(locale)}</td>
                  <td>{formatCents(o.totalCents)}</td>
                  <td>{customerLabel[o.customerType] || o.customerType}</td>
                  <td>{payLabel[o.paymentMethod] || o.paymentMethod || '—'}</td>
                  <td>{o.cashierName || '—'}</td>
                  <td>{o.status}</td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan={7}>{t('posNoOrders')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="pos-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{selected.orderNumber}</h3>
            <p className="lead">
              {customerLabel[selected.customerType]} · {orderTypeLabel[selected.orderType] || selected.orderType} ·{' '}
              {selected.cashierName}
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
                <span>{t('posSubtotal')}</span>
                <span>{formatCents(selected.subtotalCents)}</span>
              </div>
              {selected.customerDiscountCents > 0 && (
                <div className="pos-total-row discount">
                  <span>{t('posCustomerDiscount')}</span>
                  <span>−{formatCents(selected.customerDiscountCents)}</span>
                </div>
              )}
              {selected.earlyBirdDiscountCents > 0 && (
                <div className="pos-total-row discount">
                  <span>{t('posEarlyBird')}</span>
                  <span>−{formatCents(selected.earlyBirdDiscountCents)}</span>
                </div>
              )}
              {selected.lateSurchargeCents > 0 && (
                <div className="pos-total-row surcharge">
                  <span>{t('posSurcharge')}</span>
                  <span>+{formatCents(selected.lateSurchargeCents)}</span>
                </div>
              )}
              <div className="pos-total-final">
                <label>{t('posTotal')}</label>
                <strong>{formatCents(selected.totalCents)}</strong>
              </div>
            </div>
            {selected.appliedRules?.length > 0 && (
              <p className="lead" style={{ marginTop: '0.8rem', fontSize: '0.85rem' }}>
                {t('posRules')} : {selected.appliedRules.map((r) => r.type).join(', ')}
              </p>
            )}
            <div className="pos-modal-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="pos-btn pos-btn-secondary" onClick={() => window.print()}>
                {t('posPrint')}
              </button>
              <button type="button" className="pos-btn pos-btn-primary" onClick={() => setSelected(null)}>
                {t('posClose')}
              </button>
            </div>
            <PosTicket order={selected} settings={settings} />
          </div>
        </div>
      )}
    </div>
  );
}

import { formatCents } from '../lib/pricingEngine';

const ORDER_TYPE_LABEL = {
  DINE_IN: 'Sur place',
  TAKEAWAY: 'À emporter',
  DELIVERY: 'Livraison',
};

const PAY_LABEL = {
  CARD: 'Carte',
  CASH: 'Espèces',
  OTHER: 'Autre',
};

const PosTicket = ({ order, settings }) => {
  if (!order) return null;

  const shopName = settings?.shopName || 'VRIENDS';
  const shopAddress = settings?.shopAddress || 'Poperinge, Belgique';
  const date = order.paidAt || order.createdAt;

  return (
    <div className="pos-ticket" id="pos-ticket-print">
      <div className="center bold">{shopName}</div>
      <div className="center">{shopAddress}</div>
      <div className="line" />
      <div>Date : {date ? new Date(date).toLocaleString('fr-BE') : ''}</div>
      <div>Commande : {order.orderNumber}</div>
      <div>Employé : {order.cashierName || '—'}</div>
      <div>Client : {order.customerType}</div>
      <div>Type : {ORDER_TYPE_LABEL[order.orderType] || order.orderType}</div>
      <div className="line" />
      {order.items?.map((item) => (
        <div key={item.id || `${item.productId}-${item.productNameSnapshot}`}>
          <div className="row">
            <span>
              {item.quantity}× {item.productNameSnapshot}
            </span>
            <span>{formatCents(item.subtotalCents)}</span>
          </div>
          {item.options ? (
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              {typeof item.options === 'string' ? item.options : JSON.stringify(item.options)}
            </div>
          ) : null}
        </div>
      ))}
      <div className="line" />
      <div className="row">
        <span>Sous-total</span>
        <span>{formatCents(order.subtotalCents)}</span>
      </div>
      {order.customerDiscountCents > 0 && (
        <div className="row">
          <span>Réduction client</span>
          <span>-{formatCents(order.customerDiscountCents)}</span>
        </div>
      )}
      {order.earlyBirdDiscountCents > 0 && (
        <div className="row">
          <span>Vroege Vogel</span>
          <span>-{formatCents(order.earlyBirdDiscountCents)}</span>
        </div>
      )}
      {order.lateSurchargeCents > 0 && (
        <div className="row">
          <span>Majoration</span>
          <span>+{formatCents(order.lateSurchargeCents)}</span>
        </div>
      )}
      <div className="line" />
      <div className="row bold">
        <span>TOTAL</span>
        <span>{formatCents(order.totalCents)}</span>
      </div>
      <div>Paiement : {PAY_LABEL[order.paymentMethod] || order.paymentMethod || '—'}</div>
      {order.paymentMethod === 'CASH' && order.cashReceivedCents != null && (
        <>
          <div className="row">
            <span>Reçu</span>
            <span>{formatCents(order.cashReceivedCents)}</span>
          </div>
          <div className="row">
            <span>Rendu</span>
            <span>{formatCents(order.cashChangeCents || 0)}</span>
          </div>
        </>
      )}
      <div className="line" />
      <div className="center">Merci et à bientôt !</div>
    </div>
  );
};

export default PosTicket;

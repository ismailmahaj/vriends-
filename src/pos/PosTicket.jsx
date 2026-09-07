import { formatCents } from '../lib/pricingEngine';
import { useLanguage } from '../context/LanguageContext';

const localeMap = { fr: 'fr-BE', nl: 'nl-BE', en: 'en-GB' };

const PosTicket = ({ order, settings }) => {
  const { t, language } = useLanguage();

  if (!order) return null;

  const shopName = settings?.shopName || 'VRIENDS';
  const shopAddress = settings?.shopAddress || 'Poperinge, Belgique';
  const date = order.paidAt || order.createdAt;
  const locale = localeMap[language] || 'fr-BE';

  const orderTypeLabel = {
    DINE_IN: t('posTicketDineIn'),
    TAKEAWAY: t('posTicketTakeaway'),
    DELIVERY: t('posTicketDelivery'),
  };

  const payLabel = {
    CARD: t('posCard'),
    CASH: t('posCash'),
    OTHER: t('posOther'),
  };

  const customerLabel = {
    STANDARD: t('posCustomerStandard'),
    RESIDENT: t('posCustomerResident'),
    WORKER: t('posCustomerWorker'),
    REGISTERED: t('posCustomerRegistered'),
  };

  return (
    <div className="pos-ticket" id="pos-ticket-print">
      <div className="center bold">{shopName}</div>
      <div className="center">{shopAddress}</div>
      <div className="line" />
      <div>
        {t('posTicketDate')} : {date ? new Date(date).toLocaleString(locale) : ''}
      </div>
      <div>
        {t('posTicketOrder')} : {order.orderNumber}
      </div>
      <div>
        {t('posTicketCashier')} : {order.cashierName || '—'}
      </div>
      <div>
        {t('posTicketCustomer')} : {customerLabel[order.customerType] || order.customerType}
      </div>
      <div>
        {t('posTicketType')} : {orderTypeLabel[order.orderType] || order.orderType}
      </div>
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
              {typeof item.options === 'string'
                ? item.options
                : Array.isArray(item.options)
                  ? item.options.map((o) => o.label || o.name).filter(Boolean).join(', ')
                  : JSON.stringify(item.options)}
            </div>
          ) : null}
          {item.lineNote ? (
            <div style={{ fontSize: 11, fontStyle: 'italic', opacity: 0.85 }}>
              → {item.lineNote}
            </div>
          ) : null}
        </div>
      ))}
      {order.notes ? (
        <>
          <div className="line" />
          <div style={{ fontSize: 11 }}>{order.notes}</div>
        </>
      ) : null}
      {order.addressSnapshot || order.customerName ? (
        <>
          <div className="line" />
          {order.customerName ? <div>{order.customerName}</div> : null}
          {order.customerPhone ? <div>{order.customerPhone}</div> : null}
          {order.addressSnapshot ? (
            <div style={{ fontSize: 11 }}>
              {[
                order.addressSnapshot.street,
                order.addressSnapshot.houseNumber,
                order.addressSnapshot.box ? `bte ${order.addressSnapshot.box}` : null,
                order.addressSnapshot.postalCode,
                order.addressSnapshot.city,
              ]
                .filter(Boolean)
                .join(' ')}
            </div>
          ) : null}
        </>
      ) : null}
      <div className="line" />
      <div className="row">
        <span>{t('posSubtotal')}</span>
        <span>{formatCents(order.subtotalCents)}</span>
      </div>
      {order.customerDiscountCents > 0 && (
        <div className="row">
          <span>{t('posCustomerDiscount')}</span>
          <span>-{formatCents(order.customerDiscountCents)}</span>
        </div>
      )}
      {order.earlyBirdDiscountCents > 0 && (
        <div className="row">
          <span>{t('posEarlyBird')}</span>
          <span>-{formatCents(order.earlyBirdDiscountCents)}</span>
        </div>
      )}
      {order.lateSurchargeCents > 0 && (
        <div className="row">
          <span>{t('posSurcharge')}</span>
          <span>+{formatCents(order.lateSurchargeCents)}</span>
        </div>
      )}
      <div className="line" />
      <div className="row bold">
        <span>{t('posTotal')}</span>
        <span>{formatCents(order.totalCents)}</span>
      </div>
      <div>
        {t('posTicketPayment')} : {payLabel[order.paymentMethod] || order.paymentMethod || '—'}
      </div>
      {order.paymentMethod === 'CASH' && order.cashReceivedCents != null && (
        <>
          <div className="row">
            <span>{t('posTicketReceived')}</span>
            <span>{formatCents(order.cashReceivedCents)}</span>
          </div>
          <div className="row">
            <span>{t('posTicketChange')}</span>
            <span>{formatCents(order.cashChangeCents || 0)}</span>
          </div>
        </>
      )}
      <div className="line" />
      <div className="center">{t('posTicketThanks')}</div>
    </div>
  );
};

export default PosTicket;

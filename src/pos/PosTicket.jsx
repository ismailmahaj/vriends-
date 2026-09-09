import { formatCents } from '../lib/pricingEngine';
import { useLanguage } from '../context/LanguageContext';

const localeMap = { fr: 'fr-BE', nl: 'nl-BE', en: 'en-GB' };

/** Largeur utile ~32 caractères sur papier 58 mm (police mono). */
const COLS_58 = 32;
const COLS_80 = 42;

function money(cents, locale) {
  return formatCents(cents ?? 0, locale);
}

function padRow(left, right, cols) {
  const l = String(left ?? '');
  const r = String(right ?? '');
  const maxLeft = Math.max(1, cols - r.length - 1);
  const clipped = l.length > maxLeft ? `${l.slice(0, Math.max(0, maxLeft - 1))}…` : l;
  const spaces = Math.max(1, cols - clipped.length - r.length);
  return `${clipped}${' '.repeat(spaces)}${r}`;
}

function dashLine(cols) {
  return '-'.repeat(cols);
}

function center(text, cols) {
  const s = String(text ?? '');
  if (s.length >= cols) return s.slice(0, cols);
  const pad = Math.floor((cols - s.length) / 2);
  return `${' '.repeat(pad)}${s}`;
}

function formatOptions(options) {
  if (!options) return '';
  if (typeof options === 'string') return options;
  if (Array.isArray(options)) {
    return options
      .map((o) => o.label || o.name)
      .filter(Boolean)
      .join(' + ');
  }
  if (typeof options === 'object') {
    return Object.values(options)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .filter(Boolean)
      .join(' + ');
  }
  return '';
}

/**
 * Ticket thermique style caisse classique (réf. POS-58) :
 * nom centré, lignes qty x produit + options, montants alignés à droite.
 */
const PosTicket = ({ order, settings }) => {
  const { t, language } = useLanguage();

  if (!order) return null;

  const shopName = settings?.shopName || 'VRIENDS';
  const shopAddress = settings?.shopAddress || 'Poperinge, Belgique';
  const date = order.paidAt || order.createdAt;
  const locale = localeMap[language] || 'fr-BE';
  const widthMm = Number(settings?.ticketWidthMm || 58) === 80 ? 80 : 58;
  const cols = widthMm === 80 ? COLS_80 : COLS_58;

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

  const customerTypeLabel = {
    STANDARD: t('posCustomerStandard'),
    RESIDENT: t('posCustomerResident'),
    WORKER: t('posCustomerWorker'),
    REGISTERED: t('posCustomerRegistered'),
  };

  const clientName =
    order.customer?.name ||
    order.customerName ||
    order.addressSnapshot?.name ||
    null;
  const clientLine =
    clientName ||
    customerTypeLabel[order.customerType] ||
    order.customerType ||
    '-';

  const dateStr = date
    ? new Date(date).toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '';

  return (
    <div
      className={`pos-ticket pos-ticket-${widthMm}`}
      id="pos-ticket-print"
      data-cols={cols}
    >
      <pre className="pos-ticket-pre">
        {`${center(shopName, cols)}\n`}
        {`${center(shopAddress, cols)}\n`}
        {`${dashLine(cols)}\n`}
        {`${t('posTicketDate')}: ${dateStr}\n`}
        {`${t('posTicketOrder')}: ${order.orderNumber}\n`}
        {`${t('posTicketCashier')}: ${order.cashierName || '-'}\n`}
        {`${t('posTicketCustomer')}: ${clientLine}\n`}
        {`${t('posTicketType')}: ${orderTypeLabel[order.orderType] || order.orderType}\n`}
        {`${dashLine(cols)}\n`}
        {(order.items || [])
          .map((item) => {
            const opts = formatOptions(item.options);
            const title = opts
              ? `${item.quantity} x ${item.productNameSnapshot} + ${opts}`
              : `${item.quantity} x ${item.productNameSnapshot}`;
            let block = `${padRow(title, money(item.subtotalCents, locale), cols)}\n`;
            if (item.lineNote) {
              block += `${padRow(`  > ${item.lineNote}`, '', cols)}\n`;
            }
            return block;
          })
          .join('')}
        {order.notes ? `${dashLine(cols)}\n${order.notes}\n` : ''}
        {(order.addressSnapshot || order.customerPhone) &&
          `${dashLine(cols)}\n${[
            order.customerPhone || null,
            [
              order.addressSnapshot?.street,
              order.addressSnapshot?.houseNumber,
              order.addressSnapshot?.box ? `bte ${order.addressSnapshot.box}` : null,
              order.addressSnapshot?.postalCode,
              order.addressSnapshot?.city,
            ]
              .filter(Boolean)
              .join(' '),
          ]
            .filter(Boolean)
            .join('\n')}\n`}
        {`${dashLine(cols)}\n`}
        {`${padRow(t('posSubtotal'), money(order.subtotalCents, locale), cols)}\n`}
        {order.customerDiscountCents > 0
          ? `${padRow(t('posCustomerDiscount'), `-${money(order.customerDiscountCents, locale)}`, cols)}\n`
          : ''}
        {order.earlyBirdDiscountCents > 0
          ? `${padRow(t('posEarlyBird'), `-${money(order.earlyBirdDiscountCents, locale)}`, cols)}\n`
          : ''}
        {order.lateSurchargeCents > 0
          ? `${padRow(t('posSurcharge'), `+${money(order.lateSurchargeCents, locale)}`, cols)}\n`
          : ''}
        {`${padRow(t('posTotal'), money(order.totalCents, locale), cols)}\n`}
        {order.paymentMethod === 'CASH' && order.cashReceivedCents != null
          ? `${padRow(t('posCash'), money(order.cashReceivedCents, locale), cols)}\n${padRow(
              t('posTicketChange'),
              money(order.cashChangeCents || 0, locale),
              cols
            )}\n`
          : `${padRow(t('posTicketPayment'), payLabel[order.paymentMethod] || order.paymentMethod || '-', cols)}\n`}
        {`${dashLine(cols)}\n`}
        {`${center(t('posTicketThanks'), cols)}\n`}
      </pre>
    </div>
  );
};

export default PosTicket;

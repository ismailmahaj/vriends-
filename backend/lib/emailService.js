/**
 * Service e-mail — utilise SMTP (NODEMAILER) si configuré.
 * Les échecs d'envoi sont loggés et n'interrompent jamais la commande.
 */
const prisma = require('../db/prisma');
const { getSettingsMap, isTruthy, formatAddress } = require('./shopSettings');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch {
  nodemailer = null;
}

function shopFromEnv() {
  return {
    name: process.env.SHOP_NAME || 'Vriends Poperinge',
    email: process.env.SHOP_EMAIL || 'info@vriendspoperinge.be',
    phone: process.env.SHOP_PHONE || '',
    address: process.env.SHOP_ADDRESS || 'Poperinge, Belgique',
  };
}

function createTransport() {
  if (!nodemailer) return null;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
  });
}

async function logEmail({ to, subject, template, orderId, status, error, payload }) {
  try {
    await prisma.emailLog.create({
      data: {
        toEmail: to,
        subject,
        template: template || null,
        orderId: orderId || null,
        status,
        error: error ? String(error).slice(0, 1000) : null,
        payload: payload || null,
      },
    });
  } catch (e) {
    console.error('email log failed', e.message);
  }
}

function renderOrderLines(items = []) {
  return items
    .map((it) => {
      const opts = Array.isArray(it.options)
        ? it.options.map((o) => o.label).join(', ')
        : '';
      const note = it.line_note || it.lineNote || '';
      return `• ${it.product_name || it.productNameSnapshot} x${it.quantity} — ${Number(it.price || 0).toFixed(2)}€${
        opts ? `\n  Options: ${opts}` : ''
      }${note ? `\n  Note: ${note}` : ''}`;
    })
    .join('\n');
}

function buildOrderEmailBodies({ order, shop, statusLabel }) {
  const user = order.user || {};
  const address = formatAddress(order.addressSnapshot || order.address_snapshot);
  const lines = renderOrderLines(order.items || []);
  const subject = `[Vriends] Commande #${order.id} — ${statusLabel}`;
  const text = [
    `${shop.name}`,
    `Commande #${order.id}`,
    `Statut: ${statusLabel}`,
    `Client: ${user.name || ''} <${user.email || ''}>`,
    user.phone ? `Tél: ${user.phone}` : '',
    `Retrait: ${order.pickupTime || order.pickup_time || '—'}`,
    order.orderType || order.order_type ? `Type: ${order.orderType || order.order_type}` : '',
    address ? `Adresse: ${address}` : '',
    '',
    'Articles:',
    lines,
    '',
    order.notes ? `Commentaire: ${order.notes}` : '',
    `Total: ${Number(order.totalPrice || order.total_price || 0).toFixed(2)}€`,
    '',
    `Contact commerce: ${shop.email}${shop.phone ? ` · ${shop.phone}` : ''}`,
    shop.address,
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, text };
}

async function sendMail({ to, subject, text, template, orderId, payload }) {
  const transport = createTransport();
  if (!transport) {
    await logEmail({
      to,
      subject,
      template,
      orderId,
      status: 'skipped',
      error: nodemailer ? 'SMTP non configuré' : 'nodemailer non installé',
      payload,
    });
    return { ok: false, skipped: true };
  }
  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SHOP_EMAIL || 'noreply@vriendspoperinge.be',
      to,
      subject,
      text,
    });
    await logEmail({ to, subject, template, orderId, status: 'sent', payload });
    return { ok: true };
  } catch (error) {
    console.error('sendMail error', error);
    await logEmail({
      to,
      subject,
      template,
      orderId,
      status: 'error',
      error: error.message,
      payload,
    });
    return { ok: false, error: error.message };
  }
}

async function notifyNewOrder(order) {
  try {
    const settings = await getSettingsMap();
    const shop = shopFromEnv();
    if (!isTruthy(settings.email_notify_new_order)) return;
    const { subject, text } = buildOrderEmailBodies({
      order,
      shop,
      statusLabel: 'Nouvelle commande',
    });
    const to = settings.email_notify_to || shop.email;
    await sendMail({
      to,
      subject,
      text,
      template: 'new_order_shop',
      orderId: order.id,
      payload: { orderId: order.id },
    });
  } catch (e) {
    console.error('notifyNewOrder', e);
  }
}

async function notifyCustomerStatus(order, status) {
  try {
    const settings = await getSettingsMap();
    const key = `email_notify_status_${status}`;
    // completed/delivered share completed flag
    const enabledKey =
      status === 'delivered' ? 'email_notify_status_completed' : key;
    if (settings[enabledKey] != null && !isTruthy(settings[enabledKey])) return;
    if (settings[enabledKey] == null && !['confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'delivered'].includes(status)) {
      return;
    }
    const email = order.user?.email;
    if (!email) return;
    const shop = shopFromEnv();
    const labels = {
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      ready: 'Prête',
      completed: 'Terminée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    const { subject, text } = buildOrderEmailBodies({
      order,
      shop,
      statusLabel: labels[status] || status,
    });
    await sendMail({
      to: email,
      subject,
      text,
      template: `status_${status}`,
      orderId: order.id,
      payload: { status },
    });
  } catch (e) {
    console.error('notifyCustomerStatus', e);
  }
}

async function sendTestEmail(to) {
  const shop = shopFromEnv();
  return sendMail({
    to: to || shop.email,
    subject: `[Vriends] Test e-mail — ${shop.name}`,
    text: `Ceci est un e-mail de test.\n\n${shop.name}\n${shop.email}\n${shop.address}`,
    template: 'test',
  });
}

module.exports = {
  sendMail,
  notifyNewOrder,
  notifyCustomerStatus,
  sendTestEmail,
  createTransport,
};

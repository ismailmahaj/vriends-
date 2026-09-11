/**
 * Impression ticket POS — copies via duplication DOM (1 seule boîte de dialogue navigateur).
 * Limitation : pas d'impression silencieuse ; le navigateur affiche toujours le dialogue.
 */
export function clampPrintCopies(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(5, Math.max(1, Math.round(n)));
}

/**
 * Appelle window.print() après avoir appliqué largeur + copies sur le conteneur ticket.
 * Les copies sont rendues en empilant N fois le HTML du ticket dans #pos-ticket-print-stack.
 */
export function printPosTicket({
  ticketElementId = 'pos-ticket-print',
  copies = 1,
  widthMm = 58,
  printFn = typeof window !== 'undefined' ? window.print.bind(window) : null,
} = {}) {
  const ticket = typeof document !== 'undefined' ? document.getElementById(ticketElementId) : null;
  if (!ticket || !printFn) {
    printFn?.();
    return { ok: false, copies: 1, mode: 'fallback' };
  }

  const n = clampPrintCopies(copies);
  const width = widthMm === 58 || widthMm === '58' || Number(widthMm) === 58 ? 58 : 80;

  document.body.classList.remove('ticket-width-58', 'ticket-width-80', 'pos-printing-stack');
  document.body.classList.add(`ticket-width-${width}`, 'pos-printing-stack');

  let stack = document.getElementById('pos-ticket-print-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'pos-ticket-print-stack';
    stack.className = 'pos-ticket-print-stack';
    document.body.appendChild(stack);
  }

  const html = ticket.outerHTML;
  stack.innerHTML = Array.from({ length: n }, () => html).join(
    '<div class="pos-ticket-page-break"></div>'
  );

  const cleanup = () => {
    if (stack) stack.innerHTML = '';
    document.body.classList.remove('pos-printing-stack', 'ticket-width-58', 'ticket-width-80');
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  printFn();

  // Filet de sécurité si afterprint n'est pas supporté / tardif
  setTimeout(cleanup, 8000);

  return { ok: true, copies: n, widthMm: width, mode: 'dom-duplicate' };
}

/**
 * Abstraction paiement POS — prêt pour Bancontact / Stripe Terminal / Mollie / SumUp.
 * Aujourd'hui : confirmation manuelle (carte) ou espèces.
 */

'use strict';

const PROVIDERS = {
  MANUAL_CARD: 'MANUAL_CARD',
  CASH: 'CASH',
  OTHER: 'OTHER',
};

/**
 * @param {{ method: 'CARD'|'CASH'|'OTHER', amountCents: number, cashReceivedCents?: number }} payload
 */
async function processPayment(payload) {
  const { method, amountCents, cashReceivedCents = 0 } = payload;

  if (!['CARD', 'CASH', 'OTHER'].includes(method)) {
    return { success: false, error: 'Moyen de paiement invalide', provider: null };
  }

  if (method === 'CASH') {
    const received = Math.round(Number(cashReceivedCents) || 0);
    if (received < amountCents) {
      return {
        success: false,
        error: 'Montant reçu insuffisant',
        provider: PROVIDERS.CASH,
      };
    }
    return {
      success: true,
      provider: PROVIDERS.CASH,
      externalRef: null,
      cashReceivedCents: received,
      cashChangeCents: received - amountCents,
      message: 'Paiement espèces validé',
    };
  }

  if (method === 'CARD') {
    // Point d'extension : appeler ici le SDK terminal (SumUp, Stripe Terminal, etc.)
    return {
      success: true,
      provider: PROVIDERS.MANUAL_CARD,
      externalRef: null,
      cashReceivedCents: null,
      cashChangeCents: null,
      message: 'Paiement carte validé',
    };
  }

  return {
    success: true,
    provider: PROVIDERS.OTHER,
    externalRef: null,
    cashReceivedCents: null,
    cashChangeCents: null,
    message: 'Paiement autre validé',
  };
}

module.exports = { processPayment, PROVIDERS };

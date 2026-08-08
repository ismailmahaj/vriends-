import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PosProvider, usePos } from './PosContext';
import {
  getPosProducts,
  getPosCategories,
  getPosSettings,
  getPosOrders,
  createPosOrder,
  togglePosFavorite,
  getPosStats,
  cancelPosOrder,
} from '../services/posService';
import {
  formatCents,
  calculateCashChange,
  CUSTOMER_TYPES,
} from '../lib/pricingEngine';
import { useAuth } from '../context/AuthContext';
import PosTicket from './PosTicket';
import './pos.css';

const CATEGORY_EMOJI = {
  Wraps: '🌯',
  Boissons: '☕',
  Desserts: '🍰',
  Jus: '🧃',
  Autres: '✨',
};

function productEmoji(product) {
  return CATEGORY_EMOJI[product.category] || '✨';
}

function makeIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function PosShell() {
  const { state, dispatch, pricing, clearDraftStorage } = usePos();
  const { user, canManagePos } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const payingLock = useRef(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heldOrders, setHeldOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [flashId, setFlashId] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payMethod, setPayMethod] = useState('CARD');
  const [cashReceived, setCashReceived] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [optionsProduct, setOptionsProduct] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats, settings, held] = await Promise.all([
        getPosProducts(),
        getPosCategories(),
        getPosSettings(),
        getPosOrders({ status: 'held', limit: 20 }),
      ]);
      setProducts(prods);
      setCategories(cats.categories || []);
      dispatch({ type: 'SET_SETTINGS', payload: settings });
      setHeldOrders(held);
    } catch (err) {
      console.error(err);
      showToast('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredProducts = useMemo(() => {
    const q = state.search.trim().toLowerCase();
    return products.filter((p) => {
      if (state.category === 'FAVORITES' && !p.isFavorite) return false;
      if (state.category !== 'ALL' && state.category !== 'FAVORITES' && p.category !== state.category) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      );
    });
  }, [products, state.category, state.search]);

  const earlyBirdActive = pricing.earlyBirdDiscountCents > 0;
  const lateActive = pricing.lateSurchargeCents > 0;

  const addProduct = (product) => {
    if (!product.available) return;
    if (product.optionsSchema?.length) {
      setOptionsProduct(product);
      return;
    }
    dispatch({ type: 'ADD_ITEM', payload: { product } });
    setFlashId(product.id);
    setTimeout(() => setFlashId(null), 350);
  };

  const confirmOptions = (options) => {
    if (!optionsProduct) return;
    dispatch({ type: 'ADD_ITEM', payload: { product: optionsProduct, options } });
    setFlashId(optionsProduct.id);
    setTimeout(() => setFlashId(null), 350);
    setOptionsProduct(null);
  };

  const openPayment = () => {
    if (!state.items.length) return;
    setPayMethod('CARD');
    setCashReceived('');
    setPaymentOpen(true);
  };

  const handlePay = async () => {
    if (payingLock.current || busy) return;
    if (!state.items.length) return;

    if (payMethod === 'CASH') {
      const receivedCents = Math.round(parseFloat(String(cashReceived).replace(',', '.')) * 100) || 0;
      const change = calculateCashChange(pricing.finalTotalCents, receivedCents);
      if (!change.isSufficient) {
        showToast('Montant reçu insuffisant');
        return;
      }
    }

    payingLock.current = true;
    setBusy(true);
    const idempotencyKey = makeIdempotencyKey();

    try {
      const receivedCents =
        payMethod === 'CASH'
          ? Math.round(parseFloat(String(cashReceived).replace(',', '.')) * 100) || 0
          : undefined;

      const result = await createPosOrder({
        items: state.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          options: i.options,
        })),
        customerType: state.customerType,
        orderType: state.orderType,
        paymentMethod: payMethod,
        cashReceivedCents: receivedCents,
        idempotencyKey,
      });

      setPaymentOpen(false);
      setSuccessOrder(result.order);
      dispatch({ type: 'CLEAR' });
      clearDraftStorage();
      showToast(result.paymentMessage || 'Paiement accepté');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Erreur paiement');
    } finally {
      setBusy(false);
      setTimeout(() => {
        payingLock.current = false;
      }, 800);
    }
  };

  const handleHold = async () => {
    if (!state.items.length || busy) return;
    setBusy(true);
    try {
      await createPosOrder({
        items: state.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          options: i.options,
        })),
        customerType: state.customerType,
        orderType: state.orderType,
        hold: true,
        idempotencyKey: makeIdempotencyKey(),
      });
      dispatch({ type: 'CLEAR' });
      clearDraftStorage();
      const held = await getPosOrders({ status: 'held', limit: 20 });
      setHeldOrders(held);
      showToast('Commande mise en attente');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const resumeHeld = (order) => {
    if (state.items.length) {
      const ok = window.confirm('Remplacer le panier actuel par la commande en attente ?');
      if (!ok) return;
    }
    dispatch({
      type: 'LOAD_HELD',
      payload: {
        customerType: order.customerType,
        orderType: order.orderType,
        items: order.items.map((it) => ({
          key: `${it.productId}::${JSON.stringify(it.options || null)}`,
          productId: it.productId,
          name: it.productNameSnapshot,
          unitPriceCents: it.unitPriceCents,
          quantity: it.quantity,
          options: it.options,
          available: true,
        })),
      },
    });
    // Annuler l'ancienne held côté serveur pour éviter doublon à la revalidation
    cancelPosOrder(order.id).catch(() => {});
    setHeldOrders((prev) => prev.filter((h) => h.id !== order.id));
    showToast(`Reprise ${order.orderNumber}`);
  };

  const cancelCurrent = () => {
    if (!state.items.length) return;
    const ok = window.confirm('Annuler la commande en cours ?');
    if (!ok) return;
    dispatch({ type: 'CLEAR' });
    clearDraftStorage();
  };

  const openStats = async () => {
    try {
      const data = await getPosStats();
      setStats(data);
      setStatsOpen(true);
    } catch {
      showToast('Stats réservées aux managers');
    }
  };

  const printTicket = () => {
    window.print();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'F4') {
        e.preventDefault();
        if (!paymentOpen && !successOrder) openPayment();
      }
      if (e.key === 'Escape') {
        setPaymentOpen(false);
        setStatsOpen(false);
        setOptionsProduct(null);
      }
      if (e.key === 'Delete' && state.selectedLineKey) {
        dispatch({ type: 'REMOVE_LINE', payload: state.selectedLineKey });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const cashChange = useMemo(() => {
    const receivedCents = Math.round(parseFloat(String(cashReceived).replace(',', '.')) * 100) || 0;
    return calculateCashChange(pricing.finalTotalCents, receivedCents);
  }, [cashReceived, pricing.finalTotalCents]);

  const clockLabel = state.clock.toLocaleTimeString('fr-BE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="pos-root">
      {(loading || busy) && (
        <div className="pos-loading">
          <div className="pos-spinner" />
        </div>
      )}

      {/* GAUCHE */}
      <aside className="pos-col pos-left">
        <div className="pos-brand">
          Vriends <span>Caisse</span>
        </div>
        <div className="pos-clock">
          {clockLabel} · {user?.name || 'Employé'}
        </div>
        <input
          ref={searchRef}
          className="pos-search"
          placeholder="Rechercher (F2)"
          value={state.search}
          onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
        />
        <div className="pos-cat-list">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`pos-cat-btn ${state.category === cat.key ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_CATEGORY', payload: cat.key })}
            >
              {cat.key === 'FAVORITES' ? '⭐ ' : ''}
              {cat.label}
            </button>
          ))}
        </div>
        <div className="pos-left-actions">
          <Link to="/pos/orders" className="pos-ghost-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Historique
          </Link>
          {canManagePos && (
            <button type="button" className="pos-ghost-btn" onClick={openStats}>
              Statistiques
            </button>
          )}
          <button type="button" className="pos-ghost-btn" onClick={() => navigate('/')}>
            Quitter
          </button>
        </div>
      </aside>

      {/* CENTRE */}
      <main className="pos-col pos-center">
        <div className="pos-center-top">
          {[
            { key: CUSTOMER_TYPES.STANDARD, label: 'Standard' },
            { key: CUSTOMER_TYPES.RESIDENT, label: 'Résident' },
            { key: CUSTOMER_TYPES.WORKER, label: 'Travailleur' },
          ].map((c) => (
            <button
              key={c.key}
              type="button"
              className={`pos-pill ${state.customerType === c.key ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_CUSTOMER', payload: c.key })}
            >
              {c.label}
            </button>
          ))}
          <button
            type="button"
            className={`pos-pill ${state.orderType === 'DINE_IN' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ORDER_TYPE', payload: 'DINE_IN' })}
          >
            Sur place
          </button>
          <button
            type="button"
            className={`pos-pill ${state.orderType === 'TAKEAWAY' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ORDER_TYPE', payload: 'TAKEAWAY' })}
          >
            À emporter
          </button>
          {earlyBirdActive && <div className="pos-rule-badge">🐦 Vroege Vogel -{pricing.earlyBirdDiscountPercent} %</div>}
          {lateActive && (
            <div className="pos-rule-badge late">
              Majoration après 11h : +{pricing.lateSurchargePercent} %
            </div>
          )}
        </div>

        <div className="pos-grid">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              role="button"
              tabIndex={product.available ? 0 : -1}
              className={`pos-product ${flashId === product.id ? 'flash' : ''} ${!product.available ? 'disabled' : ''}`}
              onClick={() => addProduct(product)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  addProduct(product);
                }
              }}
              style={!product.available ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
            >
              <button
                type="button"
                className="pos-fav-star"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const updated = await togglePosFavorite(product.id);
                    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                  } catch {
                    showToast('Erreur favori');
                  }
                }}
                aria-label="Favori"
              >
                {product.isFavorite ? '★' : '☆'}
              </button>
              {!product.available && <span className="pos-soldout">ÉPUISÉ</span>}
              <div className="pos-product-emoji">{productEmoji(product)}</div>
              <div className="pos-product-name">{product.name}</div>
              <div className="pos-product-meta">{product.category}</div>
              <div className="pos-product-price">{formatCents(product.priceCents)}</div>
            </div>
          ))}
          {!filteredProducts.length && !loading && (
            <div className="pos-cart-empty">Aucun produit trouvé</div>
          )}
        </div>
      </main>

      {/* DROITE */}
      <aside className="pos-col pos-right">
        <div className="pos-right-header">
          <h2>Panier</h2>
          <span>{state.customerType}</span>
        </div>

        {heldOrders.length > 0 && (
          <div className="pos-held">
            {heldOrders.map((h) => (
              <button key={h.id} type="button" className="pos-held-item" onClick={() => resumeHeld(h)}>
                ⏸ {h.orderNumber} · {formatCents(h.totalCents)} · reprendre
              </button>
            ))}
          </div>
        )}

        <div className="pos-cart-items">
          {!state.items.length && (
            <div className="pos-cart-empty">Ajoutez un produit pour commencer</div>
          )}
          {state.items.map((item) => (
            <div
              key={item.key}
              className={`pos-cart-line ${state.selectedLineKey === item.key ? 'selected' : ''}`}
              onClick={() => dispatch({ type: 'SELECT_LINE', payload: item.key })}
              role="button"
              tabIndex={0}
            >
              <div className="pos-cart-line-name">{item.name}</div>
              <div className="pos-cart-line-price">
                {formatCents(item.unitPriceCents * item.quantity)}
              </div>
              {item.options && (
                <div className="pos-cart-line-opts">
                  {Object.entries(item.options)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ')}
                </div>
              )}
              <div className="pos-qty">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SET_QTY', payload: { key: item.key, quantity: item.quantity - 1 } });
                  }}
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SET_QTY', payload: { key: item.key, quantity: item.quantity + 1 } });
                  }}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="pos-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'REMOVE_LINE', payload: item.key });
                }}
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>

        <div className="pos-totals">
          <div className="pos-total-row">
            <span>Sous-total</span>
            <span>{formatCents(pricing.subtotalCents)}</span>
          </div>
          {pricing.customerDiscountCents > 0 && (
            <div className="pos-total-row discount">
              <span>Réduction client (−{pricing.customerDiscountPercent} %)</span>
              <span>−{formatCents(pricing.customerDiscountCents)}</span>
            </div>
          )}
          {pricing.earlyBirdDiscountCents > 0 && (
            <div className="pos-total-row discount">
              <span>Vroege Vogel (−{pricing.earlyBirdDiscountPercent} %)</span>
              <span>−{formatCents(pricing.earlyBirdDiscountCents)}</span>
            </div>
          )}
          {pricing.lateSurchargeCents > 0 && (
            <div className="pos-total-row surcharge">
              <span>Majoration après 11h (+{pricing.lateSurchargePercent} %)</span>
              <span>+{formatCents(pricing.lateSurchargeCents)}</span>
            </div>
          )}
          <div className="pos-total-final">
            <label>Total à payer</label>
            <strong>{formatCents(pricing.finalTotalCents)}</strong>
          </div>
        </div>

        <div className="pos-actions">
          <button type="button" className="pos-btn pos-btn-secondary" onClick={handleHold} disabled={!state.items.length}>
            En attente
          </button>
          <button type="button" className="pos-btn pos-btn-danger" onClick={cancelCurrent} disabled={!state.items.length}>
            Annuler
          </button>
          <button type="button" className="pos-btn pos-btn-primary" onClick={openPayment} disabled={!state.items.length}>
            Payer (F4)
          </button>
        </div>
      </aside>

      {/* Modal paiement */}
      {paymentOpen && (
        <div className="pos-modal-backdrop" onClick={() => !busy && setPaymentOpen(false)}>
          <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Paiement</h3>
            <p className="lead">Total : {formatCents(pricing.finalTotalCents)}</p>
            <div className="pos-pay-methods">
              {['CARD', 'CASH', 'OTHER'].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={payMethod === m ? 'active' : ''}
                  onClick={() => setPayMethod(m)}
                >
                  {m === 'CARD' ? 'Carte' : m === 'CASH' ? 'Espèces' : 'Autre'}
                </button>
              ))}
            </div>
            {payMethod === 'CASH' && (
              <>
                <label>Montant reçu (€)</label>
                <input
                  className="pos-cash-input"
                  inputMode="decimal"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  autoFocus
                />
                <div className="pos-quick-cash">
                  {[20, 50, 100].map((n) => (
                    <button key={n} type="button" onClick={() => setCashReceived(String(n))}>
                      {n} €
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashReceived((pricing.finalTotalCents / 100).toFixed(2))}
                  >
                    Exact
                  </button>
                </div>
                <div className="pos-change">
                  <span>À rendre</span>
                  <span>{formatCents(cashChange.changeCents)}</span>
                </div>
              </>
            )}
            <div className="pos-modal-actions">
              <button type="button" className="pos-btn pos-btn-secondary" onClick={() => setPaymentOpen(false)}>
                Retour
              </button>
              <button type="button" className="pos-btn pos-btn-primary" onClick={handlePay} disabled={busy}>
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Succès */}
      {successOrder && (
        <div className="pos-modal-backdrop">
          <div className="pos-modal">
            <div className="pos-success">
              <div className="pos-success-icon">✓</div>
              <h3>Paiement accepté</h3>
              <div className="order-no">Commande {successOrder.orderNumber}</div>
              <div className="pos-modal-actions">
                <button
                  type="button"
                  className="pos-btn pos-btn-secondary"
                  onClick={printTicket}
                >
                  Imprimer ticket
                </button>
                <button
                  type="button"
                  className="pos-btn pos-btn-secondary"
                  onClick={printTicket}
                >
                  Réimprimer
                </button>
                <button
                  type="button"
                  className="pos-btn pos-btn-primary"
                  onClick={() => setSuccessOrder(null)}
                >
                  Nouvelle commande
                </button>
              </div>
            </div>
            <PosTicket order={successOrder} settings={state.settings} />
          </div>
        </div>
      )}

      {/* Options produit */}
      {optionsProduct && (
        <OptionsModal
          product={optionsProduct}
          onClose={() => setOptionsProduct(null)}
          onConfirm={confirmOptions}
        />
      )}

      {/* Stats */}
      {statsOpen && stats && (
        <div className="pos-modal-backdrop" onClick={() => setStatsOpen(false)}>
          <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Statistiques du jour</h3>
            <p className="lead">{stats.date}</p>
            <div className="pos-totals" style={{ borderTop: 'none' }}>
              <div className="pos-total-row"><span>CA</span><span>{formatCents(stats.revenueCents)}</span></div>
              <div className="pos-total-row"><span>Commandes</span><span>{stats.ordersCount}</span></div>
              <div className="pos-total-row"><span>Panier moyen</span><span>{formatCents(stats.averageBasketCents)}</span></div>
              <div className="pos-total-row"><span>Carte</span><span>{stats.payments.card.count} · {formatCents(stats.payments.card.amountCents)}</span></div>
              <div className="pos-total-row"><span>Espèces</span><span>{stats.payments.cash.count} · {formatCents(stats.payments.cash.amountCents)}</span></div>
              <div className="pos-total-row discount"><span>Réductions</span><span>{formatCents(stats.discountsCents)}</span></div>
            </div>
            {stats.topProducts?.length > 0 && (
              <>
                <p className="lead" style={{ marginTop: '1rem' }}>Top produits</p>
                {stats.topProducts.map((p) => (
                  <div key={p.name} className="pos-total-row">
                    <span>{p.name}</span>
                    <span>×{p.quantity}</span>
                  </div>
                ))}
              </>
            )}
            <div className="pos-modal-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="pos-btn pos-btn-primary" onClick={() => setStatsOpen(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="pos-toast">{toast}</div>}
    </div>
  );
}

function OptionsModal({ product, onClose, onConfirm }) {
  const schema = product.optionsSchema || [];
  const [values, setValues] = useState(() => {
    const init = {};
    schema.forEach((opt) => {
      init[opt.name] = opt.choices?.[0] || '';
    });
    return init;
  });

  return (
    <div className="pos-modal-backdrop" onClick={onClose}>
      <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{product.name}</h3>
        <p className="lead">Choisissez les options</p>
        {schema.map((opt) => (
          <div key={opt.name} style={{ marginBottom: '0.9rem' }}>
            <div style={{ marginBottom: '0.4rem', fontWeight: 500 }}>{opt.name}</div>
            <div className="pos-quick-cash">
              {(opt.choices || []).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  style={{
                    background: values[opt.name] === choice ? '#3A2E25' : undefined,
                    color: values[opt.name] === choice ? '#F7F5F2' : undefined,
                  }}
                  onClick={() => setValues((v) => ({ ...v, [opt.name]: choice }))}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="pos-modal-actions">
          <button type="button" className="pos-btn pos-btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="pos-btn pos-btn-primary" onClick={() => onConfirm(values)}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PosPage() {
  return (
    <PosProvider>
      <PosShell />
    </PosProvider>
  );
}

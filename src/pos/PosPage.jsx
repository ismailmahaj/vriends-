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
import { useLanguage } from '../context/LanguageContext';
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
  const cats = Array.isArray(product.categories) && product.categories.length
    ? product.categories
    : [product.category];
  for (const c of cats) {
    if (CATEGORY_EMOJI[c]) return CATEGORY_EMOJI[c];
  }
  return '✨';
}

function makeIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function PosShell() {
  const { state, dispatch, pricing, clearDraftStorage } = usePos();
  const { user, canManagePos } = useAuth();
  const { t, language } = useLanguage();
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
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats?.categories) ? cats.categories : []);
      dispatch({ type: 'SET_SETTINGS', payload: settings });
      setHeldOrders(Array.isArray(held) ? held : []);
    } catch (err) {
      console.error(err);
      showToast(t('posLoadError'));
    } finally {
      setLoading(false);
    }
  }, [dispatch, t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredProducts = useMemo(() => {
    const q = state.search.trim().toLowerCase();
    const list = Array.isArray(products) ? products : [];
    return list.filter((p) => {
      const cats = Array.isArray(p.categories) && p.categories.length
        ? p.categories
        : [p.category || 'Autres'];
      if (state.category === 'FAVORITES' && !p.isFavorite) return false;
      if (state.category !== 'ALL' && state.category !== 'FAVORITES' && !cats.includes(state.category)) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        cats.some((c) => String(c).toLowerCase().includes(q)) ||
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
        showToast(t('posInsufficientCash'));
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
      showToast(result.paymentMessage || t('posPaymentAccepted'));
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || t('posPaymentError'));
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
      showToast(t('posOrderHeld'));
    } catch (err) {
      showToast(err.response?.data?.error || t('error'));
    } finally {
      setBusy(false);
    }
  };

  const resumeHeld = (order) => {
    if (state.items.length) {
      const ok = window.confirm(t('posReplaceCartConfirm'));
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
    showToast(`${t('posResumeHeld')} ${order.orderNumber}`);
  };

  const cancelCurrent = () => {
    if (!state.items.length) return;
    const ok = window.confirm(t('posCancelOrderConfirm'));
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
      showToast(t('posStatsForbidden'));
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

  const clockLocale = language === 'nl' ? 'nl-BE' : language === 'en' ? 'en-GB' : 'fr-BE';
  const clockLabel = state.clock.toLocaleTimeString(clockLocale, {
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
          Vriends <span>{t('posBrand')}</span>
        </div>
        <div className="pos-clock">
          {clockLabel} · {user?.name || t('posEmployee')}
        </div>
        <input
          ref={searchRef}
          className="pos-search"
          placeholder={t('posSearchPlaceholder')}
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
            {t('posHistory')}
          </Link>
          {canManagePos && (
            <button type="button" className="pos-ghost-btn" onClick={openStats}>
              {t('posStats')}
            </button>
          )}
          <button type="button" className="pos-ghost-btn" onClick={() => navigate('/')}>
            {t('posQuit')}
          </button>
        </div>
      </aside>

      {/* CENTRE */}
      <main className="pos-col pos-center">
        <div className="pos-center-top">
          {[
            { key: CUSTOMER_TYPES.STANDARD, label: t('posCustomerStandard') },
            { key: CUSTOMER_TYPES.RESIDENT, label: t('posCustomerResident') },
            { key: CUSTOMER_TYPES.WORKER, label: t('posCustomerWorker') },
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
            {t('posDineIn')}
          </button>
          <button
            type="button"
            className={`pos-pill ${state.orderType === 'TAKEAWAY' ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ORDER_TYPE', payload: 'TAKEAWAY' })}
          >
            {t('posTakeaway')}
          </button>
          {earlyBirdActive && <div className="pos-rule-badge">🐦 {t('posEarlyBirdBadge')} -{pricing.earlyBirdDiscountPercent} %</div>}
          {lateActive && (
            <div className="pos-rule-badge late">
              {t('posLateSurchargeBadge')} : +{pricing.lateSurchargePercent} %
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
                    showToast(t('posFavoriteError'));
                  }
                }}
                aria-label={t('posFavorite')}
              >
                {product.isFavorite ? '★' : '☆'}
              </button>
              {!product.available && <span className="pos-soldout">{t('posSoldOut')}</span>}
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" className="pos-product-img" />
              ) : (
                <div className="pos-product-emoji">{productEmoji(product)}</div>
              )}
              <div className="pos-product-name">{product.name}</div>
              <div className="pos-product-meta">
                {(product.categories?.length ? product.categories : [product.category]).filter(Boolean).join(' · ')}
              </div>
              <div className="pos-product-price">{formatCents(product.priceCents)}</div>
            </div>
          ))}
          {!filteredProducts.length && !loading && (
            <div className="pos-cart-empty">{t('posNoProducts')}</div>
          )}
        </div>
      </main>

      {/* DROITE */}
      <aside className="pos-col pos-right">
        <div className="pos-right-header">
          <h2>{t('posCart')}</h2>
          <span>{state.customerType}</span>
        </div>

        {heldOrders.length > 0 && (
          <div className="pos-held">
            {heldOrders.map((h) => (
              <button key={h.id} type="button" className="pos-held-item" onClick={() => resumeHeld(h)}>
                ⏸ {h.orderNumber} · {formatCents(h.totalCents)} · {t('posResumeHeld')}
              </button>
            ))}
          </div>
        )}

        <div className="pos-cart-items">
          {!state.items.length && (
            <div className="pos-cart-empty">{t('posAddProductHint')}</div>
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
                {t('posRemove')}
              </button>
            </div>
          ))}
        </div>

        <div className="pos-totals">
          <div className="pos-total-row">
            <span>{t('posSubtotal')}</span>
            <span>{formatCents(pricing.subtotalCents)}</span>
          </div>
          {pricing.customerDiscountCents > 0 && (
            <div className="pos-total-row discount">
              <span>{t('posCustomerDiscount')} (−{pricing.customerDiscountPercent} %)</span>
              <span>−{formatCents(pricing.customerDiscountCents)}</span>
            </div>
          )}
          {pricing.earlyBirdDiscountCents > 0 && (
            <div className="pos-total-row discount">
              <span>{t('posEarlyBird')} (−{pricing.earlyBirdDiscountPercent} %)</span>
              <span>−{formatCents(pricing.earlyBirdDiscountCents)}</span>
            </div>
          )}
          {pricing.lateSurchargeCents > 0 && (
            <div className="pos-total-row surcharge">
              <span>{t('posLateSurcharge')} (+{pricing.lateSurchargePercent} %)</span>
              <span>+{formatCents(pricing.lateSurchargeCents)}</span>
            </div>
          )}
          <div className="pos-total-final">
            <label>{t('posTotalDue')}</label>
            <strong>{formatCents(pricing.finalTotalCents)}</strong>
          </div>
        </div>

        <div className="pos-actions">
          <button type="button" className="pos-btn pos-btn-secondary" onClick={handleHold} disabled={!state.items.length}>
            {t('posHold')}
          </button>
          <button type="button" className="pos-btn pos-btn-danger" onClick={cancelCurrent} disabled={!state.items.length}>
            {t('posCancel')}
          </button>
          <button type="button" className="pos-btn pos-btn-primary" onClick={openPayment} disabled={!state.items.length}>
            {t('posPay')}
          </button>
        </div>
      </aside>

      {/* Modal paiement */}
      {paymentOpen && (
        <div className="pos-modal-backdrop" onClick={() => !busy && setPaymentOpen(false)}>
          <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('posPayment')}</h3>
            <p className="lead">{t('posTotal')} : {formatCents(pricing.finalTotalCents)}</p>
            <div className="pos-pay-methods">
              {['CARD', 'CASH', 'OTHER'].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={payMethod === m ? 'active' : ''}
                  onClick={() => setPayMethod(m)}
                >
                  {m === 'CARD' ? t('posCard') : m === 'CASH' ? t('posCash') : t('posOther')}
                </button>
              ))}
            </div>
            {payMethod === 'CASH' && (
              <>
                <label>{t('posAmountReceived')}</label>
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
                    {t('posExact')}
                  </button>
                </div>
                <div className="pos-change">
                  <span>{t('posChangeDue')}</span>
                  <span>{formatCents(cashChange.changeCents)}</span>
                </div>
              </>
            )}
            <div className="pos-modal-actions">
              <button type="button" className="pos-btn pos-btn-secondary" onClick={() => setPaymentOpen(false)}>
                {t('posBack')}
              </button>
              <button type="button" className="pos-btn pos-btn-primary" onClick={handlePay} disabled={busy}>
                {t('posValidate')}
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
              <h3>{t('posPaymentAccepted')}</h3>
              <div className="order-no">{t('posOrder')} {successOrder.orderNumber}</div>
              <div className="pos-modal-actions">
                <button
                  type="button"
                  className="pos-btn pos-btn-secondary"
                  onClick={printTicket}
                >
                  {t('posPrintTicket')}
                </button>
                <button
                  type="button"
                  className="pos-btn pos-btn-secondary"
                  onClick={printTicket}
                >
                  {t('posReprint')}
                </button>
                <button
                  type="button"
                  className="pos-btn pos-btn-primary"
                  onClick={() => setSuccessOrder(null)}
                >
                  {t('posNewOrder')}
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
            <h3>{t('posStatsToday')}</h3>
            <p className="lead">{stats.date}</p>
            <div className="pos-totals" style={{ borderTop: 'none' }}>
              <div className="pos-total-row"><span>{t('posRevenue')}</span><span>{formatCents(stats.revenueCents)}</span></div>
              <div className="pos-total-row"><span>{t('posOrdersCount')}</span><span>{stats.ordersCount}</span></div>
              <div className="pos-total-row"><span>{t('posAvgBasket')}</span><span>{formatCents(stats.averageBasketCents)}</span></div>
              <div className="pos-total-row"><span>{t('posCard')}</span><span>{stats.payments.card.count} · {formatCents(stats.payments.card.amountCents)}</span></div>
              <div className="pos-total-row"><span>{t('posCash')}</span><span>{stats.payments.cash.count} · {formatCents(stats.payments.cash.amountCents)}</span></div>
              <div className="pos-total-row discount"><span>{t('posDiscounts')}</span><span>{formatCents(stats.discountsCents)}</span></div>
            </div>
            {stats.topProducts?.length > 0 && (
              <>
                <p className="lead" style={{ marginTop: '1rem' }}>{t('posTopProducts')}</p>
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
                {t('posClose')}
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
  const { t } = useLanguage();
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
        <p className="lead">{t('posChooseOptions')}</p>
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
            {t('posCancel')}
          </button>
          <button type="button" className="pos-btn pos-btn-primary" onClick={() => onConfirm(values)}>
            {t('posAdd')}
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

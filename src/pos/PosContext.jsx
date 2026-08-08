import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { calculateOrderPricing, CUSTOMER_TYPES } from '../lib/pricingEngine';

const STORAGE_KEY = 'vriends_pos_draft';

const PosContext = createContext(null);

function lineKey(productId, options) {
  return `${productId}::${JSON.stringify(options || null)}`;
}

const initialState = {
  customerType: CUSTOMER_TYPES.STANDARD,
  orderType: 'DINE_IN',
  items: [],
  selectedLineKey: null,
  category: 'ALL',
  search: '',
  settings: null,
  clock: new Date(),
};

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload };
    case 'SET_CUSTOMER':
      return { ...state, customerType: action.payload };
    case 'SET_ORDER_TYPE':
      return { ...state, orderType: action.payload };
    case 'SET_CATEGORY':
      return { ...state, category: action.payload };
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'TICK':
      return { ...state, clock: action.payload };
    case 'SELECT_LINE':
      return { ...state, selectedLineKey: action.payload };
    case 'ADD_ITEM': {
      const { product, options } = action.payload;
      const key = lineKey(product.id, options);
      const existing = state.items.find((i) => i.key === key);
      let items;
      if (existing) {
        items = state.items.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        items = [
          ...state.items,
          {
            key,
            productId: product.id,
            name: product.name,
            unitPriceCents: product.priceCents,
            quantity: 1,
            options: options || null,
            available: product.available,
          },
        ];
      }
      return { ...state, items, selectedLineKey: key };
    }
    case 'SET_QTY': {
      const { key, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.key !== key),
          selectedLineKey: state.selectedLineKey === key ? null : state.selectedLineKey,
        };
      }
      return {
        ...state,
        items: state.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
      };
    }
    case 'REMOVE_LINE':
      return {
        ...state,
        items: state.items.filter((i) => i.key !== action.payload),
        selectedLineKey: state.selectedLineKey === action.payload ? null : state.selectedLineKey,
      };
    case 'CLEAR':
      return {
        ...state,
        items: [],
        selectedLineKey: null,
        customerType: CUSTOMER_TYPES.STANDARD,
        orderType: 'DINE_IN',
      };
    case 'LOAD_HELD':
      return {
        ...state,
        items: action.payload.items,
        customerType: action.payload.customerType,
        orderType: action.payload.orderType,
        selectedLineKey: null,
      };
    default:
      return state;
  }
}

export function PosProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrated = useRef(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft?.items?.length) {
      dispatch({
        type: 'HYDRATE',
        payload: {
          items: draft.items,
          customerType: draft.customerType || CUSTOMER_TYPES.STANDARD,
          orderType: draft.orderType || 'DINE_IN',
        },
      });
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const payload = {
      items: state.items,
      customerType: state.customerType,
      orderType: state.orderType,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [state.items, state.customerType, state.orderType]);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK', payload: new Date() }), 15000);
    return () => clearInterval(id);
  }, []);

  const pricing = calculateOrderPricing({
    items: state.items.map((i) => ({
      unitPriceCents: i.unitPriceCents,
      quantity: i.quantity,
    })),
    customerType: state.customerType,
    now: state.clock,
    settings: state.settings || undefined,
  });

  const clearDraftStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <PosContext.Provider value={{ state, dispatch, pricing, clearDraftStorage }}>
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error('usePos must be used within PosProvider');
  return ctx;
}

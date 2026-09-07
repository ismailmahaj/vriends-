import { createContext, useContext, useState, useEffect } from 'react';
import { computeUnitPriceEuros } from '../lib/optionsEngine';

const CartContext = createContext(null);

function lineKey(productId, options) {
  return `${productId}::${JSON.stringify(options || null)}`;
}

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Erreur chargement panier:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, options = null, unitPriceOverride = null) => {
    const key = lineKey(product.id, options);
    const unitPrice =
      unitPriceOverride != null
        ? Number(unitPriceOverride)
        : computeUnitPriceEuros(product.price, product.optionsSchema, options || {});

    setItems((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          key,
          product: { ...product, price: unitPrice },
          basePrice: product.price,
          options: options || null,
          unitPrice,
          quantity: 1,
          lineNote: '',
        },
      ];
    });
  };

  const updateLineNote = (keyOrProductId, lineNote) => {
    const cleaned = String(lineNote || '')
      .replace(/[<>]/g, '')
      .slice(0, 300);
    setItems((prev) =>
      prev.map((item) =>
        item.key === keyOrProductId || item.product.id === keyOrProductId
          ? { ...item, lineNote: cleaned }
          : item
      )
    );
  };

  const removeItem = (keyOrProductId) => {
    setItems((prev) =>
      prev.filter((item) => item.key !== keyOrProductId && item.product.id !== keyOrProductId)
    );
  };

  const updateQty = (keyOrProductId, quantity) => {
    if (quantity <= 0) {
      removeItem(keyOrProductId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.key === keyOrProductId || item.product.id === keyOrProductId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? item.product.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        updateLineNote,
        clearCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

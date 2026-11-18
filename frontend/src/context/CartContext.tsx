import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { MenuItem } from '../types';

export interface CartLine { item: MenuItem; quantity: number; }
interface CartState {
  kitchenId: number | null;
  kitchenName: string | null;
  lines: CartLine[];
  count: number;
  add: (item: MenuItem, kitchenId: number, kitchenName: string) => 'added' | 'conflict';
  replaceWith: (item: MenuItem, kitchenId: number, kitchenName: string) => void;
  setQty: (itemId: number, qty: number) => void;
  qtyOf: (itemId: number) => number;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);
const KEY = 'homeplate.cart';

interface Stored { kitchenId: number | null; kitchenName: string | null; lines: CartLine[] }

function load(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { kitchenId: null, kitchenName: null, lines: [] };
}

/** Cart is limited to one kitchen at a time (each kitchen self-delivers). */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Stored>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const add: CartState['add'] = (item, kitchenId, kitchenName) => {
    if (state.kitchenId && state.kitchenId !== kitchenId && state.lines.length) return 'conflict';
    setState((s) => {
      const existing = s.lines.find((l) => l.item.id === item.id);
      const lines = existing
        ? s.lines.map((l) => (l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l))
        : [...s.lines, { item, quantity: 1 }];
      return { kitchenId, kitchenName, lines };
    });
    return 'added';
  };

  const replaceWith: CartState['replaceWith'] = (item, kitchenId, kitchenName) =>
    setState({ kitchenId, kitchenName, lines: [{ item, quantity: 1 }] });

  const setQty = (itemId: number, qty: number) =>
    setState((s) => {
      const lines = qty <= 0 ? s.lines.filter((l) => l.item.id !== itemId)
        : s.lines.map((l) => (l.item.id === itemId ? { ...l, quantity: Math.min(qty, 50) } : l));
      return lines.length ? { ...s, lines } : { kitchenId: null, kitchenName: null, lines: [] };
    });

  const qtyOf = (itemId: number) => state.lines.find((l) => l.item.id === itemId)?.quantity ?? 0;
  const clear = () => setState({ kitchenId: null, kitchenName: null, lines: [] });
  const count = state.lines.reduce((a, l) => a + l.quantity, 0);

  return (
    <CartContext.Provider value={{ ...state, count, add, replaceWith, setQty, qtyOf, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product, CartItem, Transaction, User,
  initialProducts, initialTransactions, initialUsers
} from './mockData';

interface AppState {
  currentUser: User | null;
  products: Product[];
  transactions: Transaction[];
  users: User[];
  cart: CartItem[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  completeSale: (cashPaid: number) => Transaction | null;
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  addUser: (u: Omit<User, 'id'>) => void;
  deleteUser: (id: string) => void;
  cartTotal: number;
}

const AppContext = createContext<AppState>({} as AppState);
export const useApp = () => useContext(AppContext);

const STORAGE_KEY = 'pharmacy_pos';

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return null;
}

function saveState(products: Product[], transactions: Transaction[], users: User[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, transactions, users }));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const saved = loadState();
  const [products, setProducts] = useState<Product[]>(saved?.products || initialProducts);
  const [transactions, setTransactions] = useState<Transaction[]>(saved?.transactions || initialTransactions);
  const [users, setUsers] = useState<User[]>(saved?.users || initialUsers);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const uid = localStorage.getItem('pharmacy_user');
    if (uid) {
      const u = (saved?.users || initialUsers).find((x: User) => x.id === uid);
      return u || null;
    }
    return null;
  });

  useEffect(() => { saveState(products, transactions, users); }, [products, transactions, users]);

  const login = useCallback((username: string, password: string) => {
    const u = users.find(x => x.username === username && x.password === password);
    if (u) { setCurrentUser(u); localStorage.setItem('pharmacy_user', u.id); return true; }
    return false;
  }, [users]);

  const logout = useCallback(() => { setCurrentUser(null); localStorage.removeItem('pharmacy_user'); setCart([]); }, []);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      if (product.stock <= 0) return prev;
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  }, []);

  const updateCartQty = useCallback((productId: string, qty: number) => {
    setCart(prev => {
      if (qty <= 0) return prev.filter(c => c.product.id !== productId);
      return prev.map(c => {
        if (c.product.id === productId) {
          const maxQty = Math.min(qty, c.product.stock);
          return { ...c, quantity: maxQty };
        }
        return c;
      });
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, c) => sum + c.product.sellingPrice * c.quantity, 0);

  const completeSale = useCallback((cashPaid: number) => {
    if (cart.length === 0 || cashPaid < cartTotal) return null;
    const tx: Transaction = {
      id: `t${Date.now()}`,
      date: new Date().toISOString(),
      items: cart.map(c => ({ name: c.product.name, qty: c.quantity, price: c.product.sellingPrice, subtotal: c.product.sellingPrice * c.quantity })),
      total: cartTotal,
      cashPaid,
      balance: cashPaid - cartTotal,
      cashier: currentUser?.username || 'unknown',
    };
    setTransactions(prev => [tx, ...prev]);
    setProducts(prev => prev.map(p => {
      const item = cart.find(c => c.product.id === p.id);
      if (item) return { ...p, stock: p.stock - item.quantity };
      return p;
    }));
    setCart([]);
    return tx;
  }, [cart, cartTotal, currentUser]);

  const addProduct = useCallback((p: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...p, id: `p${Date.now()}` }]);
  }, []);

  const updateProduct = useCallback((p: Product) => {
    setProducts(prev => prev.map(x => x.id === p.id ? p : x));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(x => x.id !== id));
  }, []);

  const addUser = useCallback((u: Omit<User, 'id'>) => {
    setUsers(prev => [...prev, { ...u, id: `u${Date.now()}` }]);
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(x => x.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, products, transactions, users, cart,
      login, logout, addToCart, removeFromCart, updateCartQty, clearCart,
      completeSale, addProduct, updateProduct, deleteProduct, addUser, deleteUser, cartTotal
    }}>
      {children}
    </AppContext.Provider>
  );
}

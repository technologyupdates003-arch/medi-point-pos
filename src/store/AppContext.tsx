import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product, CartItem, Transaction, BusinessSettings, Branch,
  defaultBusinessSettings
} from './mockData';
import {
  isOnline as checkOnline, processQueue, getPendingCount, getLastSyncTime,
  fetchBranches, fetchProducts, fetchTransactions, fetchBusinessSettings,
  syncProduct, syncTransaction, syncBranch, syncBusinessSettings
} from './syncService';
import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'cashier';
  branchId?: string;
  email: string;
}

interface AppState {
  currentUser: AuthUser | null;
  setAuthUser: (user: AuthUser | null) => void;
  products: Product[];
  transactions: Transaction[];
  branches: Branch[];
  cart: CartItem[];
  isOnline: boolean;
  pendingSyncs: number;
  lastSync: string | null;
  currentBranchId: string | null;
  logout: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  completeSale: (cashPaid: number) => Transaction | null;
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  addBranch: (b: Omit<Branch, 'id'>) => void;
  updateBranch: (b: Branch) => void;
  deleteBranch: (id: string) => void;
  setCurrentBranchId: (id: string | null) => void;
  businessSettings: BusinessSettings;
  updateBusinessSettings: (s: BusinessSettings) => void;
  cartTotal: number;
  syncNow: () => Promise<void>;
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

function saveState(products: Product[], transactions: Transaction[], businessSettings: BusinessSettings, branches: Branch[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, transactions, businessSettings, branches }));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const saved = loadState();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [products, setProducts] = useState<Product[]>(saved?.products || []);
  const [transactions, setTransactions] = useState<Transaction[]>(saved?.transactions || []);
  const [branches, setBranches] = useState<Branch[]>(saved?.branches || []);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(saved?.businessSettings || defaultBusinessSettings);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [online, setOnline] = useState(checkOnline());
  const [pendingSyncs, setPendingSyncs] = useState(getPendingCount());
  const [lastSync, setLastSync] = useState<string | null>(getLastSyncTime());
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(() => {
    return localStorage.getItem('pharmacy_branch') || null;
  });

  const setAuthUser = useCallback((user: AuthUser | null) => {
    setCurrentUser(user);
    if (user) {
      if (user.role === 'cashier' && user.branchId) {
        setCurrentBranchId(user.branchId);
      } else if (user.role === 'admin' && !currentBranchId) {
        setCurrentBranchId(branches[0]?.id || null);
      }
    }
  }, [branches, currentBranchId]);

  // Save to localStorage
  useEffect(() => { saveState(products, transactions, businessSettings, branches); }, [products, transactions, businessSettings, branches]);

  // Save branch selection
  useEffect(() => {
    if (currentBranchId) localStorage.setItem('pharmacy_branch', currentBranchId);
    else localStorage.removeItem('pharmacy_branch');
  }, [currentBranchId]);

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (online) syncNow();
  }, [online]);

  // Periodic sync
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingSyncs(getPendingCount());
      if (checkOnline() && getPendingCount() > 0) {
        processQueue().then(() => {
          setPendingSyncs(getPendingCount());
          setLastSync(getLastSyncTime());
        });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const syncNow = useCallback(async () => {
    if (!checkOnline()) return;
    try {
      await processQueue();
      const [cloudBranches, cloudProducts, cloudTx, cloudSettings] = await Promise.all([
        fetchBranches(), fetchProducts(), fetchTransactions(), fetchBusinessSettings(),
      ]);
      if (cloudBranches.length > 0) setBranches(cloudBranches);
      if (cloudProducts.length > 0) setProducts(cloudProducts);
      if (cloudTx.length > 0) setTransactions(cloudTx);
      if (cloudSettings) setBusinessSettings(cloudSettings);
      setPendingSyncs(getPendingCount());
      setLastSync(getLastSyncTime());
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }, []);

  const updateBusinessSettings = useCallback((s: BusinessSettings) => {
    setBusinessSettings(s);
    syncBusinessSettings(s);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCart([]);
  }, []);

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
      return prev.map(c => c.product.id === productId ? { ...c, quantity: Math.min(qty, c.product.stock) } : c);
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
      cashier: currentUser?.name || 'unknown',
      branchId: currentBranchId || undefined,
    };
    setTransactions(prev => [tx, ...prev]);
    const updatedProducts: Product[] = [];
    setProducts(prev => prev.map(p => {
      const item = cart.find(c => c.product.id === p.id);
      if (item) {
        const updated = { ...p, stock: p.stock - item.quantity };
        updatedProducts.push(updated);
        return updated;
      }
      return p;
    }));
    setCart([]);
    syncTransaction(tx);
    updatedProducts.forEach(p => syncProduct(p, 'upsert'));
    return tx;
  }, [cart, cartTotal, currentUser, currentBranchId]);

  const addProduct = useCallback((p: Omit<Product, 'id'>) => {
    const newProduct = { ...p, id: crypto.randomUUID(), branchId: currentBranchId || undefined };
    setProducts(prev => [...prev, newProduct]);
    syncProduct(newProduct, 'upsert');
  }, [currentBranchId]);

  const updateProduct = useCallback((p: Product) => {
    setProducts(prev => prev.map(x => x.id === p.id ? p : x));
    syncProduct(p, 'upsert');
  }, []);

  const deleteProduct = useCallback((id: string) => {
    const product = products.find(p => p.id === id);
    setProducts(prev => prev.filter(x => x.id !== id));
    if (product) syncProduct(product, 'delete');
  }, [products]);

  const addBranch = useCallback((b: Omit<Branch, 'id'>) => {
    const newBranch = { ...b, id: crypto.randomUUID() };
    setBranches(prev => [...prev, newBranch]);
    syncBranch(newBranch, 'upsert');
  }, []);

  const updateBranch = useCallback((b: Branch) => {
    setBranches(prev => prev.map(x => x.id === b.id ? b : x));
    syncBranch(b, 'upsert');
  }, []);

  const deleteBranch = useCallback((id: string) => {
    const branch = branches.find(b => b.id === id);
    setBranches(prev => prev.filter(x => x.id !== id));
    if (branch) syncBranch(branch, 'delete');
  }, [branches]);

  return (
    <AppContext.Provider value={{
      currentUser, setAuthUser, products, transactions, branches, cart, businessSettings,
      isOnline: online, pendingSyncs, lastSync, currentBranchId,
      logout, addToCart, removeFromCart, updateCartQty, clearCart,
      completeSale, addProduct, updateProduct, deleteProduct,
      addBranch, updateBranch, deleteBranch, setCurrentBranchId,
      updateBusinessSettings, cartTotal, syncNow
    }}>
      {children}
    </AppContext.Provider>
  );
}

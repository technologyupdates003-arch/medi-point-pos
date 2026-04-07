import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product, CartItem, Transaction, User, BusinessSettings, Branch,
  initialProducts, initialTransactions, initialUsers, defaultBusinessSettings, initialBranches
} from './mockData';
import {
  isOnline as checkOnline, processQueue, getPendingCount, getLastSyncTime,
  fetchBranches, fetchProducts, fetchTransactions, fetchUsers, fetchBusinessSettings,
  syncProduct, syncTransaction, syncUser, syncBranch, syncBusinessSettings
} from './syncService';

interface AppState {
  currentUser: User | null;
  products: Product[];
  transactions: Transaction[];
  users: User[];
  branches: Branch[];
  cart: CartItem[];
  isOnline: boolean;
  pendingSyncs: number;
  lastSync: string | null;
  currentBranchId: string | null;
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

function saveState(products: Product[], transactions: Transaction[], users: User[], businessSettings: BusinessSettings, branches: Branch[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, transactions, users, businessSettings, branches }));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const saved = loadState();
  const [products, setProducts] = useState<Product[]>(saved?.products || initialProducts);
  const [transactions, setTransactions] = useState<Transaction[]>(saved?.transactions || initialTransactions);
  const [users, setUsers] = useState<User[]>(saved?.users || initialUsers);
  const [branches, setBranches] = useState<Branch[]>(saved?.branches || initialBranches);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(saved?.businessSettings || defaultBusinessSettings);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [online, setOnline] = useState(checkOnline());
  const [pendingSyncs, setPendingSyncs] = useState(getPendingCount());
  const [lastSync, setLastSync] = useState<string | null>(getLastSyncTime());
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(() => {
    return localStorage.getItem('pharmacy_branch') || null;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const uid = localStorage.getItem('pharmacy_user');
    if (uid) {
      const u = (saved?.users || initialUsers).find((x: User) => x.id === uid);
      return u || null;
    }
    return null;
  });

  // Save to localStorage
  useEffect(() => { saveState(products, transactions, users, businessSettings, branches); }, [products, transactions, users, businessSettings, branches]);

  // Save branch selection
  useEffect(() => {
    if (currentBranchId) localStorage.setItem('pharmacy_branch', currentBranchId);
    else localStorage.removeItem('pharmacy_branch');
  }, [currentBranchId]);

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => { setOnline(true); };
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
    if (online) {
      syncNow();
    }
  }, [online]);

  // Periodic sync check
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
      // Process any pending queue first
      await processQueue();
      
      // Then pull latest from cloud
      const [cloudBranches, cloudProducts, cloudTx, cloudUsers, cloudSettings] = await Promise.all([
        fetchBranches(),
        fetchProducts(),
        fetchTransactions(),
        fetchUsers(),
        fetchBusinessSettings(),
      ]);

      if (cloudBranches.length > 0) setBranches(cloudBranches);
      if (cloudProducts.length > 0) setProducts(cloudProducts);
      if (cloudTx.length > 0) setTransactions(cloudTx);
      if (cloudUsers.length > 0) setUsers(cloudUsers);
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

  const login = useCallback((username: string, password: string) => {
    const u = users.find(x => x.username === username && x.password === password);
    if (u) {
      setCurrentUser(u);
      localStorage.setItem('pharmacy_user', u.id);
      // Auto-set branch for cashier
      if (u.role === 'cashier' && u.branchId) {
        setCurrentBranchId(u.branchId);
      } else if (u.role === 'admin' && !currentBranchId) {
        setCurrentBranchId(branches[0]?.id || null);
      }
      return true;
    }
    return false;
  }, [users, branches, currentBranchId]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('pharmacy_user');
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
      return prev.map(c => {
        if (c.product.id === productId) {
          return { ...c, quantity: Math.min(qty, c.product.stock) };
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
    
    // Sync to cloud
    syncTransaction(tx);
    updatedProducts.forEach(p => syncProduct(p, 'upsert'));
    
    return tx;
  }, [cart, cartTotal, currentUser, currentBranchId]);

  const addProduct = useCallback((p: Omit<Product, 'id'>) => {
    const newProduct = { ...p, id: `p${Date.now()}`, branchId: currentBranchId || undefined };
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

  const addUser = useCallback((u: Omit<User, 'id'>) => {
    const newUser = { ...u, id: `u${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
    syncUser(newUser, 'upsert');
  }, []);

  const deleteUser = useCallback((id: string) => {
    const user = users.find(u => u.id === id);
    setUsers(prev => prev.filter(x => x.id !== id));
    if (user) syncUser(user, 'delete');
  }, [users]);

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
      currentUser, products, transactions, users, branches, cart, businessSettings,
      isOnline: online, pendingSyncs, lastSync, currentBranchId,
      login, logout, addToCart, removeFromCart, updateCartQty, clearCart,
      completeSale, addProduct, updateProduct, deleteProduct, addUser, deleteUser,
      addBranch, updateBranch, deleteBranch, setCurrentBranchId,
      updateBusinessSettings, cartTotal, syncNow
    }}>
      {children}
    </AppContext.Provider>
  );
}

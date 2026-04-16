import { supabase } from '@/integrations/supabase/client';
import { Product, Transaction, BusinessSettings, Branch } from './mockData';

const SYNC_QUEUE_KEY = 'pharmacy_sync_queue';
const LAST_SYNC_KEY = 'pharmacy_last_sync';

interface SyncAction {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export function isOnline(): boolean {
  return navigator.onLine;
}

function getQueue(): SyncAction[] {
  try {
    const q = localStorage.getItem(SYNC_QUEUE_KEY);
    return q ? JSON.parse(q) : [];
  } catch { return []; }
}

function saveQueue(queue: SyncAction[]) {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function addToQueue(table: string, action: 'insert' | 'update' | 'delete', data: any) {
  const queue = getQueue();
  queue.push({ id: `sq_${Date.now()}_${Math.random()}`, table, action, data, timestamp: Date.now() });
  saveQueue(queue);
}

export async function processQueue(): Promise<number> {
  if (!isOnline()) return 0;
  const queue = getQueue();
  if (queue.length === 0) return 0;

  let processed = 0;
  const remaining: SyncAction[] = [];

  for (const item of queue) {
    try {
      const table = item.table as any;
      if (item.action === 'insert') {
        const { error } = await supabase.from(table).upsert(item.data as any);
        if (error) throw error;
      } else if (item.action === 'update') {
        const { error } = await supabase.from(table).upsert(item.data as any);
        if (error) throw error;
      } else if (item.action === 'delete') {
        const { error } = await supabase.from(table).delete().eq('id', item.data.id);
        if (error) throw error;
      }
      processed++;
    } catch (err) {
      console.error('Sync error:', err);
      remaining.push(item);
    }
  }

  saveQueue(remaining);
  if (processed > 0) {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  }
  return processed;
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function getPendingCount(): number {
  return getQueue().length;
}

// ---- Fetch from Cloud ----

export async function fetchBranches(): Promise<Branch[]> {
  const { data, error } = await supabase.from('branches').select('*').order('created_at');
  if (error) { console.error('fetchBranches:', error); return []; }
  return (data || []).map(b => ({
    id: b.id,
    name: b.name,
    address: b.address || '',
    phone: b.phone || '',
  }));
}

export async function fetchProducts(branchId?: string): Promise<Product[]> {
  let q = supabase.from('products').select('*').order('name');
  if (branchId) q = q.eq('branch_id', branchId);
  const { data, error } = await q;
  if (error) { console.error('fetchProducts:', error); return []; }
  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    buyingPrice: Number(p.buying_price),
    sellingPrice: Number(p.selling_price),
    stock: p.stock,
    expiryDate: p.expiry_date || '',
    barcode: p.barcode || '',
    branchId: p.branch_id || undefined,
  }));
}

export async function fetchTransactions(branchId?: string): Promise<Transaction[]> {
  let q = supabase.from('transactions').select('*').order('date', { ascending: false });
  if (branchId) q = q.eq('branch_id', branchId);
  const { data, error } = await q;
  if (error) { console.error('fetchTransactions:', error); return []; }
  return (data || []).map(t => ({
    id: t.id,
    date: t.date,
    items: t.items as any,
    total: Number(t.total),
    cashPaid: Number(t.cash_paid),
    balance: Number(t.balance),
    cashier: t.cashier,
    branchId: t.branch_id || undefined,
  }));
}


export async function fetchBusinessSettings(): Promise<BusinessSettings | null> {
  const { data, error } = await supabase.from('business_settings').select('*').limit(1).single();
  if (error) { console.error('fetchBusinessSettings:', error); return null; }
  return {
    businessName: data.business_name,
    address: data.address || '',
    phone: data.phone || '',
  };
}

// ---- Push to Cloud ----

export async function syncProduct(product: Product, action: 'upsert' | 'delete') {
  const dbData = {
    id: product.id,
    branch_id: product.branchId || null,
    name: product.name,
    category: product.category,
    buying_price: product.buyingPrice,
    selling_price: product.sellingPrice,
    stock: product.stock,
    expiry_date: product.expiryDate,
    barcode: product.barcode,
  };

  if (isOnline()) {
    if (action === 'upsert') {
      await supabase.from('products').upsert(dbData);
    } else {
      await supabase.from('products').delete().eq('id', product.id);
    }
  } else {
    addToQueue('products', action === 'upsert' ? 'update' : 'delete', action === 'delete' ? { id: product.id } : dbData);
  }
}

export async function syncTransaction(tx: Transaction) {
  const dbData = {
    id: tx.id,
    branch_id: tx.branchId || null,
    date: tx.date,
    items: tx.items,
    total: tx.total,
    cash_paid: tx.cashPaid,
    balance: tx.balance,
    cashier: tx.cashier,
  };

  if (isOnline()) {
    await supabase.from('transactions').upsert(dbData);
  } else {
    addToQueue('transactions', 'insert', dbData);
  }
}


export async function syncBranch(branch: Branch, action: 'upsert' | 'delete') {
  const dbData = {
    id: branch.id,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
  };

  if (isOnline()) {
    if (action === 'upsert') {
      await supabase.from('branches').upsert(dbData);
    } else {
      await supabase.from('branches').delete().eq('id', branch.id);
    }
  } else {
    addToQueue('branches', action === 'upsert' ? 'update' : 'delete', action === 'delete' ? { id: branch.id } : dbData);
  }
}

export async function syncBusinessSettings(settings: BusinessSettings) {
  const { data } = await supabase.from('business_settings').select('id').limit(1).single();
  const dbData = {
    ...(data ? { id: data.id } : {}),
    business_name: settings.businessName,
    address: settings.address,
    phone: settings.phone,
  };

  if (isOnline()) {
    await supabase.from('business_settings').upsert(dbData);
  } else {
    addToQueue('business_settings', 'update', dbData);
  }
}

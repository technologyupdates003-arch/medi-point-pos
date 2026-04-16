export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  stock: number;
  expiryDate: string;
  barcode: string;
  branchId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string;
  items: { name: string; qty: number; price: number; subtotal: number }[];
  total: number;
  cashPaid: number;
  balance: number;
  cashier: string;
  branchId?: string;
}

export interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
}

export const defaultBusinessSettings: BusinessSettings = {
  businessName: 'PharmaPOS',
  address: '',
  phone: '',
};

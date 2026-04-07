export interface Product {
  id: string;
  name: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  stock: number;
  expiryDate: string;
  barcode: string;
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
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'cashier';
  name: string;
}

export const initialProducts: Product[] = [
  { id: 'p1', name: 'Paracetamol 500mg', category: 'Tablet', buyingPrice: 2.50, sellingPrice: 5.00, stock: 150, expiryDate: '2026-12-01', barcode: '1000001' },
  { id: 'p2', name: 'Amoxicillin 250mg', category: 'Tablet', buyingPrice: 8.00, sellingPrice: 15.00, stock: 45, expiryDate: '2026-06-15', barcode: '1000002' },
  { id: 'p3', name: 'Panadol Syrup', category: 'Syrup', buyingPrice: 12.00, sellingPrice: 22.00, stock: 8, expiryDate: '2025-11-30', barcode: '1000003' },
  { id: 'p4', name: 'Insulin 100IU', category: 'Injection', buyingPrice: 45.00, sellingPrice: 75.00, stock: 20, expiryDate: '2026-03-01', barcode: '1000004' },
  { id: 'p5', name: 'Vitamin C 1000mg', category: 'Tablet', buyingPrice: 3.00, sellingPrice: 7.50, stock: 200, expiryDate: '2027-01-15', barcode: '1000005' },
  { id: 'p6', name: 'Cough Syrup', category: 'Syrup', buyingPrice: 10.00, sellingPrice: 18.00, stock: 5, expiryDate: '2025-09-20', barcode: '1000006' },
  { id: 'p7', name: 'Ibuprofen 400mg', category: 'Tablet', buyingPrice: 4.00, sellingPrice: 8.00, stock: 90, expiryDate: '2027-05-10', barcode: '1000007' },
  { id: 'p8', name: 'Metformin 500mg', category: 'Tablet', buyingPrice: 5.00, sellingPrice: 10.00, stock: 3, expiryDate: '2026-08-20', barcode: '1000008' },
  { id: 'p9', name: 'Omeprazole 20mg', category: 'Tablet', buyingPrice: 6.00, sellingPrice: 12.00, stock: 60, expiryDate: '2025-04-01', barcode: '1000009' },
  { id: 'p10', name: 'Ciprofloxacin 500mg', category: 'Tablet', buyingPrice: 7.00, sellingPrice: 14.00, stock: 35, expiryDate: '2026-10-10', barcode: '1000010' },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString();

export const initialTransactions: Transaction[] = Array.from({ length: 10 }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  const p1 = initialProducts[i % initialProducts.length];
  const p2 = initialProducts[(i + 3) % initialProducts.length];
  const q1 = Math.floor(Math.random() * 3) + 1;
  const q2 = Math.floor(Math.random() * 2) + 1;
  const total = p1.sellingPrice * q1 + p2.sellingPrice * q2;
  const cash = Math.ceil(total / 10) * 10;
  return {
    id: `t${i + 1}`,
    date: fmt(d),
    items: [
      { name: p1.name, qty: q1, price: p1.sellingPrice, subtotal: p1.sellingPrice * q1 },
      { name: p2.name, qty: q2, price: p2.sellingPrice, subtotal: p2.sellingPrice * q2 },
    ],
    total,
    cashPaid: cash,
    balance: cash - total,
    cashier: i % 2 === 0 ? 'cashier' : 'admin',
  };
});

export interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
}

export const defaultBusinessSettings: BusinessSettings = {
  businessName: 'PharmaPOS',
  address: '123 Health Street, Medical City',
  phone: '',
};

export const initialUsers: User[] = [
  { id: 'u1', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
  { id: 'u2', username: 'cashier', password: '1234', role: 'cashier', name: 'Main Cashier' },
];

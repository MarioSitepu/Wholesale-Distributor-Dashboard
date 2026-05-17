// ─── Auth ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  username: string;
  role: 'admin';
  branch: string;
}

// ─── Domain Types (nama field persis sama dengan FE mockData.ts) ─────────────

export interface User {
  username: string;
  role: 'admin';
  branch: string;
  // password TIDAK pernah dikembalikan ke FE
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  totalIn: number;
  totalOut: number;
}

export interface ProductWithBranch extends Product {
  branch: string;
}

export interface ScheduledPrice {
  id: string;
  productId: string;
  productName: string;
  newPrice: number;
  startDate: string; // YYYY-MM-DD
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  storeId: string;
  storeName: string;
  branch: string;
  items: OrderItem[];
  total: number;
  createdAt: string; // ISO 8601
}

export interface Receivable {
  id: string;
  storeId: string;
  storeName: string;
  orderId: string;
  amount: number;
  dueDate: string; // ISO 8601
  isPaid: boolean;
}

export interface ReceivableWithBranch extends Receivable {
  branch: string;
}

export interface Store {
  id: string;
  name: string;
  branch: string;
  totalDebt: number;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  totalIn: number;
  totalOut: number;
  stock: number;
  branch: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface KpiResponse {
  dailySales: number;
  monthlySales: number;
  totalReceivables: number;
  lowStockCount: number;
}

export interface WeeklySalesItem {
  name: string; // nama hari singkat: "Sen", "Sel", dst.
  sales: number;
}

export interface BranchContributionItem {
  name: string;
  value: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  branch: string;
}

export interface RecentOrderItem {
  id: string;
  storeName: string;
  total: number;
  branch: string;
}

export interface DailyReportRow {
  orderId: string;
  storeName: string;
  branch: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

// ─── API Response Wrapper ────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  productId?: string; // untuk error stok tidak mencukupi
}

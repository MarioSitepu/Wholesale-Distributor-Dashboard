import { api } from './apiClient';

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  totalIn: number;
  totalOut: number;
}

export interface ScheduledPrice {
  id: string;
  productId: string;
  productName: string;
  newPrice: number;
  startDate: string;
}

export interface Order {
  id: string;
  storeId: string;
  storeName: string;
  branch: string;
  items: Array<{ productId: string; productName: string; quantity: number; price: number }>;
  total: number;
  createdAt: string;
}

export interface Receivable {
  id: string;
  storeId: string;
  storeName: string;
  orderId: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
}

export interface Store {
  id: string;
  name: string;
  branch: string;
  totalDebt: number;
}

export interface User {
  username: string;
  password?: string;
  role: 'admin';
  branch: string;
}

// Temporary Cart helper functions (Frontend localstorage is fine)
const isClient = typeof window !== 'undefined';

export const getCurrentBranch = (): string => {
  if (!isClient) return 'General';
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.branch || 'General';
    } catch {
      localStorage.removeItem('currentUser');
      return 'General';
    }
  }
  return 'General';
};

export const getCart = (): Array<{ productId: string; quantity: number }> => {
  if (!isClient) return [];
  return JSON.parse(localStorage.getItem(`wholesale_cart_${getCurrentBranch().toLowerCase()}`) || '[]');
};

export const updateCart = (cart: Array<{ productId: string; quantity: number }>) => {
  if (!isClient) return;
  localStorage.setItem(`wholesale_cart_${getCurrentBranch().toLowerCase()}`, JSON.stringify(cart));
};

export const clearCart = () => {
  if (!isClient) return;
  localStorage.setItem(`wholesale_cart_${getCurrentBranch().toLowerCase()}`, JSON.stringify([]));
};

export const getCurrentStore = (): string => {
  if (!isClient) return '';
  return localStorage.getItem(`wholesale_current_store_${getCurrentBranch().toLowerCase()}`) || '';
};

export const setCurrentStore = (storeId: string) => {
  if (!isClient) return;
  localStorage.setItem(`wholesale_current_store_${getCurrentBranch().toLowerCase()}`, storeId);
};

export const generateId = (prefix: string, branch?: string): string => {
  const b = branch || getCurrentBranch();
  const bCode = b.toUpperCase().substring(0, 3);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${bCode}-${timestamp}${random}`;
};

// ─── API-Backed Functions (Asynchronous returning Promise) ───────────────────

export const getUsers = async (): Promise<User[]> => {
  return api.get<User[]>('/api/accounts');
};

export const addUser = async (user: User): Promise<User> => {
  return api.post<User>('/api/accounts', user);
};

export const deleteUser = async (username: string): Promise<any> => {
  return api.delete<any>(`/api/accounts/${username}`);
};

export const getBranches = async (): Promise<string[]> => {
  const res = await api.get<{ branches: string[] }>('/api/branches');
  return res.branches;
};

export const getCategories = async (): Promise<string[]> => {
  const res = await api.get<{ categories: Array<{ id: string; name: string }> }>('/api/categories');
  return res.categories.map(c => c.name);
};

export const addCategory = async (name: string): Promise<any> => {
  return api.post<any>('/api/categories', { name });
};

export const deleteCategory = async (name: string): Promise<any> => {
  return api.delete<any>(`/api/categories/${encodeURIComponent(name)}`);
};

export const getScheduledPrices = async (branch?: string): Promise<ScheduledPrice[]> => {
  const b = branch || getCurrentBranch();
  return api.get<ScheduledPrice[]>(`/api/scheduled-prices?branch=${b}`);
};

export const addScheduledPrice = async (sp: Omit<ScheduledPrice, 'id' | 'productName'>): Promise<ScheduledPrice> => {
  return api.post<ScheduledPrice>('/api/scheduled-prices', sp);
};

export const deleteScheduledPrice = async (id: string): Promise<any> => {
  return api.delete<any>(`/api/scheduled-prices/${id}`);
};

export const getProducts = async (): Promise<Product[]> => {
  const b = getCurrentBranch();
  return api.get<Product[]>(`/api/products?branch=${b}`);
};

export const getProductsByBranch = async (branch: string): Promise<Product[]> => {
  return api.get<Product[]>(`/api/products?branch=${branch}`);
};

export const addProduct = async (product: Omit<Product, 'stock' | 'totalIn' | 'totalOut'>): Promise<Product> => {
  return api.post<Product>('/api/products', product);
};

export const updateProduct = async (product: Product): Promise<Product> => {
  return api.put<Product>(`/api/products/${product.id}`, {
    name: product.name,
    price: product.price,
    category: product.category,
  });
};

export const deleteProduct = async (productId: string): Promise<any> => {
  return api.delete<any>(`/api/products/${productId}`);
};

export const getOrders = async (): Promise<Order[]> => {
  const b = getCurrentBranch();
  return api.get<Order[]>(`/api/orders?branch=${b}`);
};

export const getOrdersByBranch = async (branch: string): Promise<Order[]> => {
  return api.get<Order[]>(`/api/orders?branch=${branch}`);
};

export const addOrder = async (order: Order, branch?: string): Promise<Order> => {
  const b = branch || getCurrentBranch();
  return api.post<Order>('/api/orders', { ...order, branch: b });
};

export const getReceivables = async (): Promise<Receivable[]> => {
  const b = getCurrentBranch();
  return api.get<Receivable[]>(`/api/receivables?branch=${b}`);
};

export const updateReceivable = async (id: string, isPaid: boolean, branch?: string): Promise<any> => {
  if (isPaid) {
    return api.patch<any>(`/api/receivables/${id}`);
  }
};

export const getStores = async (): Promise<Store[]> => {
  const b = getCurrentBranch();
  return api.get<Store[]>(`/api/stores?branch=${b}`);
};

export const getStoresByBranch = async (branch: string): Promise<Store[]> => {
  return api.get<Store[]>(`/api/stores?branch=${branch}`);
};

export const addStore = async (store: Omit<Store, 'totalDebt'>, branch?: string): Promise<Store> => {
  const b = branch || getCurrentBranch();
  return api.post<Store>('/api/stores', { name: store.name, branch: b });
};

export const updateStore = async (store: Store, branch?: string): Promise<Store> => {
  return api.put<Store>(`/api/stores/${store.id}`, { name: store.name });
};

export const deleteStore = async (id: string, branch?: string): Promise<any> => {
  return api.delete<any>(`/api/stores/${id}`);
};

// Global Data Fetching (returns arrays)
export const getGlobalOrders = async (): Promise<Order[]> => {
  return api.get<Order[]>('/api/orders?branch=all');
};

export const getGlobalProducts = async (): Promise<Product[]> => {
  return api.get<Product[]>('/api/products?branch=all');
};

export const getGlobalStores = async (): Promise<Store[]> => {
  return api.get<Store[]>('/api/stores?branch=all');
};

export const getGlobalReceivables = async (): Promise<Receivable[]> => {
  return api.get<Receivable[]>('/api/receivables?branch=all');
};

// Seeding/Bootstrapping is a no-op now because Prisma + PostgreSQL handles it
export const initializeMockData = () => {};
export const applyScheduledPrices = () => {};

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  initialStock: number;
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
  password: string;
  role: 'admin';
  branch: string;
}

const STORAGE_KEYS = {
  PRODUCTS: 'wholesale_products',
  ORDERS: 'wholesale_orders',
  RECEIVABLES: 'wholesale_receivables',
  STORES: 'wholesale_stores',
  CART: 'wholesale_cart',
  CURRENT_STORE: 'wholesale_current_store',
  SCHEDULED_PRICES: 'wholesale_scheduled_prices',
  USERS: 'wholesale_users'
};

export const getUsers = (): User[] => {
  const users = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!users) {
    const defaultUsers: User[] = [
      { username: 'superadmin', password: 'password123', role: 'admin', branch: 'Pusat' },
      { username: 'palembang', password: 'password123', role: 'admin', branch: 'Palembang' },
      { username: 'baturaja', password: 'password123', role: 'admin', branch: 'Baturaja' },
      { username: 'jambi', password: 'password123', role: 'admin', branch: 'Jambi' },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(users);
};

export const addUser = (user: User) => {
  const users = getUsers();
  if (users.find(u => u.username === user.username)) {
    throw new Error('Username sudah digunakan');
  }
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  // Bootstrap data for the new branch immediately
  initializeMockData();
};

export const deleteUser = (username: string) => {
  if (username === 'superadmin') throw new Error('Tidak dapat menghapus superadmin');
  const users = getUsers();
  const filtered = users.filter(u => u.username !== username);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
};

export const getBranches = (): string[] => {
  const users = getUsers();
  const branches = users
    .map(u => u.branch)
    .filter(b => b !== 'Pusat');
  return Array.from(new Set(branches)).sort();
};

export const getScheduledPrices = (): ScheduledPrice[] => {
  return JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.SCHEDULED_PRICES)) || '[]');
};

export const addScheduledPrice = (scheduledPrice: ScheduledPrice) => {
  const prices = getScheduledPrices();
  localStorage.setItem(getBranchKey(STORAGE_KEYS.SCHEDULED_PRICES), JSON.stringify([...prices, scheduledPrice]));
};

export const deleteScheduledPrice = (id: string) => {
  const prices = getScheduledPrices();
  localStorage.setItem(getBranchKey(STORAGE_KEYS.SCHEDULED_PRICES), JSON.stringify(prices.filter(p => p.id !== id)));
};

export const applyScheduledPrices = () => {
  const scheduledPrices = getScheduledPrices();
  if (scheduledPrices.length === 0) return;

  const today = new Date().toISOString().split('T')[0];
  const products = getProducts();
  const orders = getOrders();
  const receivables = getReceivables();
  
  let productsUpdated = false;
  let ordersUpdated = false;
  let receivablesUpdated = false;
  const remainingScheduled: ScheduledPrice[] = [];

  scheduledPrices.forEach(sp => {
    if (sp.startDate <= today) {
      // 1. Update Current Product Price
      const product = products.find(p => p.id === sp.productId);
      if (product) {
        product.price = sp.newPrice;
        productsUpdated = true;
      }

      // 2. Retroactive: Update Past Orders from startDate onwards
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        if (orderDate >= sp.startDate) {
          let orderTotalChanged = false;
          order.items.forEach(item => {
            if (item.productId === sp.productId) {
              item.price = sp.newPrice;
              orderTotalChanged = true;
            }
          });

          if (orderTotalChanged) {
            const oldTotal = order.total;
            const newTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            order.total = newTotal;
            ordersUpdated = true;

            // 3. Update associated Receivables
            const receivable = receivables.find(r => r.orderId === order.id);
            if (receivable) {
              receivable.amount = newTotal;
              receivablesUpdated = true;
            }
          }
        }
      });
    } else {
      remainingScheduled.push(sp);
    }
  });

  if (productsUpdated) {
    localStorage.setItem(getBranchKey(STORAGE_KEYS.PRODUCTS), JSON.stringify(products));
  }
  if (ordersUpdated) {
    localStorage.setItem(getBranchKey(STORAGE_KEYS.ORDERS), JSON.stringify(orders));
  }
  if (receivablesUpdated) {
    localStorage.setItem(getBranchKey(STORAGE_KEYS.RECEIVABLES), JSON.stringify(receivables));
  }
  
  if (productsUpdated || ordersUpdated || receivablesUpdated) {
    localStorage.setItem(getBranchKey(STORAGE_KEYS.SCHEDULED_PRICES), JSON.stringify(remainingScheduled));
  }
};

export const getCurrentBranch = (): string => {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.branch || 'General';
    } catch (e) {
      localStorage.removeItem('currentUser');
      return 'General';
    }
  }
  return 'General';
};

const getBranchKey = (key: string, branch?: string): string => {
  const b = branch || getCurrentBranch();
  return `${key}_${b.toLowerCase()}`;
};

export const generateId = (prefix: string, branch?: string): string => {
  const b = branch || getCurrentBranch();
  const bCode = b.toUpperCase().substring(0, 3);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${bCode}-${timestamp}${random}`;
};

// Global data fetching for Super Admin
export const getGlobalOrders = (): (Order & { branch: string })[] => {
  let allOrders: (Order & { branch: string })[] = [];
  getBranches().forEach(branch => {
    const orders: Order[] = JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.ORDERS, branch)) || '[]');
    allOrders = [...allOrders, ...orders.map(o => ({ ...o, branch }))];
  });
  return allOrders;
};

export const getGlobalProducts = (): (Product & { branch: string })[] => {
  let allProducts: (Product & { branch: string })[] = [];
  getBranches().forEach(branch => {
    const products: Product[] = JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.PRODUCTS, branch)) || '[]');
    allProducts = [...allProducts, ...products.map(p => ({ ...p, branch }))];
  });
  return allProducts;
};

export const getGlobalStores = (): (Store & { branch: string })[] => {
  let allStores: (Store & { branch: string })[] = [];
  getBranches().forEach(branch => {
    const stores: Store[] = JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.STORES, branch)) || '[]');
    allStores = [...allStores, ...stores.map(s => ({ ...s, branch }))];
  });
  return allStores;
};

export const getGlobalReceivables = (): (Receivable & { branch: string })[] => {
  let allReceivables: (Receivable & { branch: string })[] = [];
  getBranches().forEach(branch => {
    const receivables: Receivable[] = JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.RECEIVABLES, branch)) || '[]');
    allReceivables = [...allReceivables, ...receivables.map(r => ({ ...r, branch }))];
  });
  return allReceivables;
};

export const getProductsByBranch = (branch: string): Product[] => {
  return JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.PRODUCTS, branch)) || '[]');
};

export const getStoresByBranch = (branch: string): Store[] => {
  return JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.STORES, branch)) || '[]');
};

export const getOrdersByBranch = (branch: string): Order[] => {
  return JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.ORDERS, branch)) || '[]');
};

export const addOrderByBranch = (order: Order, branch: string) => {
  const orders = getOrdersByBranch(branch);
  orders.push(order);
  localStorage.setItem(getBranchKey(STORAGE_KEYS.ORDERS, branch), JSON.stringify(orders));
};

export const initializeMockData = () => {
  const INITIAL_PRODUCTS: Product[] = [
    { id: 'F001', name: 'Fiesta Chicken Nugget 500g', category: 'Fiesta', stock: 120, price: 48500, initialStock: 200, totalIn: 200, totalOut: 80 },
    { id: 'F002', name: 'Fiesta Spicy Wing 500g', category: 'Fiesta', stock: 85, price: 58000, initialStock: 150, totalIn: 150, totalOut: 65 },
    { id: 'F003', name: 'Fiesta Schnitzel 500g', category: 'Fiesta', stock: 60, price: 51000, initialStock: 100, totalIn: 100, totalOut: 40 },
    { id: 'F004', name: 'Fiesta Chicken Stichel 500g', category: 'Fiesta', stock: 95, price: 49000, initialStock: 150, totalIn: 150, totalOut: 55 },
    { id: 'F005', name: 'Fiesta Cheesy Lover 500g', category: 'Fiesta', stock: 45, price: 62000, initialStock: 100, totalIn: 100, totalOut: 55 },
    { id: 'F006', name: 'Fiesta Bratwurst Sausage 500g', category: 'Fiesta', stock: 110, price: 42000, initialStock: 200, totalIn: 200, totalOut: 90 },
    { id: 'F007', name: 'Fiesta Bakso Kuah 500g', category: 'Fiesta', stock: 150, price: 25000, initialStock: 300, totalIn: 300, totalOut: 150 },
    { id: 'F008', name: 'Fiesta Karage 500g', category: 'Fiesta', stock: 70, price: 55000, initialStock: 120, totalIn: 120, totalOut: 50 },
    { id: 'S001', name: 'Shifudo Fish Roll 500g', category: 'Shifudo', stock: 95, price: 34500, initialStock: 150, totalIn: 150, totalOut: 55 },
    { id: 'S002', name: 'Shifudo Chikuwa 500g', category: 'Shifudo', stock: 80, price: 31000, initialStock: 120, totalIn: 120, totalOut: 40 },
    { id: 'S003', name: 'Shifudo Crab Stick 500g', category: 'Shifudo', stock: 55, price: 39500, initialStock: 100, totalIn: 100, totalOut: 45 },
    { id: 'S004', name: 'Shifudo Fish Ball 500g', category: 'Shifudo', stock: 115, price: 29000, initialStock: 180, totalIn: 180, totalOut: 65 },
    { id: 'S005', name: 'Shifudo Shrimp Roll 500g', category: 'Shifudo', stock: 40, price: 45000, initialStock: 80, totalIn: 80, totalOut: 40 },
  ];

  getBranches().forEach(branch => {
    const productsKey = getBranchKey(STORAGE_KEYS.PRODUCTS, branch);
    const storesKey = getBranchKey(STORAGE_KEYS.STORES, branch);
    const ordersKey = getBranchKey(STORAGE_KEYS.ORDERS, branch);
    const receivablesKey = getBranchKey(STORAGE_KEYS.RECEIVABLES, branch);

    if (!localStorage.getItem(productsKey)) {
      localStorage.setItem(productsKey, JSON.stringify(INITIAL_PRODUCTS));
    }

    if (!localStorage.getItem(storesKey)) {
      localStorage.setItem(storesKey, JSON.stringify([
        { 
          id: `STR-${branch.toUpperCase().substring(0,3)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, 
          name: `Toko Berkah ${branch}`, 
          branch: branch, 
          totalDebt: 0 
        },
        { 
          id: `STR-${branch.toUpperCase().substring(0,3)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, 
          name: `Warung Maju ${branch}`, 
          branch: branch, 
          totalDebt: 0 
        },
      ]));
    }

    if (!localStorage.getItem(ordersKey)) localStorage.setItem(ordersKey, JSON.stringify([]));
    if (!localStorage.getItem(receivablesKey)) localStorage.setItem(receivablesKey, JSON.stringify([]));
  });
};

export const getProducts = (): Product[] => {
  return JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.PRODUCTS)) || '[]');
};

export const updateProduct = (product: Product) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === product.id);
  if (index !== -1) {
    products[index] = product;
    localStorage.setItem(getBranchKey(STORAGE_KEYS.PRODUCTS), JSON.stringify(products));
  }
};

export const addProduct = (product: Product) => {
  const products = getProducts();
  products.push(product);
  localStorage.setItem(getBranchKey(STORAGE_KEYS.PRODUCTS), JSON.stringify(products));
};

export const deleteProduct = (productId: string) => {
  const products = getProducts();
  const updatedProducts = products.filter(p => p.id !== productId);
  localStorage.setItem(getBranchKey(STORAGE_KEYS.PRODUCTS), JSON.stringify(updatedProducts));
};

export const getOrders = (): Order[] => {
  return JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.ORDERS)) || '[]');
};

export const addOrder = (order: Order) => {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(getBranchKey(STORAGE_KEYS.ORDERS), JSON.stringify(orders));
};

export const updateOrder = (orderId: string, updates: Partial<Order>) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...updates };
    localStorage.setItem(getBranchKey(STORAGE_KEYS.ORDERS), JSON.stringify(orders));
  }
};

export const getReceivables = (): Receivable[] => {
  return JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.RECEIVABLES)) || '[]');
};

export const addReceivable = (receivable: Receivable) => {
  const receivables = getReceivables();
  receivables.push(receivable);
  localStorage.setItem(getBranchKey(STORAGE_KEYS.RECEIVABLES), JSON.stringify(receivables));
};

export const updateReceivable = (id: string, isPaid: boolean) => {
  const receivables = getReceivables();
  const index = receivables.findIndex(r => r.id === id);
  if (index !== -1) {
    receivables[index].isPaid = isPaid;
    localStorage.setItem(getBranchKey(STORAGE_KEYS.RECEIVABLES), JSON.stringify(receivables));
  }
};

export const getStores = (): Store[] => {
  return JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.STORES)) || '[]');
};

export const updateStore = (store: Store) => {
  const stores = getStores();
  const index = stores.findIndex(s => s.id === store.id);
  if (index !== -1) {
    stores[index] = store;
    localStorage.setItem(getBranchKey(STORAGE_KEYS.STORES), JSON.stringify(stores));
  }
};

export const addStore = (store: Store) => {
  const stores = getStores();
  stores.push(store);
  localStorage.setItem(getBranchKey(STORAGE_KEYS.STORES), JSON.stringify(stores));
};

export const deleteStore = (storeId: string) => {
  const stores = getStores();
  const updatedStores = stores.filter(s => s.id !== storeId);
  localStorage.setItem(getBranchKey(STORAGE_KEYS.STORES), JSON.stringify(updatedStores));
};

export const getCurrentStore = (): string => {
  return localStorage.getItem(getBranchKey(STORAGE_KEYS.CURRENT_STORE)) || 'S001';
};

export const setCurrentStore = (storeId: string) => {
  localStorage.setItem(getBranchKey(STORAGE_KEYS.CURRENT_STORE), storeId);
};

export const getCart = (): Array<{ productId: string; quantity: number }> => {
  return JSON.parse(localStorage.getItem(getBranchKey(STORAGE_KEYS.CART)) || '[]');
};

export const updateCart = (cart: Array<{ productId: string; quantity: number }>) => {
  localStorage.setItem(getBranchKey(STORAGE_KEYS.CART), JSON.stringify(cart));
};

export const clearCart = () => {
  localStorage.setItem(getBranchKey(STORAGE_KEYS.CART), JSON.stringify([]));
};


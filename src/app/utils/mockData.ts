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
  totalDebt: number;
}

const STORAGE_KEYS = {
  PRODUCTS: 'wholesale_products',
  ORDERS: 'wholesale_orders',
  RECEIVABLES: 'wholesale_receivables',
  STORES: 'wholesale_stores',
  CART: 'wholesale_cart',
  CURRENT_STORE: 'wholesale_current_store',
  SCHEDULED_PRICES: 'wholesale_scheduled_prices',
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

const getCurrentBranch = (): string => {
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

const getBranchKey = (key: string): string => {
  return `${key}_${getCurrentBranch().toLowerCase()}`;
};

export const initializeMockData = () => {
  const productsKey = getBranchKey(STORAGE_KEYS.PRODUCTS);
  const storesKey = getBranchKey(STORAGE_KEYS.STORES);
  const ordersKey = getBranchKey(STORAGE_KEYS.ORDERS);
  const receivablesKey = getBranchKey(STORAGE_KEYS.RECEIVABLES);
  const currentStoreKey = getBranchKey(STORAGE_KEYS.CURRENT_STORE);

  // Force reset if old data detected (no Fiesta/Shifudo categories)
  const existingProducts = localStorage.getItem(productsKey);
  if (existingProducts) {
    const products: Product[] = JSON.parse(existingProducts);
    const hasNewCategories = products.some(p => p.category === 'Fiesta' || p.category === 'Shifudo');
    if (!hasNewCategories && products.length > 0) {
      localStorage.removeItem(productsKey);
    }
  }

  if (!localStorage.getItem(productsKey)) {
    const products: Product[] = [
      // Fiesta Products
      { id: 'F001', name: 'Fiesta Chicken Nugget 500g', category: 'Fiesta', stock: 120, price: 48500, initialStock: 200, totalIn: 200, totalOut: 80 },
      { id: 'F002', name: 'Fiesta Spicy Wing 500g', category: 'Fiesta', stock: 85, price: 58000, initialStock: 150, totalIn: 150, totalOut: 65 },
      { id: 'F003', name: 'Fiesta Schnitzel 500g', category: 'Fiesta', stock: 60, price: 51000, initialStock: 100, totalIn: 100, totalOut: 40 },
      { id: 'F004', name: 'Fiesta Chicken Stichel 500g', category: 'Fiesta', stock: 95, price: 49000, initialStock: 150, totalIn: 150, totalOut: 55 },
      { id: 'F005', name: 'Fiesta Cheesy Lover 500g', category: 'Fiesta', stock: 45, price: 62000, initialStock: 100, totalIn: 100, totalOut: 55 },
      { id: 'F006', name: 'Fiesta Bratwurst Sausage 500g', category: 'Fiesta', stock: 110, price: 42000, initialStock: 200, totalIn: 200, totalOut: 90 },
      { id: 'F007', name: 'Fiesta Bakso Kuah 500g', category: 'Fiesta', stock: 150, price: 25000, initialStock: 300, totalIn: 300, totalOut: 150 },
      { id: 'F008', name: 'Fiesta Karage 500g', category: 'Fiesta', stock: 70, price: 55000, initialStock: 120, totalIn: 120, totalOut: 50 },
      
      // Shifudo Products
      { id: 'S001', name: 'Shifudo Fish Roll 500g', category: 'Shifudo', stock: 95, price: 34500, initialStock: 150, totalIn: 150, totalOut: 55 },
      { id: 'S002', name: 'Shifudo Chikuwa 500g', category: 'Shifudo', stock: 80, price: 31000, initialStock: 120, totalIn: 120, totalOut: 40 },
      { id: 'S003', name: 'Shifudo Crab Stick 500g', category: 'Shifudo', stock: 55, price: 39500, initialStock: 100, totalIn: 100, totalOut: 45 },
      { id: 'S004', name: 'Shifudo Fish Ball 500g', category: 'Shifudo', stock: 115, price: 29000, initialStock: 180, totalIn: 180, totalOut: 65 },
      { id: 'S005', name: 'Shifudo Shrimp Roll 500g', category: 'Shifudo', stock: 40, price: 45000, initialStock: 80, totalIn: 80, totalOut: 40 },
      { id: 'S006', name: 'Shifudo Dumpling Chicken 500g', category: 'Shifudo', stock: 65, price: 36000, initialStock: 120, totalIn: 120, totalOut: 55 },
      { id: 'S007', name: 'Shifudo Otak-Otak Ikan 500g', category: 'Shifudo', stock: 140, price: 22000, initialStock: 250, totalIn: 250, totalOut: 110 },
      { id: 'S008', name: 'Shifudo Seafood Tofu 500g', category: 'Shifudo', stock: 50, price: 38000, initialStock: 100, totalIn: 100, totalOut: 50 },
    ];
    localStorage.setItem(productsKey, JSON.stringify(products));
  }

  if (!localStorage.getItem(storesKey)) {
    const stores: Store[] = [
      { id: 'S001', name: 'Toko Berkah Jaya', totalDebt: 0 },
      { id: 'S002', name: 'Warung Sumber Rezeki', totalDebt: 0 },
      { id: 'S003', name: 'Minimarket Harapan', totalDebt: 0 },
    ];
    localStorage.setItem(storesKey, JSON.stringify(stores));
  }

  if (!localStorage.getItem(ordersKey)) {
    localStorage.setItem(ordersKey, JSON.stringify([]));
  }

  if (!localStorage.getItem(receivablesKey)) {
    localStorage.setItem(receivablesKey, JSON.stringify([]));
  }

  if (!localStorage.getItem(currentStoreKey)) {
    localStorage.setItem(currentStoreKey, 'S001');
  }
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


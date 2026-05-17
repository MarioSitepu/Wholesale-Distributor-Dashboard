import { useAuthStore } from "../../store/useAuthStore";

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
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
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
  role: "admin";
  branch: string;
}

const STORAGE_KEYS = {
  PRODUCTS: "wholesale_products",
  ORDERS: "wholesale_orders",
  RECEIVABLES: "wholesale_receivables",
  STORES: "wholesale_stores",
  CART: "wholesale_cart",
  CURRENT_STORE: "wholesale_current_store",
  SCHEDULED_PRICES: "wholesale_scheduled_prices",
  USERS: "wholesale_users",
  CATEGORIES: "wholesale_categories",
};

const isClient = typeof window !== "undefined";

const safeGet = (key: string): string | null => {
  if (!isClient) return null;
  return localStorage.getItem(key);
};

const safeSet = (key: string, value: string) => {
  if (!isClient) return;
  localStorage.setItem(key, value);
};

export const getUsers = (): User[] => {
  const users = safeGet(STORAGE_KEYS.USERS);
  if (!users) {
    const defaultUsers: User[] = [
      {
        username: "superadmin",
        password: "password123",
        role: "admin",
        branch: "Pusat",
      },
      {
        username: "palembang",
        password: "password123",
        role: "admin",
        branch: "Palembang",
      },
      {
        username: "baturaja",
        password: "password123",
        role: "admin",
        branch: "Baturaja",
      },
      {
        username: "jambi",
        password: "password123",
        role: "admin",
        branch: "Jambi",
      },
    ];
    if (isClient) safeSet(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(users);
};

export const addUser = (user: User) => {
  const users = getUsers();
  if (users.find((u) => u.username === user.username)) {
    throw new Error("Username sudah digunakan");
  }
  users.push(user);
  safeSet(STORAGE_KEYS.USERS, JSON.stringify(users));

  // Bootstrap data for the new branch immediately
  initializeMockData();
};

export const deleteUser = (username: string) => {
  if (username === "superadmin")
    throw new Error("Tidak dapat menghapus superadmin");
  const users = getUsers();
  const filtered = users.filter((u) => u.username !== username);
  safeSet(STORAGE_KEYS.USERS, JSON.stringify(filtered));
};

export const getBranches = (): string[] => {
  const users = getUsers();
  const branches = users.map((u) => u.branch).filter((b) => b !== "Pusat");
  return Array.from(new Set(branches)).sort();
};

export const getCategories = (): string[] => {
  const cats = safeGet(STORAGE_KEYS.CATEGORIES);
  if (!cats) {
    const defaultCats = ["Fiesta", "Shifudo"];
    if (isClient) safeSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCats));
    return defaultCats;
  }
  return JSON.parse(cats);
};

export const addCategory = (name: string) => {
  const cats = getCategories();
  if (cats.some((c) => c.toLowerCase() === name.toLowerCase())) {
    throw new Error("Kategori sudah ada");
  }
  cats.push(name);
  safeSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
};

export const deleteCategory = (name: string) => {
  const cats = getCategories();
  const filtered = cats.filter((c) => c !== name);
  safeSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
};

export const getScheduledPrices = (): ScheduledPrice[] => {
  return JSON.parse(
    safeGet(getBranchKey(STORAGE_KEYS.SCHEDULED_PRICES)) || "[]",
  );
};

export const addScheduledPrice = (scheduledPrice: ScheduledPrice) => {
  const prices = getScheduledPrices();
  safeSet(
    getBranchKey(STORAGE_KEYS.SCHEDULED_PRICES),
    JSON.stringify([...prices, scheduledPrice]),
  );
};

export const deleteScheduledPrice = (id: string) => {
  const prices = getScheduledPrices();
  safeSet(
    getBranchKey(STORAGE_KEYS.SCHEDULED_PRICES),
    JSON.stringify(prices.filter((p) => p.id !== id)),
  );
};

export const applyScheduledPrices = () => {
  if (!isClient) return;
  const scheduledPrices = getScheduledPrices();
  if (scheduledPrices.length === 0) return;

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const products = _getProductsRaw();
  const orders = getOrders();
  const receivables = getReceivables();

  let productsUpdated = false;
  let ordersUpdated = false;
  let receivablesUpdated = false;
  const remainingScheduled: ScheduledPrice[] = [];

  scheduledPrices.forEach((sp) => {
    if (sp.startDate <= today) {
      // 1. Update Current Product Price
      const product = products.find((p) => p.id === sp.productId);
      if (product) {
        product.price = sp.newPrice;
        productsUpdated = true;
      }

      // 2. Retroactive: Update Past Orders from startDate onwards
      orders.forEach((order) => {
        const orderDate = new Date(order.createdAt).toLocaleDateString("en-CA");
        if (orderDate >= sp.startDate) {
          // Point 2: Skip if already paid
          const receivable = receivables.find((r) => r.orderId === order.id);
          if (receivable?.isPaid) return;

          let orderTotalChanged = false;
          order.items.forEach((item) => {
            if (item.productId === sp.productId) {
              item.price = sp.newPrice;
              orderTotalChanged = true;
            }
          });

          if (orderTotalChanged) {
            const newTotal = order.items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0,
            );
            order.total = newTotal;
            ordersUpdated = true;

            // 3. Update associated Receivables
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
    safeSet(getBranchKey(STORAGE_KEYS.PRODUCTS), JSON.stringify(products));
  }
  if (ordersUpdated) {
    safeSet(getBranchKey(STORAGE_KEYS.ORDERS), JSON.stringify(orders));
  }
  if (receivablesUpdated) {
    safeSet(
      getBranchKey(STORAGE_KEYS.RECEIVABLES),
      JSON.stringify(receivables),
    );
  }

  if (productsUpdated || ordersUpdated || receivablesUpdated) {
    safeSet(
      getBranchKey(STORAGE_KEYS.SCHEDULED_PRICES),
      JSON.stringify(remainingScheduled),
    );
  }
};

export const getCurrentBranch = (): string => {
  const user = useAuthStore.getState().user;
  return user?.branch || "General";
};

const getBranchKey = (key: string, branch?: string): string => {
  const b = branch || getCurrentBranch();
  return `${key}_${b.toLowerCase()}`;
};

export const generateId = (prefix: string, branch?: string): string => {
  const b = branch || getCurrentBranch();
  const bCode = b.toUpperCase().substring(0, 3);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${bCode}-${timestamp}${random}`;
};

// Global data fetching for Super Admin
export const getGlobalOrders = (): (Order & { branch: string })[] => {
  let allOrders: (Order & { branch: string })[] = [];
  getBranches().forEach((branch) => {
    const orders: Order[] = JSON.parse(
      safeGet(getBranchKey(STORAGE_KEYS.ORDERS, branch)) || "[]",
    );
    allOrders = [...allOrders, ...orders.map((o) => ({ ...o, branch }))];
  });
  return allOrders;
};

export const getGlobalProducts = (): (Product & { branch: string })[] => {
  let allProducts: (Product & { branch: string })[] = [];
  getBranches().forEach((branch) => {
    const products: Product[] = JSON.parse(
      safeGet(getBranchKey(STORAGE_KEYS.PRODUCTS, branch)) || "[]",
    );
    allProducts = [...allProducts, ...products.map((p) => ({ ...p, branch }))];
  });
  return allProducts;
};

export const getGlobalStores = (): (Store & { branch: string })[] => {
  let allStores: (Store & { branch: string })[] = [];
  getBranches().forEach((branch) => {
    const stores: Store[] = JSON.parse(
      safeGet(getBranchKey(STORAGE_KEYS.STORES, branch)) || "[]",
    );
    allStores = [...allStores, ...stores.map((s) => ({ ...s, branch }))];
  });
  return allStores;
};

export const getGlobalReceivables = (): (Receivable & { branch: string })[] => {
  let allReceivables: (Receivable & { branch: string })[] = [];
  getBranches().forEach((branch) => {
    const receivables: Receivable[] = JSON.parse(
      safeGet(getBranchKey(STORAGE_KEYS.RECEIVABLES, branch)) || "[]",
    );
    allReceivables = [
      ...allReceivables,
      ...receivables.map((r) => ({ ...r, branch })),
    ];
  });
  return allReceivables;
};

export const getProductsByBranch = (branch: string): Product[] => {
  return JSON.parse(
    safeGet(getBranchKey(STORAGE_KEYS.PRODUCTS, branch)) || "[]",
  );
};

export const getStoresByBranch = (branch: string): Store[] => {
  return JSON.parse(safeGet(getBranchKey(STORAGE_KEYS.STORES, branch)) || "[]");
};

export const getOrdersByBranch = (branch: string): Order[] => {
  return JSON.parse(safeGet(getBranchKey(STORAGE_KEYS.ORDERS, branch)) || "[]");
};

export const addOrderByBranch = (order: Order, branch: string) => {
  const orders = getOrdersByBranch(branch);
  orders.push(order);
  safeSet(getBranchKey(STORAGE_KEYS.ORDERS, branch), JSON.stringify(orders));
};

export const initializeMockData = () => {
  if (!isClient) return;

  // ONE-TIME CLEANUP of test orders (requested by user)
  const cleanupFlag = localStorage.getItem("cleanup_orders_v1");
  if (!cleanupFlag) {
    getBranches().forEach((branch) => {
      safeSet(getBranchKey(STORAGE_KEYS.ORDERS, branch), JSON.stringify([]));
      safeSet(
        getBranchKey(STORAGE_KEYS.RECEIVABLES, branch),
        JSON.stringify([]),
      );
    });
    localStorage.setItem("cleanup_orders_v1", "true");
  }
  const INITIAL_PRODUCTS: Product[] = [
    {
      id: "F001",
      name: "Fiesta Chicken Nugget 500g",
      category: "Fiesta",
      stock: 120,
      price: 48500,
      totalIn: 200,
      totalOut: 80,
    },
    {
      id: "F002",
      name: "Fiesta Spicy Wing 500g",
      category: "Fiesta",
      stock: 85,
      price: 58000,
      totalIn: 150,
      totalOut: 65,
    },
    {
      id: "F003",
      name: "Fiesta Schnitzel 500g",
      category: "Fiesta",
      stock: 60,
      price: 51000,
      totalIn: 100,
      totalOut: 40,
    },
    {
      id: "F004",
      name: "Fiesta Chicken Stichel 500g",
      category: "Fiesta",
      stock: 95,
      price: 49000,
      totalIn: 150,
      totalOut: 55,
    },
    {
      id: "F005",
      name: "Fiesta Cheesy Lover 500g",
      category: "Fiesta",
      stock: 45,
      price: 62000,
      totalIn: 100,
      totalOut: 55,
    },
    {
      id: "F006",
      name: "Fiesta Bratwurst Sausage 500g",
      category: "Fiesta",
      stock: 110,
      price: 42000,
      totalIn: 200,
      totalOut: 90,
    },
    {
      id: "F007",
      name: "Fiesta Bakso Kuah 500g",
      category: "Fiesta",
      stock: 150,
      price: 25000,
      totalIn: 300,
      totalOut: 150,
    },
    {
      id: "F008",
      name: "Fiesta Karage 500g",
      category: "Fiesta",
      stock: 70,
      price: 55000,
      totalIn: 120,
      totalOut: 50,
    },
    {
      id: "S001",
      name: "Shifudo Fish Roll 500g",
      category: "Shifudo",
      stock: 95,
      price: 34500,
      totalIn: 150,
      totalOut: 55,
    },
    {
      id: "S002",
      name: "Shifudo Chikuwa 500g",
      category: "Shifudo",
      stock: 80,
      price: 31000,
      totalIn: 120,
      totalOut: 40,
    },
    {
      id: "S003",
      name: "Shifudo Crab Stick 500g",
      category: "Shifudo",
      stock: 55,
      price: 39500,
      totalIn: 100,
      totalOut: 45,
    },
    {
      id: "S004",
      name: "Shifudo Fish Ball 500g",
      category: "Shifudo",
      stock: 115,
      price: 29000,
      totalIn: 180,
      totalOut: 65,
    },
    {
      id: "S005",
      name: "Shifudo Shrimp Roll 500g",
      category: "Shifudo",
      stock: 40,
      price: 45000,
      totalIn: 80,
      totalOut: 40,
    },
  ];

  getBranches().forEach((branch) => {
    const productsKey = getBranchKey(STORAGE_KEYS.PRODUCTS, branch);
    const storesKey = getBranchKey(STORAGE_KEYS.STORES, branch);
    const ordersKey = getBranchKey(STORAGE_KEYS.ORDERS, branch);
    const receivablesKey = getBranchKey(STORAGE_KEYS.RECEIVABLES, branch);

    if (!safeGet(productsKey)) {
      // Try to find an existing branch to use as a template for products/prices
      const otherBranches = getBranches().filter((b) => b !== branch);
      let templateProducts = INITIAL_PRODUCTS;

      for (const other of otherBranches) {
        const otherKey = getBranchKey(STORAGE_KEYS.PRODUCTS, other);
        const otherData = safeGet(otherKey);
        if (otherData) {
          const parsed = JSON.parse(otherData);
          if (parsed.length > 0) {
            // Use existing branch data but reset stock
            templateProducts = parsed.map((p: Product) => ({
              ...p,
              stock: 0,
              totalIn: 0,
              totalOut: 0,
            }));
            break;
          }
        }
      }
      safeSet(productsKey, JSON.stringify(templateProducts));
    }

    if (!safeGet(storesKey)) {
      safeSet(
        storesKey,
        JSON.stringify([
          {
            id: `STR-${branch.toUpperCase().substring(0, 3)}-${Math.floor(
              Math.random() * 1000,
            )
              .toString()
              .padStart(3, "0")}`,
            name: `Toko Berkah ${branch}`,
            branch: branch,
            totalDebt: 0,
          },
          {
            id: `STR-${branch.toUpperCase().substring(0, 3)}-${Math.floor(
              Math.random() * 1000,
            )
              .toString()
              .padStart(3, "0")}`,
            name: `Warung Maju ${branch}`,
            branch: branch,
            totalDebt: 0,
          },
        ]),
      );
    }

    if (!safeGet(ordersKey)) safeSet(ordersKey, JSON.stringify([]));
    if (!safeGet(receivablesKey)) safeSet(receivablesKey, JSON.stringify([]));
  });
};

// Internal raw getter to avoid recursion
const _getProductsRaw = (): Product[] => {
  return JSON.parse(safeGet(getBranchKey(STORAGE_KEYS.PRODUCTS)) || "[]");
};

export const getProducts = (): Product[] => {
  // Point 1: Auto-apply scheduled prices when getting products
  const prices = getScheduledPrices();
  if (
    isClient &&
    prices.some((p) => p.startDate <= new Date().toLocaleDateString("en-CA"))
  ) {
    applyScheduledPrices();
  }
  return _getProductsRaw();
};

export const updateProduct = (product: Product, targetBranch?: string) => {
  const currentBranch = targetBranch || getCurrentBranch();

  // Point 4: Enforce consistency
  const oldProducts = targetBranch
    ? getProductsByBranch(targetBranch)
    : _getProductsRaw();
  const oldProduct = oldProducts.find((p) => p.id === product.id);

  if (
    oldProduct &&
    Number(product.stock) !==
      Number(oldProduct.totalIn) - Number(oldProduct.totalOut)
  ) {
    product.totalIn = Number(product.stock) + Number(product.totalOut);
  } else {
    product.stock = Number(product.totalIn) - Number(product.totalOut);
  }

  if (product.stock < 0) product.stock = 0;

  // 1. Update target branch
  const branchKey = getBranchKey(STORAGE_KEYS.PRODUCTS, targetBranch);
  const branchProducts = targetBranch
    ? getProductsByBranch(targetBranch)
    : _getProductsRaw();
  const index = branchProducts.findIndex((p) => p.id === product.id);

  if (index !== -1) {
    branchProducts[index] = product;
    safeSet(branchKey, JSON.stringify(branchProducts));
  }

  // 2. Sync Name and Price to ALL other branches (keep their own stock)
  getBranches().forEach((branch) => {
    if (branch === currentBranch) return; // skip target branch

    const branchKey = getBranchKey(STORAGE_KEYS.PRODUCTS, branch);
    const branchProducts: Product[] = JSON.parse(safeGet(branchKey) || "[]");
    const bIndex = branchProducts.findIndex((p) => p.id === product.id);

    if (bIndex !== -1) {
      branchProducts[bIndex] = {
        ...branchProducts[bIndex],
        name: product.name,
        price: product.price,
        category: product.category,
      };
      safeSet(branchKey, JSON.stringify(branchProducts));
    }
  });
};

export const addProduct = (product: Product) => {
  // Add to ALL branches with 0 stock in others
  getBranches().forEach((branch) => {
    const branchKey = getBranchKey(STORAGE_KEYS.PRODUCTS, branch);
    const branchProducts: Product[] = JSON.parse(safeGet(branchKey) || "[]");

    // Check if product already exists to avoid duplicates
    if (!branchProducts.find((p) => p.id === product.id)) {
      const isCurrentBranch = branch === getCurrentBranch();
      const finalProduct = {
        ...product,
        stock: isCurrentBranch ? product.totalIn - product.totalOut : 0,
        totalIn: isCurrentBranch ? product.totalIn : 0,
        totalOut: isCurrentBranch ? product.totalOut : 0,
      };
      if (finalProduct.stock < 0) finalProduct.stock = 0;
      branchProducts.push(finalProduct);
      safeSet(branchKey, JSON.stringify(branchProducts));
    }
  });
};

export const deleteProduct = (productId: string) => {
  // Delete from ALL branches
  getBranches().forEach((branch) => {
    const branchKey = getBranchKey(STORAGE_KEYS.PRODUCTS, branch);
    const branchProducts: Product[] = JSON.parse(safeGet(branchKey) || "[]");
    const updatedProducts = branchProducts.filter((p) => p.id !== productId);
    safeSet(branchKey, JSON.stringify(updatedProducts));
  });
};

export const getOrders = (): Order[] => {
  return JSON.parse(safeGet(getBranchKey(STORAGE_KEYS.ORDERS)) || "[]");
};

export const addOrder = (order: Order, branch?: string) => {
  // 1. Save the order
  const orders = branch ? getOrdersByBranch(branch) : getOrders();
  orders.push(order);
  safeSet(getBranchKey(STORAGE_KEYS.ORDERS, branch), JSON.stringify(orders));

  // 2. Deduct stock from the correct branch
  const branchKey = getBranchKey(STORAGE_KEYS.PRODUCTS, branch);
  const products: Product[] = JSON.parse(safeGet(branchKey) || "[]");

  order.items.forEach((item) => {
    const productIndex = products.findIndex((p) => p.id === item.productId);
    if (productIndex !== -1) {
      // Point 4: Maintain consistency
      products[productIndex].totalOut =
        Number(products[productIndex].totalOut) + Number(item.quantity);
      products[productIndex].stock =
        Number(products[productIndex].totalIn) -
        Number(products[productIndex].totalOut);
      if (products[productIndex].stock < 0) products[productIndex].stock = 0;
    }
  });

  safeSet(branchKey, JSON.stringify(products));

  // 3. Update Store Debt
  const storesKey = getBranchKey(STORAGE_KEYS.STORES, branch);
  const stores: Store[] = JSON.parse(safeGet(storesKey) || "[]");
  const storeIndex = stores.findIndex((s) => s.id === order.storeId);
  if (storeIndex !== -1) {
    stores[storeIndex].totalDebt =
      (Number(stores[storeIndex].totalDebt) || 0) + Number(order.total);
    safeSet(storesKey, JSON.stringify(stores));
  }
};

export const updateOrder = (orderId: string, updates: Partial<Order>) => {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...updates };
    safeSet(getBranchKey(STORAGE_KEYS.ORDERS), JSON.stringify(orders));
  }
};

export const getReceivables = (): Receivable[] => {
  return JSON.parse(safeGet(getBranchKey(STORAGE_KEYS.RECEIVABLES)) || "[]");
};

export const addReceivable = (receivable: Receivable, branch?: string) => {
  const receivables = branch
    ? JSON.parse(
        safeGet(getBranchKey(STORAGE_KEYS.RECEIVABLES, branch)) || "[]",
      )
    : getReceivables();
  receivables.push(receivable);
  safeSet(
    getBranchKey(STORAGE_KEYS.RECEIVABLES, branch),
    JSON.stringify(receivables),
  );
};

export const updateReceivable = (
  id: string,
  isPaid: boolean,
  branch?: string,
) => {
  const branchKey = getBranchKey(STORAGE_KEYS.RECEIVABLES, branch);
  const receivables: Receivable[] = JSON.parse(safeGet(branchKey) || "[]");
  const index = receivables.findIndex((r) => r.id === id);

  if (index !== -1) {
    const receivable = receivables[index];
    const wasPaid = receivable.isPaid;
    receivable.isPaid = isPaid;
    safeSet(branchKey, JSON.stringify(receivables));

    // If status changed to paid, decrease store debt
    if (!wasPaid && isPaid) {
      const storesKey = getBranchKey(STORAGE_KEYS.STORES, branch);
      const stores: Store[] = JSON.parse(safeGet(storesKey) || "[]");
      const storeIndex = stores.findIndex((s) => s.id === receivable.storeId);
      if (storeIndex !== -1) {
        stores[storeIndex].totalDebt = Math.max(
          0,
          (Number(stores[storeIndex].totalDebt) || 0) -
            Number(receivable.amount),
        );
        safeSet(storesKey, JSON.stringify(stores));
      }
    }
  }
};

export const getStores = (): Store[] => {
  return JSON.parse(safeGet(getBranchKey(STORAGE_KEYS.STORES)) || "[]");
};

export const addStore = (store: Store, branch?: string) => {
  const branchKey = getBranchKey(STORAGE_KEYS.STORES, branch);
  const stores = JSON.parse(safeGet(branchKey) || "[]");
  stores.push(store);
  safeSet(branchKey, JSON.stringify(stores));
};

export const updateStore = (store: Store, branch?: string) => {
  const branchKey = getBranchKey(STORAGE_KEYS.STORES, branch);
  const stores: Store[] = JSON.parse(safeGet(branchKey) || "[]");
  const index = stores.findIndex((s) => s.id === store.id);
  if (index !== -1) {
    stores[index] = store;
    safeSet(branchKey, JSON.stringify(stores));
  }
};

export const deleteStore = (id: string, branch?: string) => {
  const branchKey = getBranchKey(STORAGE_KEYS.STORES, branch);
  const stores: Store[] = JSON.parse(safeGet(branchKey) || "[]");
  const updatedStores = stores.filter((s) => s.id !== id);
  safeSet(branchKey, JSON.stringify(updatedStores));
};

export const getCurrentStore = (): string => {
  return safeGet(getBranchKey(STORAGE_KEYS.CURRENT_STORE)) || "S001";
};

export const setCurrentStore = (storeId: string) => {
  safeSet(getBranchKey(STORAGE_KEYS.CURRENT_STORE), storeId);
};

export const getCart = (): Array<{ productId: string; quantity: number }> => {
  return JSON.parse(
    localStorage.getItem(getBranchKey(STORAGE_KEYS.CART)) || "[]",
  );
};

export const updateCart = (
  cart: Array<{ productId: string; quantity: number }>,
) => {
  localStorage.setItem(getBranchKey(STORAGE_KEYS.CART), JSON.stringify(cart));
};

export const clearCart = () => {
  localStorage.setItem(getBranchKey(STORAGE_KEYS.CART), JSON.stringify([]));
};

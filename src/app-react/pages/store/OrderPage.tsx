import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  ShoppingCart,
  X,
  Store,
  MapPin,
  Calendar,
} from "lucide-react";
import { api } from "../../utils/apiClient";
import { toast, Toaster } from "sonner";
import { useAuthStore } from "../../../store/useAuthStore";
import { useCartStore } from "../../../store/useCartStore";
import { useAppStore } from "../../../store/useAppStore";
import { useNavigate } from "../../router-compat";

export default function OrderPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.branch === "Pusat";
  const activeBranch = useAppStore((state) => state.activeBranch);
  const selectedCategory = useAppStore((state) => state.selectedCategory);
  const setActiveBranch = useAppStore((state) => state.setActiveBranch);
  const setSelectedCategory = useAppStore((state) => state.setSelectedCategory);

  const effectiveBranch = isSuperAdmin
    ? (activeBranch === "all" ? "" : (activeBranch || ""))
    : user?.branch || "Palembang";

  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productCache, setProductCache] = useState<Map<string, any>>(new Map());
  const [stores, setStores] = useState<any[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const itemsPerPage = 20;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const cart = useCartStore((state) => state.cart);
  const setCurrentBranch = useCartStore((state) => state.setCurrentBranch);
  const addItem = useCartStore((state) => state.addItem);
  const setCartQuantity = useCartStore((state) => state.setQuantity);
  const decreaseCartQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeCartItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const [showCart, setShowCart] = useState(false);
  const [selectedStore, setSelectedStore] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentBranch(effectiveBranch);
  }, [effectiveBranch, setCurrentBranch]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setStores([]);
    let storesRes: any[] = [];
    let branchesRes: any = { branches: [] };
    let categoriesRes: any = { categories: [] };

    if (effectiveBranch) {
      try {
        storesRes = await api.get<any[]>(`/api/stores?branch=${encodeURIComponent(effectiveBranch)}&t=${Date.now()}`);
      } catch (error: any) {
        toast.error("Gagal memuat toko: " + (error.message || "Error"));
      }
    }

    try {
      branchesRes = await api.get<any>(`/api/branches?t=${Date.now()}`);
    } catch (error: any) {
      console.error("Gagal memuat cabang:", error);
    }

    try {
      categoriesRes = await api.get<any>(`/api/categories?t=${Date.now()}`);
    } catch (error: any) {
      console.error("Gagal memuat kategori:", error);
    }

    setStores(Array.isArray(storesRes) ? storesRes : []);

    // Ensure branches and categories format aligns with backend response
    const branchList = branchesRes?.branches ? branchesRes.branches.map((b: any) => b.name || b).filter((b: string) => b !== 'Pusat') : [];
    setBranches(branchList);

    const catList = categoriesRes?.categories ? categoriesRes.categories.map((c: any) => c.name || c) : [];
    setCategories(catList);

    if (catList.length > 0) {
      if (!selectedCategory || !catList.includes(selectedCategory)) {
        setSelectedCategory(catList[0]);
      }
    }

    setIsLoading(false);
  };

  const fetchProducts = async () => {
    if (!effectiveBranch) return;
    setIsProductsLoading(true);
    try {
      const categoryQuery = selectedCategory && selectedCategory !== 'Semua Kategori' ? `&category=${encodeURIComponent(selectedCategory)}` : '';
      const searchQueryParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';

      const res = await api.get<any>(`/api/products?branch=${encodeURIComponent(effectiveBranch)}&page=${currentPage}&limit=${itemsPerPage}${categoryQuery}${searchQueryParam}&t=${Date.now()}`);

      let productsData = [];
      let pages = 1;

      if (res && res.data) {
        productsData = res.data;
        pages = res.totalPages || 1;
      } else if (Array.isArray(res)) {
        productsData = res;
      }

      const mappedProducts = productsData.map((p: any) => ({
        ...p,
        categoryName: p.categoryName || p.category,
        stock: p.stock !== undefined ? p.stock : (p.stockItems?.[0] ? (p.stockItems[0].totalIn - p.stockItems[0].totalOut) : 0)
      }));

      setProducts(mappedProducts);
      setTotalPages(pages);

      // Update cache
      setProductCache(prev => {
        const next = new Map(prev);
        mappedProducts.forEach((p: any) => next.set(p.id, p));
        return next;
      });

    } catch (error: any) {
      toast.error("Gagal memuat produk: " + (error.message || "Error"));
    } finally {
      setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    clearCart();
    setSelectedStore("");
    setDraftQuantities({});
    setProductCache(new Map());
  }, [effectiveBranch]);

  useEffect(() => {
    fetchProducts();
  }, [effectiveBranch, selectedCategory, currentPage, debouncedSearch]);

  const handleStoreChange = (storeId: string) => {
    if (!storeId) {
      setSelectedStore("");
      return;
    }
    setSelectedStore(storeId);
    clearCart();
    toast.success("Toko berhasil dipilih");
  };

  const addToCart = (productId: string) => {
    if (!selectedStore) {
      toast.error("Silakan pilih toko terlebih dahulu!");
      return;
    }
    const product = productCache.get(productId);
    if (!product || product.stock === 0) return;

    // Check if cart already has items from a different category
    if (cart.length > 0) {
      const firstItem = productCache.get(cart[0].productId);
      if (firstItem && product.categoryName && firstItem.categoryName?.toLowerCase() !== product.categoryName.toLowerCase()) {
        toast.warning("Keranjang Terkunci", {
          description: "Tidak bisa menggabung kategori dalam satu bon.",
          duration: 5000,
        });
        return;
      }
    }

    const existingItem = cart.find((item) => item.productId === productId);
    const currentQty = existingItem?.quantity || 0;

    if (currentQty >= product.stock) {
      toast.error("Stok Habis!", {
        description: `Sisa stok untuk ${product.name} hanya ${product.stock} pcs.`,
      });
      return;
    }

    addItem(productId);
  };

  const decreaseQuantity = (productId: string) => {
    decreaseCartQuantity(productId);
  };

  const commitQuantity = (
    productId: string,
    rawValue: string,
    stock: number,
  ) => {
    const trimmedValue = rawValue.trim();

    if (trimmedValue === "") {
      setDraftQuantities((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
      removeCartItem(productId);
      return;
    }

    const parsedQuantity = Number(trimmedValue);
    if (Number.isNaN(parsedQuantity)) return;

    if (parsedQuantity <= 0) {
      setDraftQuantities((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
      removeCartItem(productId);
      return;
    }

    const safeQuantity = Math.min(stock, Math.floor(parsedQuantity));
    setDraftQuantities((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setCartQuantity(productId, safeQuantity);
  };

  const handleQuantityFocus = (productId: string, value: number) =>
    (event: React.FocusEvent<HTMLInputElement>) => {
      setDraftQuantities((current) => ({
        ...current,
        [productId]: current[productId] ?? String(value),
      }));
      event.currentTarget.select();
    };

  const handleQuantityChange = (productId: string) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      if (rawValue === "") {
        setDraftQuantities((current) => ({
          ...current,
          [productId]: "",
        }));
        return;
      }

      if (!/^\d+$/.test(rawValue)) return;

      setDraftQuantities((current) => ({
        ...current,
        [productId]: rawValue,
      }));
    };

  const handleQuantityBlur = (productId: string, stock: number) =>
    (event: React.FocusEvent<HTMLInputElement>) => {
      commitQuantity(productId, event.target.value, stock);
    };

  const removeFromCart = (productId: string) => {
    removeCartItem(productId);
    setDraftQuantities((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const getCartQuantity = (productId: string) => {
    return cart.find((item) => item.productId === productId)?.quantity || 0;
  };

  const cartTotal = cart.reduce((sum, item) => {
    const product = productCache.get(item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const getProductUnitsPerCarton = (productId: string) => {
    const product = allProducts.find((p) => p.id === productId);
    return Number(product?.unitsPerCarton) || 0;
  };

  const getCartDisplayValues = (productId: string, quantity: number) => {
    const unitsPerCarton = getProductUnitsPerCarton(productId);
    if (unitsPerCarton <= 0) {
      return { unitsPerCarton: 0, cartons: 0, units: quantity };
    }

    return {
      unitsPerCarton,
      cartons: Math.floor(quantity / unitsPerCarton),
      units: quantity % unitsPerCarton,
    };
  };

  const updateCartQuantity = (productId: string, nextQuantity: number, stock: number) => {
    const safeQuantity = Math.max(0, Math.min(stock, Math.floor(nextQuantity)));
    if (safeQuantity <= 0) {
      removeCartItem(productId);
      setDraftQuantities((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
      return;
    }

    setDraftQuantities((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setCartQuantity(productId, safeQuantity);
  };

  const handleCartonQuantityChange = (
    productId: string,
    cartonValue: string,
    stock: number,
  ) => {
    const unitsPerCarton = getProductUnitsPerCarton(productId);
    if (unitsPerCarton <= 0) return;

    const parsedCarton = Number(cartonValue);
    if (Number.isNaN(parsedCarton)) return;

    const currentQuantity = getCartQuantity(productId);
    const currentUnits = currentQuantity % unitsPerCarton;
    updateCartQuantity(
      productId,
      (Math.max(0, Math.floor(parsedCarton)) * unitsPerCarton) + currentUnits,
      stock,
    );
  };

  const handleUnitQuantityChange = (
    productId: string,
    unitValue: string,
    stock: number,
  ) => {
    const unitsPerCarton = getProductUnitsPerCarton(productId);
    const parsedUnit = Number(unitValue);
    if (Number.isNaN(parsedUnit)) return;

    const currentQuantity = getCartQuantity(productId);
    const currentCartons = unitsPerCarton > 0
      ? Math.floor(currentQuantity / unitsPerCarton)
      : 0;
    updateCartQuantity(
      productId,
      (currentCartons * unitsPerCarton) + Math.max(0, Math.floor(parsedUnit)),
      stock,
    );
  };

  const handleUnitQuantityStep = (
    productId: string,
    delta: number,
    stock: number,
  ) => {
    const currentQuantity = getCartQuantity(productId);
    updateCartQuantity(productId, currentQuantity + delta, stock);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || isSubmitting) {
      if (cart.length === 0) toast.error("Keranjang kosong");
      return;
    }
    if (!selectedStore) {
      toast.error("Silakan pilih toko terlebih dahulu");
      return;
    }
    if (!invoiceNumber.trim()) {
      toast.error("Silakan masukkan nomor faktur");
      return;
    }

    const store = stores.find((s) => s.id === selectedStore);
    const orderId = invoiceNumber.trim();
    const orderBranch = effectiveBranch;

    const orderItems = cart.map((item) => {
      const product = productCache.get(item.productId);
      return {
        productId: item.productId,
        productName: product?.name || "",
        quantity: item.quantity,
        price: product?.price || 0,
      };
    });

    const newOrder = {
      id: orderId,
      storeId: selectedStore,
      storeName: store?.name || "",
      branch: orderBranch,
      items: orderItems,
      total: cartTotal,
      createdAt: new Date(orderDate).toISOString(),
    };

    let toastId;
    try {
      setIsSubmitting(true);
      toastId = toast.loading("Sedang memproses pesanan...");
      await api.post('/api/orders', newOrder);
      toast.success("Pesanan Berhasil Dibuat!", {
        id: toastId,
        description: "Nomor Faktur: " + invoiceNumber,
        action: {
          label: "Lihat Riwayat",
          onClick: () => navigate("/admin/history"),
        },
      });

      clearCart();
      setShowCart(false);
      setInvoiceNumber("");
      setOrderDate(new Date().toLocaleDateString("en-CA"));
      setDraftQuantities({});

      // Refresh produk agar sisa stok terbaru tampil
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan pesanan. Silakan coba lagi.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cartCategory =
    cart.length > 0
      ? productCache.get(cart[0].productId)?.categoryName
      : null;

  const getDisplayQuantity = (productId: string, fallbackQuantity: number) =>
    draftQuantities[productId] ?? String(fallbackQuantity);

  return (
    <>
      <Toaster position="top-center" richColors expand={true} />
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Katalog Produk
            </h1>
            <p className="text-gray-600 mt-1">
              Pilih kategori dan produk untuk dipesan
            </p>
          </div>

          {/* Mode Pusat: Pilih Cabang */}
          {isSuperAdmin && (
            <div className="flex-1 max-w-md bg-blue-50 border border-blue-100 p-1 rounded-xl flex">
              {branches.map((branch) => (
                <button
                  key={branch}
                  onClick={() => {
                    setActiveBranch(branch);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${effectiveBranch === branch
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-blue-600 hover:bg-blue-100/50"
                    }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Store className="w-5 h-5 text-gray-600" />
              )}
              <select
                value={selectedStore}
                onChange={(e) => handleStoreChange(e.target.value)}
                disabled={isLoading || (isSuperAdmin && !effectiveBranch)}
                className="border-none outline-none bg-transparent text-gray-900 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{isLoading ? "Memuat Toko..." : "Pilih Toko..."}</option>
                {!isLoading && stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className={`relative px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-sm font-medium ${cart.length > 0
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-default"
                }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-sm font-bold">
                  Keranjang ({cart.length})
                </span>
                {selectedStore && (
                  <span className="text-[10px] opacity-80 truncate max-w-[120px]">
                    {stores.find((s) => s.id === selectedStore)?.name}
                  </span>
                )}
              </div>
              {cartCategory && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full border-2 border-white font-bold uppercase">
                  {cartCategory}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-full overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${selectedCategory && cat.toLowerCase() === selectedCategory.toLowerCase()
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                  } ${cartCategory && cartCategory.toLowerCase() !== cat.toLowerCase() ? "opacity-50" : ""}`}
              >
                {cat.toUpperCase()}
                {cartCategory && cartCategory.toLowerCase() === cat.toLowerCase() && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </motion.button>
            ))}
          </div>

          {cartCategory && selectedCategory && cartCategory.toLowerCase() !== selectedCategory.toLowerCase() && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-orange-800 font-medium">
                  Keranjang Terkunci ke {cartCategory}
                </p>
                <p className="text-orange-600 text-sm mt-0.5">
                  Anda tidak dapat menambahkan produk {selectedCategory} karena
                  keranjang sudah berisi produk {cartCategory}. Selesaikan
                  pesanan atau kosongkan keranjang untuk mengganti kategori.
                </p>
              </div>
              <button
                onClick={() => {
                  if (
                    confirm("Kosongkan keranjang untuk mengganti kategori?")
                  ) {
                    clearCart();
                  }
                }}
                className="text-orange-700 font-semibold text-sm hover:underline"
              >
                Kosongkan Keranjang
              </button>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {/* Wrapper relative: katalog + overlay "Pilih Toko" ditumpuk di sini */}
        <div className={`relative w-full rounded-2xl ${!selectedStore ? "h-[450px] overflow-hidden" : "min-h-[400px]"}`}>

          {/* Katalog produk ΓÇö blur & non-interaktif saat belum pilih toko */}
          <motion.div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-all duration-300 ${!selectedStore ? "blur-[2.8px] pointer-events-none select-none" : ""
              }`}
          >
            <AnimatePresence mode="popLayout">
              {products.map((product) => {
                const inCart = getCartQuantity(product.id);
                const isRestricted = !!(
                  cartCategory && product.categoryName && cartCategory.toLowerCase() !== product.categoryName.toLowerCase()
                );

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={product.id}
                    className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden group ${isRestricted
                        ? "opacity-60 grayscale-[0.5] border-gray-100"
                        : "border-gray-200 hover:shadow-md hover:border-blue-200"
                      }`}
                  >
                    <div className="p-6">
                      <div className="mb-4 flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                            {product.categoryName}
                          </p>
                          <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-2xl font-black text-gray-900">
                          <span className="text-sm font-normal text-gray-500 mr-1">
                            Rp
                          </span>
                          {product.price.toLocaleString("id-ID")}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className={`w-2 h-2 rounded-full ${product.stock > 20 ? "bg-green-500" : "bg-red-500"}`}
                          />
                          <p className="text-xs text-gray-500 font-medium">
                            Stok: {product.stock} pcs
                          </p>
                        </div>
                      </div>

                      {product.stock > 0 ? (
                        <div className="flex items-center gap-3">
                          {inCart > 0 ? (
                            <div className="flex items-center gap-3 flex-1 bg-blue-50 p-1.5 rounded-xl border border-blue-100">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => decreaseQuantity(product.id)}
                                className="bg-white text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
                              >
                                <Minus className="w-4 h-4" />
                              </motion.button>
                              <input
                                type="number"
                                min={0}
                                max={product.stock}
                                value={getDisplayQuantity(product.id, inCart)}
                                onFocus={handleQuantityFocus(product.id, inCart)}
                                onChange={handleQuantityChange(product.id)}
                                onBlur={handleQuantityBlur(product.id, product.stock)}
                                className="font-bold text-blue-700 flex-1 text-center text-lg bg-transparent border-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                aria-label={`Jumlah ${product.name}`}
                              />
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => addToCart(product.id)}
                                className="bg-white text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
                              >
                                <Plus className="w-4 h-4" />
                              </motion.button>
                            </div>
                          ) : (
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => addToCart(product.id)}
                              disabled={isRestricted}
                              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${isRestricted
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                                }`}
                            >
                              <Plus className="w-5 h-5" />
                              Tambah Ke Bon
                            </motion.button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-3 bg-gray-50 rounded-xl text-gray-400 font-bold text-sm">
                          STOK HABIS
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

<<<<<<< HEAD
  {/* Overlay "Pilih Toko Dahulu" ΓÇö tetap tampil selama belum memilih toko */ }
=======
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pb-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 font-medium"
              >
                Sebelumnya
              </button>
              <span className="font-medium text-gray-600">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 font-medium"
              >
                Selanjutnya
              </button>
            </div>
          )}

          {/* Overlay "Pilih Toko Dahulu" – tetap tampil selama belum memilih toko */}
>>>>>>> main
  {
    !selectedStore && (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl">
        <div className="bg-white p-6 rounded-2xl shadow-2xl border border-blue-100 flex flex-col items-center text-center max-w-sm mx-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            {isLoading ? (
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Store className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isLoading ? "Memuat Data..." : isSuperAdmin && !effectiveBranch ? "Pilih Cabang Dahulu" : "Pilih Toko Dahulu"}
          </h3>
          <p className="text-gray-500 text-sm">
            {isLoading ? "Sedang menyinkronkan data toko dan produk..." : isSuperAdmin && !effectiveBranch
              ? "Silakan pilih cabang pada menu di atas untuk memuat daftar toko."
              : "Silakan pilih toko pada menu di atas untuk mulai melihat stok dan melakukan pemesanan."}
          </p>
        </div>
      </div>
    )
  }
        </div >
      </div >

    <AnimatePresence>
      {showCart && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-lg max-h-screen md:max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">
                Keranjang Belanja
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-blue-50/50">
              <div className="mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-800">
                  Pesanan Untuk:{" "}
                  <span className="font-bold text-blue-700 text-lg ml-1">
                    {stores.find((s) => s.id === selectedStore)?.name ||
                      "Pilih Toko..."}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Faktur
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nomor faktur (contoh: FKT-001)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Pesanan
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Keranjang kosong
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const product = productCache.get(item.productId);
                    if (!product) return null;

                    const displayValues = getCartDisplayValues(item.productId, item.quantity);
                    const isCartonFrozen = displayValues.unitsPerCarton <= 0;

                    return (
                      <div
                        key={item.productId}
                        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full bg-gray-50 p-4 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Rp {product.price.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            (Isi {displayValues.unitsPerCarton} unit/karton)
                          </p>
                        </div>
                        <div className="flex items-center gap-6 flex-wrap md:flex-nowrap md:justify-end">
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase">
                              Karton
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={displayValues.cartons}
                              onChange={(event) =>
                                handleCartonQuantityChange(
                                  item.productId,
                                  event.target.value,
                                  product.stock,
                                )
                              }
                              disabled={isCartonFrozen}
                              readOnly={isCartonFrozen}
                              className="font-medium w-14 text-center text-base bg-white border border-gray-300 rounded-lg px-2 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              aria-label={`Jumlah karton ${product.name}`}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase">
                              Unit
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleUnitQuantityStep(
                                    item.productId,
                                    -1,
                                    product.stock,
                                  )
                                }
                                className="bg-white p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-gray-100 border border-gray-200 shrink-0"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={displayValues.unitsPerCarton > 0 ? displayValues.unitsPerCarton - 1 : product.stock}
                                value={displayValues.units}
                                onChange={(event) =>
                                  handleUnitQuantityChange(
                                    item.productId,
                                    event.target.value,
                                    product.stock,
                                  )
                                }
                                className="font-medium w-14 shrink-0 text-center text-base bg-white border border-gray-300 rounded-lg px-2 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                aria-label={`Jumlah unit ${product.name}`}
                              />
                              <button
                                onClick={() =>
                                  handleUnitQuantityStep(
                                    item.productId,
                                    1,
                                    product.stock,
                                  )
                                }
                                className="bg-white p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-gray-100 border border-gray-200 shrink-0"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="text-right min-w-[100px] shrink-0 font-semibold text-gray-900 whitespace-nowrap">
                            Rp {(product.price * item.quantity).toLocaleString("id-ID")}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-600 hover:text-red-700 shrink-0"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium text-gray-700">
                  Total
                </span>
                <span className="text-2xl font-semibold text-gray-900">
                  Rp {cartTotal.toLocaleString("id-ID")}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  "Checkout"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}

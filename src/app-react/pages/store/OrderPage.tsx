import { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, ShoppingCart, X, Store as StoreIcon, MapPin, Calendar } from 'lucide-react';
import { getCart, updateCart, clearCart, addOrder, getStoresByBranch, getProductsByBranch, getBranches, getCategories, Product, Store } from '../../utils/mockData';
import { toast, Toaster } from 'sonner';

export default function OrderPage() {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.branch === 'Pusat';

  const [activeBranch, setActiveBranch] = useState<string>('');
  const [branches, setBranches] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize branches and branch selection
  useEffect(() => {
    const init = async () => {
      try {
        if (isSuperAdmin) {
          const list = await getBranches();
          setBranches(list);
          setActiveBranch(list[0] || 'Palembang');
        } else {
          setActiveBranch(user?.branch || 'Palembang');
        }
      } catch (err: any) {
        toast.error('Gagal memuat daftar cabang: ' + err.message);
      }
    };
    init();
  }, [isSuperAdmin, user?.branch]);

  // Load products, stores, categories and local cart
  const loadBranchDetails = useCallback(async () => {
    if (!activeBranch) return;
    setIsLoading(true);
    try {
      const [prodData, storeData, catData] = await Promise.all([
        getProductsByBranch(activeBranch),
        getStoresByBranch(activeBranch),
        getCategories()
      ]);

      setAllProducts(prodData);
      setStores(storeData);
      setCategories(catData);
      setCart(getCart());

      if (catData.length > 0) {
        setSelectedCategory(catData[0]);
      }
      setSelectedStore('');
    } catch (err: any) {
      toast.error('Gagal memuat detail katalog: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeBranch]);

  useEffect(() => {
    loadBranchDetails();
  }, [loadBranchDetails]);

  // Keep products list filtered based on category
  useEffect(() => {
    if (selectedCategory) {
      setProducts(allProducts.filter(p => p.category === selectedCategory));
    } else {
      setProducts(allProducts);
    }
  }, [selectedCategory, allProducts]);

  // Sync cart state with local storage
  useEffect(() => {
    updateCart(cart);
  }, [cart]);

  const handleStoreChange = (storeId: string) => {
    if (!storeId) {
      setSelectedStore('');
      return;
    }
    setSelectedStore(storeId);
    clearCart();
    setCart([]);
    toast.success('Toko berhasil dipilih');
  };

  const addToCart = (productId: string) => {
    if (!selectedStore) {
      toast.error('Silakan pilih toko terlebih dahulu!');
      return;
    }
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stock === 0) return;

    // Check if cart already has items from a different category
    if (cart.length > 0) {
      const firstItem = allProducts.find(p => p.id === cart[0].productId);
      if (firstItem && firstItem.category !== product.category) {
        toast.error(`Maaf, produk ${product.category} tidak boleh digabung dengan ${firstItem.category} dalam satu bon belanja.`);
        return;
      }
    }

    const existingItem = cart.find(item => item.productId === productId);
    const currentQty = existingItem?.quantity || 0;

    if (currentQty >= product.stock) {
      toast.error('Stok tidak mencukupi');
      return;
    }

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { productId, quantity: 1 }]);
    }
  };

  const decreaseQuantity = (productId: string) => {
    const existingItem = cart.find(item => item.productId === productId);
    if (!existingItem) return;

    if (existingItem.quantity === 1) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const getCartQuantity = (productId: string) => {
    return cart.find(item => item.productId === productId)?.quantity || 0;
  };

  const cartTotal = cart.reduce((sum, item) => {
    const product = allProducts.find(p => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }
    if (!invoiceNumber.trim()) {
      toast.error('Silakan masukkan nomor faktur');
      return;
    }

    const store = stores.find(s => s.id === selectedStore);
    const orderId = invoiceNumber.trim();
    const orderBranch = isSuperAdmin ? activeBranch : user?.branch || 'Palembang';

    const orderItems = cart.map(item => {
      const product = allProducts.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || '',
        quantity: item.quantity,
        price: product?.price || 0,
      };
    });

    const newOrder = {
      id: orderId,
      storeId: selectedStore,
      storeName: store?.name || '',
      branch: orderBranch,
      items: orderItems,
      total: cartTotal,
      createdAt: new Date(orderDate).toISOString(),
    };

    try {
      await addOrder(newOrder, orderBranch);
      clearCart();
      setCart([]);
      setShowCart(false);
      setInvoiceNumber('');
      setOrderDate(new Date().toISOString().split('T')[0]);
      toast.success('Pesanan berhasil dibuat!');
      loadBranchDetails();
    } catch (err: any) {
      toast.error('Gagal membuat pesanan: ' + err.message);
    }
  };

  const cartCategory = cart.length > 0 
    ? allProducts.find(p => p.id === cart[0].productId)?.category 
    : null;

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Katalog Produk</h1>
            <p className="text-gray-600 mt-1">Pilih kategori dan produk untuk dipesan</p>
          </div>

          {/* Mode Pusat: Pilih Cabang */}
          {isSuperAdmin && (
            <div className="flex bg-blue-50 border border-blue-100 p-1 rounded-xl w-full md:max-w-xs">
              {branches.map((branch) => (
                <button
                  key={branch}
                  onClick={() => {
                    setActiveBranch(branch);
                    clearCart();
                    setCart([]);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    activeBranch === branch
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-600 hover:bg-blue-100/50'
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 flex-1 md:flex-initial">
              <StoreIcon className="w-5 h-5 text-gray-600" />
              <select
                value={selectedStore}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="border-none outline-none bg-transparent text-gray-900 cursor-pointer font-semibold text-sm w-full"
              >
                <option value="">Pilih Toko...</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => cart.length > 0 && setShowCart(true)}
              className={`relative px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-sm font-medium ${
                cart.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-default'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-sm font-bold">Keranjang ({cart.length})</span>
                {selectedStore && (
                  <span className="text-[10px] opacity-80 truncate max-w-[120px]">
                    {stores.find(s => s.id === selectedStore)?.name}
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

        {isLoading ? (
          <div className="flex justify-center items-center py-24 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-full overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedCategory === cat
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-gray-500 hover:text-gray-700'
                    } ${cartCategory && cartCategory !== cat ? 'opacity-50' : ''}`}
                  >
                    {cat.toUpperCase()}
                    {cartCategory === cat && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                  </button>
                ))}
              </div>

              {cartCategory && cartCategory !== selectedCategory && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-orange-800 font-medium text-sm">Keranjang Terkunci ke {cartCategory}</p>
                    <p className="text-orange-600 text-xs mt-0.5">
                      Anda tidak dapat menambahkan produk {selectedCategory} karena keranjang sudah berisi produk {cartCategory}.
                      Selesaikan pesanan atau kosongkan keranjang untuk mengganti kategori.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm('Kosongkan keranjang untuk mengganti kategori?')) {
                        clearCart();
                        setCart([]);
                      }
                    }}
                    className="text-orange-700 font-bold text-xs hover:underline uppercase tracking-wide bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-200"
                  >
                    Kosongkan
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              {!selectedStore && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 py-32">
                  <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center max-w-sm mx-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <StoreIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Pilih Toko Dahulu</h3>
                    <p className="text-gray-500 text-sm font-semibold">
                      Silakan pilih toko pada menu di atas untuk mulai melihat stok dan melakukan pemesanan.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const inCart = getCartQuantity(product.id);
                  const isRestricted = !!(cartCategory && cartCategory !== product.category);

                  return (
                    <div 
                      key={product.id} 
                      className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden group ${
                        isRestricted ? 'opacity-60 grayscale-[0.5] border-gray-100' : 'border-gray-200 hover:shadow-md hover:border-blue-200'
                      }`}
                    >
                      <div className="p-6">
                        <div className="mb-4 flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">{product.category}</p>
                            <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors">{product.name}</h3>
                          </div>
                        </div>

                        <div className="mb-6">
                          <p className="text-2xl font-black text-gray-900">
                            <span className="text-sm font-normal text-gray-500 mr-1">Rp</span>
                            {product.price.toLocaleString('id-ID')}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className={`w-2 h-2 rounded-full ${product.stock > 20 ? 'bg-green-500' : 'bg-red-500'}`} />
                            <p className="text-xs text-gray-500 font-medium">Stok: {product.stock} pcs</p>
                          </div>
                        </div>

                        {product.stock > 0 ? (
                          <div className="flex items-center gap-3">
                            {inCart > 0 ? (
                              <div className="flex items-center gap-3 flex-1 bg-blue-50 p-1.5 rounded-xl border border-blue-100">
                                <button
                                  onClick={() => decreaseQuantity(product.id)}
                                  className="bg-white text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-bold text-blue-700 flex-1 text-center text-lg">{inCart}</span>
                                <button
                                  onClick={() => addToCart(product.id)}
                                  className="bg-white text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(product.id)}
                                disabled={isRestricted}
                                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                                  isRestricted 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-95'
                                }`}
                              >
                                <Plus className="w-5 h-5" />
                                Tambah Ke Bon
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-3 bg-gray-50 rounded-xl text-gray-400 font-bold text-sm">STOK HABIS</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full md:max-w-2xl md:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">Keranjang Belanja</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-blue-50/50">
              <div className="mb-4 flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-800">
                  Pesanan Untuk: <span className="font-bold text-blue-700 text-lg ml-1">{stores.find(s => s.id === selectedStore)?.name || 'Pilih Toko...'}</span>
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nomor Faktur</label>
                  <input
                    type="text"
                    placeholder="Masukkan nomor faktur (contoh: FKT-001)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tanggal Pesanan</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 divide-y divide-gray-100">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-semibold">
                  Keranjang kosong
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const product = allProducts.find(p => p.id === item.productId);
                    if (!product) return null;

                    return (
                      <div key={item.productId} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-150 shadow-sm animate-in fade-in">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-sm">{product.name}</h3>
                          <p className="text-xs text-gray-500 font-bold font-mono">Rp {product.price.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => decreaseQuantity(item.productId)}
                            className="bg-white p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-sm w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item.productId)}
                            className="bg-white p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="font-bold text-gray-900 w-32 text-right font-mono">
                          Rp {(product.price * item.quantity).toLocaleString('id-ID')}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-gray-700">Total</span>
                <span className="text-2xl font-black text-gray-900 font-mono text-blue-600">
                  Rp {cartTotal.toLocaleString('id-ID')}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-base transition-all active:scale-95 shadow-lg shadow-blue-200"
              >
                Kirim Bon Belanja
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

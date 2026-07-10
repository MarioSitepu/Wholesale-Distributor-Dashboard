import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Product,
  Order,
  ScheduledPrice,
} from "../../utils/mockData";
import { api } from "../../utils/apiClient";
import {
  Search,
  Package,
  Calendar,
  Receipt,
  TrendingUp,
  TrendingDown,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  Clock,
  AlertTriangle,
  MapPin,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../../store/useAuthStore";

const addProductSchema = z.object({
  id: z.string().trim().min(1, "ID Produk wajib diisi"),
  name: z.string().trim().min(1, "Nama Produk wajib diisi"),
  category: z.string().trim().min(1, "Kategori wajib diisi"),
  price: z.coerce.number().int().positive("Harga harus lebih dari 0"),
  unitsPerCarton: z.coerce.number().int().min(0, "Jumlah unit per karton minimal 0"),
  branch: z.string().trim().min(1, "Cabang wajib diisi"),
});

export default function ProductLedger() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.branch === "Pusat";

  const [selectedBranch, setSelectedBranch] = useState<string>(
    user?.branch || "Palembang",
  );
  const [branches, setBranches] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProductName, setEditProductName] = useState("");
  const [editProductPrice, setEditProductPrice] = useState(0);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductId, setNewProductId] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newUnitsPerCarton, setNewUnitsPerCarton] = useState("0");
  const [newProductCategory, setNewProductCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [selectedListCategory, setSelectedListCategory] =
    useState<string>("All");

  const [scheduledPrices, setScheduledPrices] = useState<ScheduledPrice[]>([]);
  const [isSchedulingPrice, setIsSchedulingPrice] = useState(false);
  const [newSchedPrice, setNewSchedPrice] = useState("");
  const [newSchedDate, setNewSchedDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Security Check: Mencegah manipulasi state oleh Admin biasa
  if (!isSuperAdmin && selectedBranch && selectedBranch !== user?.branch) {
    console.warn("Security Alert: Branch manipulation detected!");
    setSelectedBranch(user?.branch || "");
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Akses Ditolak: Anda tidak memiliki izin melihat data cabang lain.
      </div>
    );
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, ordersRes, pricesRes, categoriesRes, branchesRes] = await Promise.all([
          api.get<Product[]>(`/api/products?branch=${selectedBranch}`),
          api.get<Order[]>(`/api/orders?branch=${selectedBranch}`),
          api.get<ScheduledPrice[]>(`/api/scheduled-prices?branch=${selectedBranch}`),
          api.get<{ categories: string[] }>('/api/categories'),
          api.get<{ branches: string[] }>('/api/branches'),
        ]);
        setProducts(productsRes);
        setOrders(ordersRes);
        setScheduledPrices(pricesRes);
        setCategories(categoriesRes.categories);
        if (branchesRes && branchesRes.branches) {
          setBranches(branchesRes.branches.map((b: any) => b.name || b));
        }
        if (!newProductCategory && categoriesRes.categories.length > 0) {
          setNewProductCategory(categoriesRes.categories[0]);
        }
      } catch (error: any) {
        toast.error("Gagal memuat data: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedBranch]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await api.post<string[]>('/api/categories', { name: newCategoryName.trim() });
      setCategories(res);
      setNewCategoryName("");
      toast.success("Kategori berhasil ditambahkan");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    if (
      confirm(
        `Hapus kategori ${cat}? Produk dengan kategori ini tidak akan terhapus tapi filter kategori akan hilang.`,
      )
    ) {
      try {
        await api.delete(`/api/categories/${encodeURIComponent(cat)}`);
        setCategories(categories.filter((c) => c !== cat));
        toast.success("Kategori berhasil dihapus");
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  };

  const handleAddProduct = async () => {
    const parsed = addProductSchema.safeParse({
      id: newProductId.trim().toUpperCase(),
      name: newProductName.trim(),
      category: newProductCategory,
      price: newProductPrice,
      unitsPerCarton: newUnitsPerCarton,
      branch: selectedBranch,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Validasi produk gagal");
      return;
    }

    try {
      const newProduct = await api.post<Product>('/api/products', {
        ...parsed.data,
      });

      setProducts([...products, newProduct]);
      toast.success("Produk berhasil ditambahkan");

      setNewProductId("");
      setNewProductName("");
      setNewProductPrice("");
      setNewUnitsPerCarton("0");
      setIsAddingProduct(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan produk");
    }
  };

  const handleAddScheduledPrice = async () => {
    if (!selectedProductId || !newSchedPrice || !newSchedDate) return;
    
    try {
      const newSchedule = await api.post<ScheduledPrice>('/api/scheduled-prices', {
        productId: selectedProductId,
        newPrice: Number(newSchedPrice),
        startDate: newSchedDate,
      });

      setScheduledPrices([...scheduledPrices, newSchedule]);
      setIsSchedulingPrice(false);
      setNewSchedPrice("");
      setNewSchedDate("");
      toast.success("Jadwal harga berhasil ditambahkan");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRemoveScheduledPrice = async (id: string) => {
    try {
      await api.delete(`/api/scheduled-prices/${id}`);
      setScheduledPrices(scheduledPrices.filter(sp => sp.id !== id));
      toast.success("Jadwal harga berhasil dihapus");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSaveProduct = async () => {
    if (!selectedProductId || !editProductName.trim()) return;
    
    try {
      const updatedProduct = await api.put<Product>(`/api/products/${selectedProductId}`, {
        name: editProductName.trim(),
        price: Number(editProductPrice) || 0,
        category: products.find((p) => p.id === selectedProductId)?.category || "",
      });

      setProducts(products.map(p => p.id === selectedProductId ? updatedProduct : p));
      setIsEditingProduct(false);
      toast.success("Produk berhasil diperbarui");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      try {
        await api.delete(`/api/products/${id}`);
        setProducts(products.filter(p => p.id !== id));
        if (selectedProductId === id) setSelectedProductId("");
        toast.success("Produk berhasil dihapus");
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedListCategory === "All" || p.category === selectedListCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Find all orders that contain the selected product
  const productTransactions = orders
    .filter((o) => o.items.some((item) => item.productId === selectedProductId))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Buku Produk</h1>
        <p className="text-gray-500">
          Pantau riwayat penjualan untuk setiap produk
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-700">Daftar Produk</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setIsManagingCategories(!isManagingCategories);
                      if (isAddingProduct) setIsAddingProduct(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border-2 ${
                      isManagingCategories
                        ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-100"
                        : "bg-white text-orange-600 border-orange-100 hover:border-orange-500"
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    Atur Kategori
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsAddingProduct(!isAddingProduct);
                    if (isManagingCategories) setIsManagingCategories(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border-2 ${
                    isAddingProduct
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100"
                      : "bg-white text-blue-600 border-blue-100 hover:border-blue-600"
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  Tambah Produk
                </button>
              </div>
            </div>
            {isManagingCategories && (
              <div className="p-4 bg-orange-50 rounded-2xl border-2 border-orange-500 shadow-lg animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-500 text-white rounded-lg">
                      <Tag className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest">
                      Master Kategori
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsManagingCategories(false)}
                    className="text-orange-300 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Contoh: Nugget, Sosis..."
                    className="flex-1 px-4 py-2 bg-white border-2 border-orange-100 rounded-xl text-sm focus:border-orange-500 outline-none transition-all font-bold placeholder:font-normal"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <button
                    onClick={handleAddCategory}
                    className="bg-orange-500 text-white px-3 rounded-xl hover:bg-orange-600 shadow-md active:scale-95 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      className="group flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-orange-100 text-xs font-bold text-orange-700 shadow-sm hover:border-orange-300 transition-all"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                      {cat}
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="opacity-0 group-hover:opacity-100 text-orange-300 hover:text-red-500 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isAddingProduct && (
              <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border-2 border-blue-500 shadow-lg animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest">
                    Produk Baru
                  </h3>
                  <button
                    onClick={() => setIsAddingProduct(false)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                      ID Produk (Manual)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: F009"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-bold"
                      value={newProductId}
                      onChange={(e) =>
                        setNewProductId(e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                      Nama Produk
                    </label>
                    <input
                      type="text"
                      placeholder="Nama produk..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                        Kategori
                      </label>
                      <select
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(e.target.value)}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                        Harga (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        placeholder="0"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-bold text-blue-600"
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                      JUMLAH UNIT PER KARTON
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      placeholder="Contoh: 24"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-bold text-blue-600"
                      value={newUnitsPerCarton}
                      onChange={(e) => setNewUnitsPerCarton(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddProduct}
                  className="w-full mt-2 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-100"
                >
                  Tambahkan Produk
                </button>
              </div>
            )}
            {isSuperAdmin && (
              <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100 mb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-bold text-blue-700 cursor-pointer w-full"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-1 p-1 bg-gray-200/50 rounded-lg overflow-x-auto no-scrollbar">
              {["All", ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedListCategory(cat)}
                  className={`whitespace-nowrap py-1.5 px-3 text-[10px] font-bold rounded-md transition-all ${
                    selectedListCategory === cat
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari produk..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p>Memuat daftar produk...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Tidak ada produk ditemukan
              </div>
            ) : (
              filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  setSelectedProductId(product.id);
                  setIsEditingProduct(false);
                }}
                className={`w-full text-left p-4 border-b border-gray-100 transition-colors hover:bg-gray-50 flex items-center gap-3
                  ${selectedProductId === product.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""}
                `}
              >
                <div
                  className={`p-2 rounded-lg ${selectedProductId === product.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                >
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-medium truncate ${selectedProductId === product.id ? "text-blue-700" : "text-gray-800"}`}
                    >
                      {product.name}
                    </h3>
                    {scheduledPrices.some(
                      (sp) => sp.productId === product.id,
                    ) && (
                      <Calendar className="w-3 h-3 text-orange-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{product.id}</span>
                    <span>Stok: {product.stock}</span>
                  </div>
                </div>
              </button>
            )))}
          </div>
        </div>

        {/* Main Content: Product Details and Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-12rem)] flex flex-col">
          {selectedProduct ? (
            <>
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {isEditingProduct ? (
                    <div className="flex-1 bg-white p-6 rounded-2xl border-2 border-blue-500 shadow-xl animate-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-blue-600 uppercase tracking-widest text-sm">
                          Mode Edit & Penjadwalan
                        </h3>
                        <button
                          onClick={() => setIsEditingProduct(false)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">
                            Nama Produk
                          </label>
                          <input
                            type="text"
                            className="w-full border-b-2 border-gray-100 focus:border-blue-500 py-2 outline-none font-bold text-xl transition-all"
                            value={editProductName}
                            onChange={(e) => setEditProductName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">
                            Harga Baru (Rp)
                          </label>
                          <input
                            type="number"
                            className="w-full border-b-2 border-gray-100 focus:border-blue-500 py-2 outline-none font-bold text-xl text-blue-600 transition-all"
                            value={editProductPrice}
                            onChange={(e) =>
                              setEditProductPrice(Number(e.target.value))
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            <span className="font-bold text-gray-700">
                              Jadwalkan Perubahan?
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            className="w-5 h-5 accent-blue-600"
                            checked={isSchedulingPrice}
                            onChange={(e) =>
                              setIsSchedulingPrice(e.target.checked)
                            }
                          />
                        </div>

                        {isSchedulingPrice && (
                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-3 animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="block text-[10px] font-black text-orange-600 uppercase mb-1">
                                  Mulai Berlaku Tanggal
                                </label>
                                <input
                                  type="date"
                                  className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-orange-500"
                                  value={newSchedDate}
                                  onChange={(e) =>
                                    setNewSchedDate(e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            {newSchedDate &&
                              newSchedDate <
                                new Date().toISOString().split("T")[0] && (
                                <div className="flex items-start gap-2 text-xs text-orange-700 font-medium leading-tight">
                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                  <p>
                                    Perhatian: Karena tanggal yang dipilih sudah
                                    lewat, data penjualan dan piutang lama akan
                                    dikoreksi otomatis.
                                  </p>
                                </div>
                              )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 mt-8">
                        <button
                          onClick={() => {
                            if (isSchedulingPrice) {
                              setNewSchedPrice(editProductPrice.toString());
                              handleAddScheduledPrice();
                            } else {
                              handleSaveProduct();
                            }
                          }}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                        >
                          {isSchedulingPrice
                            ? "Konfirmasi Jadwal"
                            : "Simpan Sekarang"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                          <Package className="w-7 h-7 text-blue-600" />
                          {selectedProduct.name}
                        </h2>
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider">
                          {selectedProduct.category}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1 flex items-center gap-4 text-sm font-medium">
                        <span>
                          ID:{" "}
                          <span className="text-gray-700 font-bold">
                            {selectedProduct.id}
                          </span>
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>
                          Stok Tersedia:{" "}
                          <span className="text-gray-700 font-bold">
                            {selectedProduct.stock} pcs
                          </span>
                        </span>
                      </p>
                    </div>
                  )}

                  {!isEditingProduct && (
                    <div className="flex gap-4 items-center">
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                          Harga Jual
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-2xl font-black text-blue-600">
                            Rp {selectedProduct.price.toLocaleString("id-ID")}
                          </p>
                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                setEditProductName(selectedProduct.name);
                                setEditProductPrice(selectedProduct.price);
                                setIsEditingProduct(true);
                              }}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95"
                              title="Ubah Harga & Nama"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <>
                          <div className="h-10 w-px bg-gray-200 mx-2"></div>
                          <button
                            onClick={() =>
                              handleDeleteProduct(selectedProduct.id)
                            }
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick stats for this product */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4 shadow-sm">
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Barang Keluar (Terjual)
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        {selectedProduct.totalOut}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4 shadow-sm">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                      <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Barang Masuk</p>
                      <p className="text-lg font-bold text-gray-800">
                        {selectedProduct.totalIn}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Scheduled Price Changes Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Jadwal Perubahan Harga
                    </h3>
                    {isSuperAdmin && !isSchedulingPrice && (
                      <button
                        onClick={() => setIsSchedulingPrice(true)}
                        className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Buat Jadwal Baru
                      </button>
                    )}
                  </div>

                  <div className="p-4">
                    {isSchedulingPrice && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-blue-600 uppercase mb-1">
                              Harga Baru (Rp)
                            </label>
                            <input
                              type="number"
                              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Contoh: 50000"
                              value={newSchedPrice}
                              onChange={(e) => setNewSchedPrice(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-blue-600 uppercase mb-1">
                              Mulai Tanggal
                            </label>
                            <input
                              type="date"
                              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              value={newSchedDate}
                              onChange={(e) => setNewSchedDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 justify-end">
                          <button
                            onClick={() => setIsSchedulingPrice(false)}
                            className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleAddScheduledPrice}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                          >
                            Simpan Jadwal
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {scheduledPrices.filter(
                        (sp) => sp.productId === selectedProductId,
                      ).length > 0 ? (
                        scheduledPrices
                          .filter((sp) => sp.productId === selectedProductId)
                          .map((sp) => (
                            <div
                              key={sp.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                            >
                              <div className="flex items-center gap-4">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-800">
                                    Rp {sp.newPrice.toLocaleString("id-ID")}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Mulai:{" "}
                                    {new Date(sp.startDate).toLocaleDateString(
                                      "id-ID",
                                      {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                      },
                                    )}
                                  </p>
                                </div>
                              </div>
                              {isSuperAdmin && (
                                <button
                                  onClick={() =>
                                    handleRemoveScheduledPrice(sp.id)
                                  }
                                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-6 text-gray-400 text-sm italic">
                          Belum ada jadwal perubahan harga untuk produk ini
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-gray-500" />
                    Riwayat Penjualan
                  </h3>
                </div>

                {productTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {productTransactions.map((order) => {
                      const itemInOrder = order.items.find(
                        (i) => i.productId === selectedProductId,
                      );
                      if (!itemInOrder) return null;

                      return (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="font-semibold text-gray-800">
                                Transaksi ke:{" "}
                                <span className="text-blue-600">
                                  {order.storeName}
                                </span>
                              </p>
                              <p className="text-sm text-gray-500">
                                Faktur #{order.id}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 flex items-center justify-end gap-1 mb-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(order.createdAt).toLocaleString(
                                  "id-ID",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center">
                            <div className="text-gray-600">
                              Terjual:{" "}
                              <span className="font-bold text-gray-800">
                                {itemInOrder.quantity} item
                              </span>{" "}
                              @ Rp {itemInOrder.price.toLocaleString("id-ID")}
                            </div>
                            <div className="font-bold text-green-600">
                              + Rp{" "}
                              {(
                                itemInOrder.quantity * itemInOrder.price
                              ).toLocaleString("id-ID")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Receipt className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">
                      Belum ada riwayat penjualan untuk produk ini
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
              <Package className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-600">Pilih Produk</p>
              <p className="text-center max-w-sm mt-2">
                Silakan pilih salah satu produk dari daftar di sebelah kiri
                untuk melihat detail dan riwayat penjualannya.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

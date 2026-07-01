import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Package,
  MapPin,
  Download,
  Search,
  Filter,
  ArrowUpRight,
  AlertCircle,
  Check,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../utils/apiClient";
import { toast, Toaster } from "sonner";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import { exportToExcel } from "../../utils/excelExport";

export default function StockManagement() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.branch === "Pusat";
  const activeBranch = useAppStore((state) => state.activeBranch);
  const selectedCategory = useAppStore((state) => state.selectedCategory);
  const setActiveBranch = useAppStore((state) => state.setActiveBranch);
  const setSelectedCategory = useAppStore((state) => state.setSelectedCategory);
  const branchFilter = isSuperAdmin
    ? activeBranch || "all"
    : user?.branch || "Palembang";
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");
  const isAllCategoriesSelected = (value?: string | null) => {
    const normalizedValue = value?.trim();
    return (
      !normalizedValue ||
      normalizedValue === "all" ||
      normalizedValue === "Semua Kategori"
    );
  };
  const isAllStockStatusSelected = (value?: string | null) => {
    const normalizedValue = value?.trim();
    return !normalizedValue || normalizedValue === "all" || normalizedValue === "Semua Status";
  };
  const effectiveSelectedCategory = isAllCategoriesSelected(selectedCategory)
    ? "all"
    : selectedCategory;

  const [branches, setBranches] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(
    null,
  );
  const [stockAmount, setStockAmount] = useState("");
  const [stockAction, setStockAction] = useState<'add' | 'reduce'>('add');
  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  // Check Product State
  const [showCheckProductModal, setShowCheckProductModal] = useState(false);
  const [checkProductId, setCheckProductId] = useState("");
  const [checkProductResult, setCheckProductResult] = useState<any>(null);

  // Security Check: Mencegah manipulasi state oleh Admin biasa
  if (
    !isSuperAdmin &&
    activeBranch &&
    activeBranch !== "all" &&
    activeBranch !== user?.branch
  ) {
    console.warn("Security Alert: Branch manipulation detected!");
    setActiveBranch(user?.branch || "");
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Akses Ditolak: Anda tidak memiliki izin melihat data cabang lain.
      </div>
    );
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stockRes, catRes, branchesRes] = await Promise.all([
          api.get<any[]>(`/api/stock?branch=${branchFilter}`),
          api.get<{ categories: string[] }>('/api/categories'),
          api.get<{ branches: string[] }>('/api/branches'),
        ]);
        setProducts(Array.isArray(stockRes) ? stockRes : []);
        setCategoriesList(catRes.categories ? catRes.categories.map((c: any) => c.name || c) : []);
        if (branchesRes && branchesRes.branches) {
          setBranches(branchesRes.branches.map((b: any) => b.name || b));
        }
      } catch (error: any) {
        toast.error("Gagal memuat data: " + error.message);
      }
    };
    fetchData();
  }, [branchFilter, selectedCategory]);

  const categories = useMemo(() => {
    return ["all", ...categoriesList];
  }, [categoriesList]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !normalizedSearch ||
        p.name.toLowerCase().includes(normalizedSearch) ||
        p.id.toLowerCase().includes(normalizedSearch);

      const stock = Number(p.stock) || 0;
      const matchesStockStatus = isAllStockStatusSelected(selectedStockStatus)
        ? true
        : selectedStockStatus === "normal"
          ? stock > 49
          : selectedStockStatus === "low"
            ? stock > 0 && stock < 50
            : selectedStockStatus === "empty"
              ? stock === 0
              : true;

      const matchesCategory = isAllCategoriesSelected(selectedCategory)
        ? true
        : p.category && selectedCategory && p.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesStockStatus && matchesCategory;
    });
  }, [products, searchQuery, selectedStockStatus, selectedCategory]);

  const handleStockAction = async () => {
    if (!selectedProductKey || !stockAmount) return;

    const amount = parseInt(stockAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Jumlah stok tidak valid");
      return;
    }

    const sProductParts = selectedProductKey.split("|");
    const branch = sProductParts[0];
    const id = sProductParts[1];

    try {
      const updatedStock = await api.post<any>('/api/stock', {
        productId: id,
        branch: branch,
        amount: amount,
        action: stockAction
      });

      // Update the local state
      setProducts(products.map(p => {
        if (p.id === id && p.branch === branch) {
          return updatedStock;
        }
        return p;
      }));

      setShowStockModal(false);
      setSelectedProductKey(null);
      setStockAmount("");
      toast.success(`Berhasil ${stockAction === 'add' ? 'menambah' : 'mengurangi'} stok ${updatedStock.name}`);
    } catch (error: any) {
      toast.error(error.message || `Gagal ${stockAction === 'add' ? 'menambah' : 'mengurangi'} stok`);
    }
  };

  const handleCheckProduct = () => {
    if (!checkProductId) return;
    const branchToSearch = isSuperAdmin ? (branchFilter === 'all' ? 'Palembang' : branchFilter) : user?.branch;
    const found = products.find(p => p.id === checkProductId && (p.branch === branchToSearch || p.branch === 'all'));
    
    if (found) {
      setCheckProductResult(found);
    } else {
      setCheckProductResult({ notFound: true });
    }
  };

  const handleExportExcel = () => {
    if (filteredProducts.length === 0) return;

    const headers = isSuperAdmin
      ? [
          "Cabang",
          "ID Produk",
          "Nama Produk",
          "Kategori",
          "Total Masuk",
          "Total Keluar",
          "Stok Saat Ini",
        ]
      : [
          "ID Produk",
          "Nama Produk",
          "Kategori",
          "Total Masuk",
          "Total Keluar",
          "Stok Saat Ini",
        ];

    const rows = filteredProducts.map((product) => {
      const base = [
        product.id,
        product.name,
        product.category,
        product.totalIn,
        product.totalOut,
        product.stock,
      ];
      return isSuperAdmin
        ? [product.branch || user?.branch || "Palembang", ...base]
        : base;
    });

    const alignments: ("left" | "center" | "right")[] = isSuperAdmin
      ? ["center", "center", "left", "left", "center", "center", "center"]
      : ["center", "left", "left", "center", "center", "center"];

    const types: ("text" | "number" | "currency")[] = isSuperAdmin
      ? ["text", "text", "text", "text", "number", "number", "number"]
      : ["text", "text", "text", "number", "number", "number"];

    const filename =
      isSuperAdmin && branchFilter !== "all"
        ? `Stok_${branchFilter}.xls`
        : "Stok_Gudang_Semua.xls";

    exportToExcel({
      filename,
      title: "LAPORAN STOK GUDANG",
      subtitle: `Cabang: ${isSuperAdmin ? (branchFilter === "all" ? "Semua Cabang" : branchFilter) : user?.branch || "Palembang"}`,
      headers,
      rows,
      alignments,
      types,
      showTotalRow: false,
    });
  };

  const openStockModal = (productKey: string, action: 'add' | 'reduce') => {
    setSelectedProductKey(productKey);
    setStockAction(action);
    setShowStockModal(true);
    setStockAmount("");
  };

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return "text-rose-600 bg-rose-50 ring-rose-600/20";
    if (stock < 50) return "text-amber-600 bg-amber-50 ring-amber-600/20";
    return "text-emerald-600 bg-emerald-50 ring-emerald-600/20";
  };

  const getStockStatusLabel = (stock: number) => {
    if (stock === 0) return "Stok Habis";
    if (stock < 50) return "Stok Menipis";
    return "Normal";
  };

  const selectedProductData = useMemo(() => {
    if (!selectedProductKey) return null;
    const [branch, id] = selectedProductKey.split("|");
    return products.find(
      (p) =>
        p.id === id && (p.branch || user?.branch || "Palembang") === branch,
    );
  }, [selectedProductKey, products]);

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                Kelola Stok
              </h1>
              <p className="text-gray-500 mt-2 text-lg">
                Monitor dan optimalisasi inventaris gudang Anda secara
                real-time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isSuperAdmin && (
                <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <select
                    value={branchFilter}
                    onChange={(e) =>
                      setActiveBranch(
                        e.target.value === "all" ? "" : e.target.value,
                      )
                    }
                    className="bg-transparent border-none outline-none font-semibold text-gray-700 cursor-pointer text-sm"
                  >
                    <option value="all">Semua Cabang</option>
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <button
                onClick={() => {
                  setCheckProductId("");
                  setCheckProductResult(null);
                  setShowCheckProductModal(true);
                }}
                className="flex items-center gap-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 font-bold text-sm px-5 py-2.5 rounded-2xl shadow-sm transition-all"
              >
                <Check className="w-5 h-5" />
                Cek Produk
              </button>

              <button
                onClick={handleExportExcel}
                disabled={filteredProducts.length === 0}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed font-bold text-sm"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl group-hover:bg-blue-100 transition-colors">
                  <Package className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Total Produk
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {products.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="bg-amber-50 p-4 rounded-2xl group-hover:bg-amber-100 transition-colors">
                  <AlertCircle className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Stok Menipis
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {products.filter((p) => p.stock < 50 && p.stock > 0).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-4">
                <div className="bg-rose-50 p-4 rounded-2xl group-hover:bg-rose-100 transition-colors">
                  <Package className="w-7 h-7 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Stok Habis
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {products.filter((p) => p.stock === 0).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-[1.1] min-w-0 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Cari ID atau nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-2xl shadow-sm lg:min-w-[220px]">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedStockStatus}
                onChange={(e) => setSelectedStockStatus(e.target.value)}
                className="bg-transparent border-none outline-none font-medium text-gray-700 cursor-pointer text-sm w-full"
              >
                <option value="all">Semua Status</option>
                <option value="normal">Normal</option>
                <option value="low">Stok Menipis</option>
                <option value="empty">Stok Habis</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-2xl shadow-sm lg:min-w-[220px] lg:ml-auto">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={effectiveSelectedCategory}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSelectedCategory(
                    nextValue === "all" ? "" : nextValue,
                  );
                }}
                className="bg-transparent border-none outline-none font-medium text-gray-700 cursor-pointer text-sm w-full"
              >
                <option value="all">Semua Kategori</option>
                {categories
                  .filter((c) => c !== "all")
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Content - Responsive Table/Cards */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    ID Produk
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Produk
                  </th>
                  {isSuperAdmin && (
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Cabang
                    </th>
                  )}
                  <th className="px-6 py-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Masuk
                  </th>
                  <th className="px-6 py-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Keluar
                  </th>
                  <th className="px-6 py-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Stok Sisa
                  </th>
                  <th className="px-6 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((product) => {
                  const branch = product.branch || user?.branch || "Palembang";
                  const uniqueKey = `${branch}|${product.id}`;
                  return (
                    <tr
                      key={uniqueKey}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-mono text-gray-400">
                        {product.id}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">
                            {product.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {product.category}
                          </span>
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">
                            {branch}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-center text-emerald-600 font-medium">
                        +{product.totalIn}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-center text-rose-600 font-medium">
                        -{product.totalOut}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-xl text-sm font-bold ring-1 ring-inset ${getStockStatusColor(product.stock)}`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => openStockModal(uniqueKey, 'reduce')}
                          className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold text-sm bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-all active:scale-95"
                          title="Kurangi Stok"
                        >
                          <TrendingDown className="w-4 h-4" />
                          Keluar
                        </button>
                        <button
                          onClick={() => openStockModal(uniqueKey, 'add')}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all active:scale-95"
                          title="Tambah Stok"
                        >
                          <Plus className="w-4 h-4" />
                          Masuk
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredProducts.map((product) => {
              const branch = product.branch || user?.branch || "Palembang";
              const uniqueKey = `${branch}|${product.id}`;
              return (
                <div key={uniqueKey} className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-mono text-gray-400 mb-1">
                        {product.id}
                      </p>
                      <h3 className="text-base font-bold text-gray-900">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {product.category}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-xl text-sm font-bold ring-1 ring-inset ${getStockStatusColor(product.stock)}`}
                    >
                      {product.stock} Sisa
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl">
                    <div className="text-center border-r border-gray-200">
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                        Masuk
                      </p>
                      <p className="text-sm font-semibold text-emerald-600">
                        +{product.totalIn}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                        Keluar
                      </p>
                      <p className="text-sm font-semibold text-rose-600">
                        -{product.totalOut}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {isSuperAdmin && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {branch}
                      </span>
                    )}
                    <button
                      onClick={() => openStockModal(uniqueKey, 'reduce')}
                      className="flex-1 inline-flex items-center justify-center gap-2 text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
                    >
                      <TrendingDown className="w-4 h-4" />
                      Keluar
                    </button>
                    <button
                      onClick={() => openStockModal(uniqueKey, 'add')}
                      className="flex-1 inline-flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Masuk
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-20 text-center">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Produk tidak ditemukan
              </h3>
              <p className="text-gray-500">
                Coba gunakan kata kunci pencarian atau filter yang berbeda.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stock Action Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowStockModal(false)}
          />
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {stockAction === 'add' ? 'Tambah Stok' : 'Kurangi Stok'}
                </h2>
                <p className="text-gray-500 mt-1">
                  {stockAction === 'add' ? 'Perbarui jumlah unit masuk.' : 'Perbarui jumlah unit keluar.'}
                </p>
              </div>
              <div className={`p-3 rounded-2xl ${stockAction === 'add' ? 'bg-blue-50' : 'bg-rose-50'}`}>
                {stockAction === 'add' ? (
                  <ArrowUpRight className="w-6 h-6 text-blue-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-rose-600" />
                )}
              </div>
            </div>

            {selectedProductData && (
              <div className="mb-8 p-5 bg-gray-50 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Detail Produk
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedProductData.name}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {selectedProductData.id}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">•</span>
                  <span className="text-xs font-bold text-blue-600">
                    {selectedProductData.branch || user?.branch || "Palembang"}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stok saat ini</span>
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-xl ring-1 ring-inset ${getStockStatusColor(selectedProductData.stock)}`}
                  >
                    {selectedProductData.stock}
                  </span>
                </div>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                {stockAction === 'add' ? 'Jumlah Unit Masuk' : 'Jumlah Unit Keluar'}
              </label>
              <input
                type="number"
                value={stockAmount}
                onChange={(e) => setStockAmount(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg font-bold"
                placeholder="0"
                min="1"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStockModal(false);
                  setSelectedProductKey(null);
                  setStockAmount("");
                }}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleStockAction}
                className={`flex-[2] text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 ${
                  stockAction === 'add' 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                }`}
              >
                Konfirmasi {stockAction === 'add' ? 'Masuk' : 'Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check Product Modal */}
      {showCheckProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowCheckProductModal(false)}
          />
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Cek Produk
                </h2>
                <p className="text-gray-500 mt-1">
                  Validasi dan lihat informasi stok produk.
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl">
                <Check className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="mb-6 flex gap-2">
              <input
                type="text"
                value={checkProductId}
                onChange={(e) => {
                  setCheckProductId(e.target.value);
                  setCheckProductResult(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckProduct()}
                className="flex-1 px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg font-mono font-bold"
                placeholder="Scan / Masukkan ID Produk"
                autoFocus
              />
              <button
                onClick={handleCheckProduct}
                className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>

            {checkProductResult && !checkProductResult.notFound && (
              <div className="mb-8 p-5 bg-emerald-50 rounded-3xl border border-emerald-100 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-emerald-100 p-1.5 rounded-full">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-emerald-700">Produk Valid</span>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">
                  {checkProductResult.name}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {checkProductResult.id}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">•</span>
                  <span className="text-xs font-bold text-gray-500">
                    {checkProductResult.category}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 bg-white p-3 rounded-2xl">
                  <div className="text-center border-r border-gray-100">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                      Stok
                    </p>
                    <p className={`text-xl font-bold ${checkProductResult.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {checkProductResult.stock}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                      Cabang
                    </p>
                    <p className="text-sm font-bold text-gray-700 mt-1">
                      {checkProductResult.branch || user?.branch || 'Palembang'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {checkProductResult?.notFound && (
              <div className="mb-8 p-5 bg-rose-50 rounded-3xl border border-rose-100 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-rose-100 p-1.5 rounded-full">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="text-sm font-bold text-rose-700">Tidak Ditemukan</span>
                </div>
                <p className="text-sm text-rose-600">
                  Produk dengan ID <strong>{checkProductId}</strong> tidak ditemukan di database. Pastikan ID produk benar.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowCheckProductModal(false)}
              className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}

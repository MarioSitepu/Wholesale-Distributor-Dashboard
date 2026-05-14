import { useState, useEffect, useMemo } from 'react';
import { Plus, Package, MapPin, Download, Search, Filter, ArrowUpRight, AlertCircle } from 'lucide-react';
import { getProducts, updateProduct, getGlobalProducts, getBranches, getCurrentBranch, getCategories } from '../../utils/mockData';
import { toast, Toaster } from 'sonner';

export default function StockManagement() {
  const userStr = localStorage.getItem('currentUser');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.branch === 'Pusat';

  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState(isSuperAdmin ? getGlobalProducts() : getProducts());
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  useEffect(() => {
    let allProducts = isSuperAdmin ? getGlobalProducts() : getProducts();
    if (isSuperAdmin && selectedBranch !== 'all') {
      allProducts = allProducts.filter(p => (p as any).branch === selectedBranch);
    }
    setProducts(allProducts);
    setCategoriesList(getCategories());
  }, [isSuperAdmin, selectedBranch]);

  const categories = useMemo(() => {
    return ['all', ...categoriesList];
  }, [categoriesList]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleRestock = () => {
    if (!selectedProductKey || !restockAmount) return;

    const amount = parseInt(restockAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Jumlah restock tidak valid');
      return;
    }

    const sProductParts = selectedProductKey.split('|');
    const branch = sProductParts[0];
    const id = sProductParts[1];

    const product = products.find(p => {
      const pId = p.id;
      const pBranch = (p as any).branch || getCurrentBranch();
      return pId === id && pBranch === branch;
    });

    if (!product) return;

    const targetBranch = (product as any).branch || getCurrentBranch();
    
    const updatedProduct = {
      ...product,
      stock: Number(product.stock) + amount,
      totalIn: Number(product.totalIn) + amount
    };
    
    updateProduct(updatedProduct, targetBranch);
    
    let allProducts = isSuperAdmin ? getGlobalProducts() : getProducts();
    if (isSuperAdmin && selectedBranch !== 'all') {
      allProducts = allProducts.filter(p => (p as any).branch === selectedBranch);
    }
    setProducts(allProducts);
    setShowRestockModal(false);
    setSelectedProductKey(null);
    setRestockAmount('');
    toast.success(`Berhasil restock ${product.name}`);
  };

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) return;

    const headers = isSuperAdmin 
      ? ['Cabang', 'ID Produk', 'Nama Produk', 'Kategori', 'Total Masuk', 'Total Keluar', 'Stok Saat Ini']
      : ['ID Produk', 'Nama Produk', 'Kategori', 'Total Masuk', 'Total Keluar', 'Stok Saat Ini'];
      
    const rows = filteredProducts.map(product => {
      const base = [
        product.id,
        product.name,
        product.category,
        product.totalIn,
        product.totalOut,
        product.stock
      ];
      return isSuperAdmin ? [(product as any).branch || getCurrentBranch(), ...base] : base;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = isSuperAdmin && selectedBranch !== 'all' ? `Stok_${selectedBranch}.csv` : 'Stok_Gudang_Semua.csv';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openRestockModal = (productKey: string) => {
    setSelectedProductKey(productKey);
    setShowRestockModal(true);
    setRestockAmount('');
  };

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'text-rose-600 bg-rose-50 ring-rose-600/20';
    if (stock < 50) return 'text-amber-600 bg-amber-50 ring-amber-600/20';
    return 'text-emerald-600 bg-emerald-50 ring-emerald-600/20';
  };

  const selectedProductData = useMemo(() => {
    if (!selectedProductKey) return null;
    const [branch, id] = selectedProductKey.split('|');
    return products.find(p => p.id === id && ((p as any).branch || getCurrentBranch()) === branch);
  }, [selectedProductKey, products]);

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Kelola Stok</h1>
              <p className="text-gray-500 mt-2 text-lg">Monitor dan optimalisasi inventaris gudang Anda secara real-time.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {isSuperAdmin && (
                <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="bg-transparent border-none outline-none font-semibold text-gray-700 cursor-pointer text-sm"
                  >
                    <option value="all">Semua Cabang</option>
                    {getBranches().map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleExportCSV}
                disabled={filteredProducts.length === 0}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed font-bold text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
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
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Produk</p>
                  <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="bg-amber-50 p-4 rounded-2xl group-hover:bg-amber-100 transition-colors">
                  <AlertCircle className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Stok Menipis</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {products.filter(p => p.stock < 50 && p.stock > 0).length}
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
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Stok Habis</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {products.filter(p => p.stock === 0).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Cari ID atau nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-2xl shadow-sm">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none outline-none font-medium text-gray-700 cursor-pointer text-sm"
              >
                <option value="all">Semua Kategori</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
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
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">ID Produk</th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Produk</th>
                  {isSuperAdmin && <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Cabang</th>}
                  <th className="px-6 py-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Masuk</th>
                  <th className="px-6 py-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Keluar</th>
                  <th className="px-6 py-5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Stok Sisa</th>
                  <th className="px-6 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((product) => {
                  const branch = (product as any).branch || getCurrentBranch();
                  const uniqueKey = `${branch}|${product.id}`;
                  return (
                    <tr key={uniqueKey} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-mono text-gray-400">{product.id}</td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{product.name}</span>
                          <span className="text-xs text-gray-400">{product.category}</span>
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">
                            {branch}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-center text-emerald-600 font-medium">+{product.totalIn}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-center text-rose-600 font-medium">-{product.totalOut}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-xl text-sm font-bold ring-1 ring-inset ${getStockStatusColor(product.stock)}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <button
                          onClick={() => openRestockModal(uniqueKey)}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          Restock
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
              const branch = (product as any).branch || getCurrentBranch();
              const uniqueKey = `${branch}|${product.id}`;
              return (
                <div key={uniqueKey} className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-mono text-gray-400 mb-1">{product.id}</p>
                      <h3 className="text-base font-bold text-gray-900">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ring-1 ring-inset ${getStockStatusColor(product.stock)}`}>
                      {product.stock} Sisa
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl">
                    <div className="text-center border-r border-gray-200">
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Masuk</p>
                      <p className="text-sm font-semibold text-emerald-600">+{product.totalIn}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Keluar</p>
                      <p className="text-sm font-semibold text-rose-600">-{product.totalOut}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {isSuperAdmin && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {branch}
                      </span>
                    )}
                    <button
                      onClick={() => openRestockModal(uniqueKey)}
                      className="flex-1 inline-flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Stok
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
              <h3 className="text-lg font-bold text-gray-900">Produk tidak ditemukan</h3>
              <p className="text-gray-500">Coba gunakan kata kunci pencarian atau filter yang berbeda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowRestockModal(false)} />
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Restock Produk</h2>
                <p className="text-gray-500 mt-1">Perbarui jumlah ketersediaan unit.</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl">
                <ArrowUpRight className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            {selectedProductData && (
              <div className="mb-8 p-5 bg-gray-50 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Detail Produk</p>
                <p className="text-lg font-bold text-gray-900">{selectedProductData.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{selectedProductData.id}</span>
                  <span className="text-xs font-semibold text-gray-500">•</span>
                  <span className="text-xs font-bold text-blue-600">{(selectedProductData as any).branch || getCurrentBranch()}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stok saat ini</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-xl ring-1 ring-inset ${getStockStatusColor(selectedProductData.stock)}`}>
                    {selectedProductData.stock}
                  </span>
                </div>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                Jumlah Unit Masuk
              </label>
              <input
                type="number"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg font-bold"
                placeholder="0"
                min="1"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setSelectedProductKey(null);
                  setRestockAmount('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleRestock}
                className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                Konfirmasi Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


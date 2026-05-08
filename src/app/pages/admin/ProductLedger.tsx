import React, { useState, useEffect } from 'react';
import { Product, Order, getProducts, getOrders, updateProduct, addProduct, deleteProduct, ScheduledPrice, getScheduledPrices, addScheduledPrice, deleteScheduledPrice, applyScheduledPrices } from '../../utils/mockData';
import { Search, Package, Calendar, Receipt, TrendingUp, TrendingDown, Edit2, Check, X, Plus, Trash2, Clock, AlertTriangle } from 'lucide-react';

export default function ProductLedger() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProductName, setEditProductName] = useState('');
  const [editProductPrice, setEditProductPrice] = useState(0);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<'Fiesta' | 'Shifudo'>('Fiesta');

  const [selectedListCategory, setSelectedListCategory] = useState<'All' | 'Fiesta' | 'Shifudo'>('All');

  const [scheduledPrices, setScheduledPrices] = useState<ScheduledPrice[]>([]);
  const [isSchedulingPrice, setIsSchedulingPrice] = useState(false);
  const [newSchedPrice, setNewSchedPrice] = useState('');
  const [newSchedDate, setNewSchedDate] = useState('');

  useEffect(() => {
    applyScheduledPrices();
    setProducts(getProducts());
    setOrders(getOrders());
    setScheduledPrices(getScheduledPrices());
  }, []);

  const handleAddScheduledPrice = () => {
    if (!selectedProductId || !newSchedPrice || !newSchedDate) return;
    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;

    const newSchedule: ScheduledPrice = {
      id: `SP-${Date.now()}`,
      productId: selectedProductId,
      productName: selectedProduct.name,
      newPrice: Number(newSchedPrice),
      startDate: newSchedDate
    };

    addScheduledPrice(newSchedule);
    setScheduledPrices(getScheduledPrices());
    setIsSchedulingPrice(false);
    setNewSchedPrice('');
    setNewSchedDate('');
  };

  const handleRemoveScheduledPrice = (id: string) => {
    deleteScheduledPrice(id);
    setScheduledPrices(getScheduledPrices());
  };

  const handleSaveProduct = () => {
    if (!selectedProductId || !editProductName.trim()) return;
    const prodToUpdate = products.find(p => p.id === selectedProductId);
    if (prodToUpdate) {
      updateProduct({ ...prodToUpdate, name: editProductName.trim(), price: Number(editProductPrice) || 0 });
      setProducts(getProducts());
      setIsEditingProduct(false);
    }
  };

  const handleAddProduct = () => {
    if (!newProductName.trim() || !newProductPrice) return;
    const prefix = newProductCategory === 'Fiesta' ? 'F' : 'S';
    const newId = `${prefix}-${Date.now().toString().slice(-6)}`;
    const newProduct: Product = {
      id: newId,
      name: newProductName.trim(),
      category: newProductCategory,
      stock: 0,
      price: Number(newProductPrice) || 0,
      initialStock: 0,
      totalIn: 0,
      totalOut: 0
    };
    addProduct(newProduct);
    setProducts(getProducts());
    setNewProductName('');
    setNewProductPrice('');
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      deleteProduct(id);
      setProducts(getProducts());
      if (selectedProductId === id) setSelectedProductId('');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedListCategory === 'All' || p.category === selectedListCategory;
    return matchesSearch && matchesCategory;
  });


  const selectedProduct = products.find(p => p.id === selectedProductId);
  
  // Find all orders that contain the selected product
  const productTransactions = orders
    .filter(o => o.items.some(item => item.productId === selectedProductId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Buku Produk</h1>
        <p className="text-gray-500">Pantau riwayat penjualan untuk setiap produk</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-700">Daftar Produk</h2>
              <button 
                onClick={() => setIsAddingProduct(true)}
                className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                title="Tambah Produk"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {isAddingProduct && (
              <div className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <input
                  type="text"
                  placeholder="Nama produk..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  autoFocus
                />
                <input
                  type="number"
                  placeholder="Harga (Rp)..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                />
                <select
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value as 'Fiesta' | 'Shifudo')}
                >
                  <option value="Fiesta">Fiesta</option>
                  <option value="Shifudo">Shifudo</option>
                </select>
                <div className="flex gap-2 justify-end">
                  <button onClick={handleAddProduct} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setIsAddingProduct(false); setNewProductName(''); setNewProductPrice(''); }} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-1 p-1 bg-gray-200/50 rounded-lg">
              {(['All', 'Fiesta', 'Shifudo'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedListCategory(cat)}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-md transition-all ${
                    selectedListCategory === cat
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
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
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => {
                  setSelectedProductId(product.id);
                  setIsEditingProduct(false);
                }}
                className={`w-full text-left p-4 border-b border-gray-100 transition-colors hover:bg-gray-50 flex items-center gap-3
                  ${selectedProductId === product.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                `}
              >
                <div className={`p-2 rounded-lg ${selectedProductId === product.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium truncate ${selectedProductId === product.id ? 'text-blue-700' : 'text-gray-800'}`}>
                      {product.name}
                    </h3>
                    {scheduledPrices.some(sp => sp.productId === product.id) && (
                      <Calendar className="w-3 h-3 text-orange-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{product.id}</span>
                    <span>Stok: {product.stock}</span>
                  </div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Tidak ada produk ditemukan
              </div>
            )}
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
                        <h3 className="font-black text-blue-600 uppercase tracking-widest text-sm">Mode Edit & Penjadwalan</h3>
                        <button onClick={() => setIsEditingProduct(false)} className="text-gray-400 hover:text-red-500"><X /></button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nama Produk</label>
                          <input
                            type="text"
                            className="w-full border-b-2 border-gray-100 focus:border-blue-500 py-2 outline-none font-bold text-xl transition-all"
                            value={editProductName}
                            onChange={(e) => setEditProductName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Harga Baru (Rp)</label>
                          <input
                            type="number"
                            className="w-full border-b-2 border-gray-100 focus:border-blue-500 py-2 outline-none font-bold text-xl text-blue-600 transition-all"
                            value={editProductPrice}
                            onChange={(e) => setEditProductPrice(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            <span className="font-bold text-gray-700">Jadwalkan Perubahan?</span>
                          </div>
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-blue-600"
                            checked={isSchedulingPrice}
                            onChange={(e) => setIsSchedulingPrice(e.target.checked)}
                          />
                        </div>

                        {isSchedulingPrice && (
                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-3 animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="block text-[10px] font-black text-orange-600 uppercase mb-1">Mulai Berlaku Tanggal</label>
                                <input
                                  type="date"
                                  className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-orange-500"
                                  value={newSchedDate}
                                  onChange={(e) => setNewSchedDate(e.target.value)}
                                />
                              </div>
                            </div>
                            {newSchedDate && newSchedDate < today && (
                              <div className="flex items-start gap-2 text-xs text-orange-700 font-medium leading-tight">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <p>Perhatian: Karena tanggal yang dipilih sudah lewat, data penjualan dan piutang lama akan dikoreksi otomatis.</p>
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
                          {isSchedulingPrice ? 'Konfirmasi Jadwal' : 'Simpan Sekarang'}
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
                        <span>ID: <span className="text-gray-700 font-bold">{selectedProduct.id}</span></span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>Stok Tersedia: <span className="text-gray-700 font-bold">{selectedProduct.stock} pcs</span></span>
                      </p>
                    </div>
                  )}
                  
                  {!isEditingProduct && (
                    <div className="flex gap-4 items-center">
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Harga Jual</p>
                        <div className="flex items-center gap-3">
                          <p className="text-2xl font-black text-blue-600">Rp {selectedProduct.price.toLocaleString('id-ID')}</p>
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
                        </div>
                      </div>
                      <div className="h-10 w-px bg-gray-200 mx-2"></div>
                      <button 
                        onClick={() => handleDeleteProduct(selectedProduct.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Hapus Produk"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
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
                      <p className="text-sm text-gray-500">Barang Keluar (Terjual)</p>
                      <p className="text-lg font-bold text-gray-800">{selectedProduct.totalOut}</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4 shadow-sm">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                      <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Barang Masuk</p>
                      <p className="text-lg font-bold text-gray-800">{selectedProduct.totalIn}</p>
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
                    {!isSchedulingPrice && (
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
                            <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Harga Baru (Rp)</label>
                            <input
                              type="number"
                              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Contoh: 50000"
                              value={newSchedPrice}
                              onChange={(e) => setNewSchedPrice(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Mulai Tanggal</label>
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
                      {scheduledPrices.filter(sp => sp.productId === selectedProductId).length > 0 ? (
                        scheduledPrices.filter(sp => sp.productId === selectedProductId).map(sp => (
                          <div key={sp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-4">
                              <div className="bg-white p-2 rounded-lg shadow-sm">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-800">Rp {sp.newPrice.toLocaleString('id-ID')}</p>
                                <p className="text-xs text-gray-500">Mulai: {new Date(sp.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleRemoveScheduledPrice(sp.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

                {productTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {productTransactions.map((order) => {
                      const itemInOrder = order.items.find(i => i.productId === selectedProductId);
                      if (!itemInOrder) return null;
                      
                      return (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="font-semibold text-gray-800">
                                Transaksi ke: <span className="text-blue-600">{order.storeName}</span>
                              </p>
                              <p className="text-sm text-gray-500">Order #{order.id}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 flex items-center justify-end gap-1 mb-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(order.createdAt).toLocaleString('id-ID', {
                                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center">
                            <div className="text-gray-600">
                              Terjual: <span className="font-bold text-gray-800">{itemInOrder.quantity} item</span> @ Rp {itemInOrder.price.toLocaleString('id-ID')}
                            </div>
                            <div className="font-bold text-green-600">
                              + Rp {(itemInOrder.quantity * itemInOrder.price).toLocaleString('id-ID')}
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
                    <p className="text-gray-500">Belum ada riwayat penjualan untuk produk ini</p>
                  </div>
                )}
              </div>
            </div>
          </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
              <Package className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-600">Pilih Produk</p>
              <p className="text-center max-w-sm mt-2">
                Silakan pilih salah satu produk dari daftar di sebelah kiri untuk melihat detail dan riwayat penjualannya.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

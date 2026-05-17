import { useState, useEffect, useCallback } from 'react';
import { Store, Order, getStores, getOrders, updateStore, addStore, deleteStore, getCurrentBranch, getGlobalStores, getGlobalOrders, getBranches, generateId } from '../../utils/mockData';
import { Search, Store as StoreIcon, Calendar, Receipt, Edit2, Check, X, Plus, Trash2, MapPin } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function StoreLedger() {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.branch === 'Pusat';

  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [branches, setBranches] = useState<string[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [editStoreName, setEditStoreName] = useState('');
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load branches list (Super Admin only)
  useEffect(() => {
    if (isSuperAdmin) {
      getBranches()
        .then(setBranches)
        .catch(err => toast.error('Gagal memuat cabang: ' + err.message));
    }
  }, [isSuperAdmin]);

  // Load stores and orders dynamically
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [storesData, ordersData] = await Promise.all([
        isSuperAdmin ? getGlobalStores() : getStores(),
        isSuperAdmin ? getGlobalOrders() : getOrders()
      ]);
      
      let filteredStores = storesData;
      let filteredOrders = ordersData;
      
      if (isSuperAdmin && selectedBranch !== 'all') {
        filteredStores = storesData.filter(s => s.branch === selectedBranch);
        filteredOrders = ordersData.filter(o => (o as any).branch === selectedBranch);
      }
      
      setStores(filteredStores);
      setOrders(filteredOrders);
    } catch (err: any) {
      toast.error('Gagal memuat data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, selectedBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddStore = async () => {
    if (!newStoreName.trim()) {
      toast.error('Nama toko harus diisi');
      return;
    }
    const branchToUse = isSuperAdmin 
      ? (selectedBranch === 'all' ? 'Palembang' : selectedBranch)
      : getCurrentBranch();

    try {
      await addStore({
        id: generateId('STR', branchToUse),
        name: newStoreName.trim(),
        branch: branchToUse
      }, branchToUse);
      toast.success('Toko berhasil ditambahkan');
      setNewStoreName('');
      setIsAddingStore(false);
      loadData();
    } catch (err: any) {
      toast.error('Gagal menambahkan toko: ' + err.message);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus toko ini? Semua riwayat piutang & pesanan terkait akan tetap tersimpan di database.')) {
      try {
        await deleteStore(id);
        toast.success('Toko berhasil dihapus');
        if (selectedStoreId === id) setSelectedStoreId('');
        loadData();
      } catch (err: any) {
        toast.error('Gagal menghapus toko: ' + err.message);
      }
    }
  };

  const handleSaveStore = async () => {
    if (!selectedStoreId || !editStoreName.trim()) return;
    
    const storeToUpdate = stores.find(s => s.id === selectedStoreId);
    if (storeToUpdate) {
      try {
        await updateStore({ ...storeToUpdate, name: editStoreName.trim() });
        toast.success('Nama toko berhasil diubah');
        setIsEditingStore(false);
        loadData();
      } catch (err: any) {
        toast.error('Gagal mengubah nama toko: ' + err.message);
      }
    }
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStore = stores.find(s => s.id === selectedStoreId);
  const storeOrders = orders.filter(o => o.storeId === selectedStoreId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Buku Toko</h1>
        <p className="text-gray-500">Pantau transaksi untuk setiap toko</p>
      </div>

      {isLoading && stores.length === 0 ? (
        <div className="flex justify-center items-center py-24 bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-12rem)]">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: List of Stores */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-gray-700">Daftar Toko</h2>
                <button 
                  onClick={() => setIsAddingStore(true)}
                  className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Tambah Toko"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {isAddingStore && (
                <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-100">
                  <input
                    type="text"
                    placeholder="Nama toko baru..."
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={handleAddStore} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setIsAddingStore(false); setNewStoreName(''); }} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                    <X className="w-4 h-4" />
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
                    <option value="all">Semua Cabang</option>
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari toko..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {filteredStores.map(store => (
                <button
                  key={store.id}
                  onClick={() => {
                    setSelectedStoreId(store.id);
                    setIsEditingStore(false);
                  }}
                  className={`w-full text-left p-4 transition-colors hover:bg-gray-50 flex items-center gap-3
                    ${selectedStoreId === store.id ? 'bg-blue-50/70 border-l-4 border-l-blue-500' : ''}
                  `}
                >
                  <div className={`p-2 rounded-lg ${selectedStoreId === store.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    <StoreIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold truncate text-sm ${selectedStoreId === store.id ? 'text-blue-700' : 'text-gray-800'}`}>
                        {store.name}
                      </h3>
                      <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-bold uppercase">
                        <MapPin className="w-2.5 h-2.5" />
                        {store.branch}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-mono">
                      <span>{store.id}</span>
                      <span className={store.totalDebt > 0 ? 'text-red-500 font-bold' : ''}>
                        Rp {store.totalDebt.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              {filteredStores.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Tidak ada toko ditemukan
                </div>
              )}
            </div>
          </div>

          {/* Main Content: Store Details and Transactions */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-12rem)] flex flex-col">
            {selectedStore ? (
              <>
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      {isEditingStore ? (
                        <div className="flex items-center gap-2 mt-1">
                          <StoreIcon className="w-6 h-6 text-blue-600" />
                          <input
                            type="text"
                            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editStoreName}
                            onChange={(e) => setEditStoreName(e.target.value)}
                            autoFocus
                          />
                          <button onClick={handleSaveStore} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setIsEditingStore(false)} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 group">
                          <StoreIcon className="w-6 h-6 text-blue-600" />
                          {selectedStore.name}
                          <button 
                            onClick={() => {
                              setEditStoreName(selectedStore.name);
                              setIsEditingStore(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-opacity"
                            title="Edit Toko"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteStore(selectedStore.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                            title="Hapus Toko"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </h2>
                      )}
                      <p className="text-gray-500 mt-1">ID Toko: {selectedStore.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Total Transaksi</p>
                      <p className="text-2xl font-bold text-gray-800">{storeOrders.length}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-gray-500" />
                    Riwayat Transaksi
                  </h3>

                  {storeOrders.length > 0 ? (
                    <div className="space-y-4">
                      {storeOrders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all animate-in fade-in">
                          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                            <div>
                              <p className="font-semibold text-gray-800">Faktur #{order.id}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(order.createdAt).toLocaleString('id-ID', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Total Belanja</p>
                              <p className="font-bold text-green-600">
                                Rp {order.total.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Daftar Barang:</p>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm items-center">
                                  <span className="text-gray-600 font-semibold">
                                    {item.quantity}x {item.productName}
                                  </span>
                                  <span className="text-gray-800 font-bold font-mono">
                                    Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Receipt className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">Belum ada transaksi untuk toko ini</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
                <StoreIcon className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-600">Pilih Toko</p>
                <p className="text-center max-w-sm mt-2">
                  Silakan pilih salah satu toko dari daftar di sebelah kiri untuk melihat detail dan riwayat transaksinya.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

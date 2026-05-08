import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Download } from 'lucide-react';
import { getOrders, getStores, getProducts } from '../../utils/mockData';

export default function OrderHistory() {
  const allOrders = getOrders();
  const stores = getStores();
  const products = getProducts();
  
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'Fiesta' | 'Shifudo'>('all');
  const [filterType, setFilterType] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filteredOrders = allOrders.filter(order => {
    const matchesStore = selectedStoreFilter === 'all' || order.storeId === selectedStoreFilter;
    
    // Determine order category
    const firstItem = order.items[0];
    const product = products.find(p => p.id === firstItem?.productId);
    const orderCategory = product?.category || 'General';
    const matchesCategory = selectedCategoryFilter === 'all' || orderCategory === selectedCategoryFilter;
    
    // Date filtering
    const orderDate = new Date(order.createdAt).toISOString();
    let matchesDate = false;
    
    if (filterType === 'day') {
      matchesDate = orderDate.startsWith(selectedDate);
    } else {
      matchesDate = orderDate.startsWith(selectedMonth);
    }
    
    return matchesStore && matchesCategory && matchesDate;
  });

  const storeOrders = [...filteredOrders].reverse();

  const handleExportCSV = () => {
    if (storeOrders.length === 0) return;

    const headers = ['Invoice', 'Tanggal', 'Toko', 'Produk', 'Qty', 'Harga', 'Subtotal'];
    const rows = storeOrders.flatMap(order => 
      order.items.map(item => [
        order.id,
        new Date(order.createdAt).toLocaleDateString('id-ID'),
        order.storeName,
        item.productName,
        item.quantity,
        item.price,
        item.quantity * item.price
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Riwayat_Pesanan_${filterType}_${filterType === 'day' ? selectedDate : selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Riwayat Pesanan</h1>
          <p className="text-gray-600 mt-1">Lihat semua pesanan yang pernah dibuat</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={storeOrders.length === 0}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-sm"
        >
          <Download className="w-4 h-4" />
          Export ke CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          {/* Filter Type Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterType('day')}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
                filterType === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setFilterType('month')}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
                filterType === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Bulanan
            </button>
          </div>

          <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

          {/* Date Picker */}
          {filterType === 'day' ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Bulan:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

          {/* Store Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Toko:</span>
            <select
              value={selectedStoreFilter}
              onChange={(e) => setSelectedStoreFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 outline-none"
            >
              <option value="all">Semua Toko</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Brand:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 outline-none"
            >
              <option value="all">Semua</option>
              <option value="Fiesta">Fiesta</option>
              <option value="Shifudo">Shifudo</option>
            </select>
          </div>
        </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {storeOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Belum ada riwayat pesanan
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {storeOrders.map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.id}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">Rp {order.total.toLocaleString('id-ID')}</p>
                    </div>
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Detail Pesanan</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <p className="text-sm text-gray-500">
                              {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

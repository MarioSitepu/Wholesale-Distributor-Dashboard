import { TrendingUp, DollarSign, AlertTriangle, ShoppingBag, Download, MapPin } from 'lucide-react';
import KPICard from '../../components/KPICard';
import { getOrders, getProducts, getReceivables, getStores, getGlobalOrders, getGlobalProducts, getGlobalReceivables, getGlobalStores, getBranches } from '../../utils/mockData';
import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const userStr = localStorage.getItem('currentUser');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.branch === 'Pusat';

  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const allOrders = useMemo(() => isSuperAdmin ? getGlobalOrders() : getOrders(), [isSuperAdmin]);
  const allProducts = useMemo(() => isSuperAdmin ? getGlobalProducts() : getProducts(), [isSuperAdmin]);
  const allReceivables = useMemo(() => isSuperAdmin ? getGlobalReceivables() : getReceivables(), [isSuperAdmin]);
  const allStores = useMemo(() => isSuperAdmin ? getGlobalStores() : getStores(), [isSuperAdmin]);

  const orders = useMemo(() => 
    selectedBranch === 'all' ? allOrders : allOrders.filter(o => o.branch === selectedBranch),
    [allOrders, selectedBranch]
  );

  const products = useMemo(() => 
    selectedBranch === 'all' ? allProducts : allProducts.filter(p => (p as any).branch === selectedBranch),
    [allProducts, selectedBranch]
  );

  const receivables = useMemo(() => 
    selectedBranch === 'all' ? allReceivables : allReceivables.filter(r => (r as any).branch === selectedBranch),
    [allReceivables, selectedBranch]
  );

  const stores = useMemo(() => 
    selectedBranch === 'all' ? allStores : allStores.filter(s => s.branch === selectedBranch),
    [allStores, selectedBranch]
  );

  const [selectedReportStore, setSelectedReportStore] = useState<string>('all');
  const [selectedReportDate, setSelectedReportDate] = useState<string>(
    new Date().toLocaleDateString('en-CA')
  );

  const dailyReportData = useMemo(() => {
    let filteredOrders = orders;
    
    if (selectedReportDate) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDateLocal = new Date(order.createdAt).toLocaleDateString('en-CA');
        return orderDateLocal === selectedReportDate;
      });
    }

    if (selectedReportStore !== 'all') {
      filteredOrders = filteredOrders.filter(o => o.storeId === selectedReportStore);
    }

    const rows: { orderId: string, storeName: string, branch: string, productName: string, quantity: number, price: number, total: number }[] = [];
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        rows.push({
          orderId: order.id,
          storeName: order.storeName,
          branch: (order as any).branch || 'General',
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price
        });
      });
    });

    return rows;
  }, [orders, selectedReportStore, selectedReportDate]);

  const handleExportExcel = () => {
    if (dailyReportData.length === 0) return;
    
    const headers = isSuperAdmin 
      ? ['Cabang', 'Nomor Invoice', 'Nama Toko', 'Nama Produk', 'Jumlah Barang', 'Harga Satuan', 'Total Harga']
      : ['Nomor Invoice', 'Nama Toko', 'Nama Produk', 'Jumlah Barang', 'Harga Satuan', 'Total Harga'];

    const csvContent = [
      headers.join(','),
      ...dailyReportData.map(row => {
        const baseData = `"${row.orderId}","${row.storeName}","${row.productName}",${row.quantity},${row.price},${row.total}`;
        return isSuperAdmin ? `"${row.branch}",${baseData}` : baseData;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Penjualan_${selectedReportDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const dailySales = useMemo(() => {
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    });
    return todayOrders.reduce((sum, order) => sum + order.total, 0);
  }, [orders, today, currentMonth, currentYear]);

  const monthlySales = useMemo(() => {
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    });
    return monthOrders.reduce((sum, order) => sum + order.total, 0);
  }, [orders, currentMonth, currentYear]);

  const totalReceivables = receivables
    .filter(r => !r.isPaid)
    .reduce((sum, r) => sum + r.amount, 0);

  const lowStockProducts = products.filter(p => p.stock < 50);

  const weeklyData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate.getDate() === date.getDate() &&
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getFullYear() === date.getFullYear()
        );
      });
      const total = dayOrders.reduce((sum, order) => sum + order.total, 0);
      data.push({
        name: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        sales: total / 1000,
      });
    }
    return data;
  }, [orders]);

  const branchSalesData = useMemo(() => {
    if (!isSuperAdmin) return [];
    const branchMap: Record<string, number> = {};
    orders.forEach(order => {
      const branch = (order as any).branch || 'Unknown';
      branchMap[branch] = (branchMap[branch] || 0) + order.total;
    });
    return Object.entries(branchMap).map(([name, value]) => ({ name, value }));
  }, [orders, isSuperAdmin]);

  const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {isSuperAdmin 
              ? (selectedBranch === 'all' ? 'Overview Performa Seluruh Cabang' : `Overview Performa Cabang ${selectedBranch}`) 
              : `Overview Performa Cabang ${user?.branch}`}
          </p>
        </div>
        
        {isSuperAdmin && (
          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
              <MapPin className="w-5 h-5 text-blue-600" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-gray-700 cursor-pointer"
              >
                <option value="all">Semua Cabang</option>
                {getBranches().map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-blue-100 flex items-center gap-2">
              MODE PUSAT
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Penjualan Hari Ini"
          value={`Rp ${(dailySales / 1000).toFixed(0)}K`}
          icon={TrendingUp}
        />
        <KPICard
          title="Penjualan Bulan Ini"
          value={`Rp ${(monthlySales / 1000).toFixed(0)}K`}
          icon={ShoppingBag}
        />
        <KPICard
          title="Total Piutang"
          value={`Rp ${(totalReceivables / 1000).toFixed(0)}K`}
          icon={DollarSign}
          className={totalReceivables > 0 ? 'border-yellow-200' : ''}
        />
        <KPICard
          title="Stok Menipis"
          value={lowStockProducts.length}
          icon={AlertTriangle}
          className={lowStockProducts.length > 0 ? 'border-red-200' : ''}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Trend Penjualan Mingguan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" label={{ value: 'Penjualan (ribuan)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: number) => `Rp ${value.toFixed(0)}K`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
              />
              <Bar dataKey="sales" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {isSuperAdmin && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Kontribusi Cabang</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={branchSalesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {branchSalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `Rp ${(value/1000000).toFixed(1)}jt`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {branchSalesData.map((branch, index) => (
                <div key={branch.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-gray-600">{branch.name}</span>
                  </div>
                  <span className="font-bold">Rp {(branch.value/1000000).toFixed(1)}jt</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Produk Stok Menipis</h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Semua produk stok aman</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={`${product.id}-${(product as any).branch}`} className="flex justify-between items-center p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {isSuperAdmin && (
                        <span className="text-[9px] px-1 bg-white text-red-600 rounded border border-red-200 font-bold uppercase">
                          {(product as any).branch || 'Unknown'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">Stok: {product.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pesanan Terbaru</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada pesanan</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(-5).reverse().map((order) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{order.storeName}</p>
                      {isSuperAdmin && (
                        <span className="text-[9px] px-1 bg-blue-100 text-blue-600 rounded font-bold uppercase">
                          {order.branch}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">Rp {(order.total / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Laporan Penjualan Harian</h2>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <input 
              type="date" 
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedReportDate}
              onChange={(e) => setSelectedReportDate(e.target.value)}
            />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedReportStore}
              onChange={(e) => setSelectedReportStore(e.target.value)}
            >
              <option value="all">Semua Toko</option>
              {stores.map(s => (
                <option key={`${s.id}-${s.branch}`} value={s.id}>
                  {s.name} {isSuperAdmin ? `(${s.branch})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleExportExcel}
              disabled={dailyReportData.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-bold"
            >
              <Download className="w-4 h-4" />
              Export CSV (Excel)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                {isSuperAdmin && <th className="px-4 py-3 font-medium">Cabang</th>}
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Nama Toko</th>
                <th className="px-4 py-3 font-medium">Nama Produk</th>
                <th className="px-4 py-3 font-medium text-right">Jumlah</th>
                <th className="px-4 py-3 font-medium text-right">Harga Satuan</th>
                <th className="px-4 py-3 font-medium text-right">Total Harga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dailyReportData.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada transaksi pada tanggal dan toko tersebut.
                  </td>
                </tr>
              ) : (
                dailyReportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-bold uppercase">
                          {(row as any).branch}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">{row.orderId}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.storeName}</td>
                    <td className="px-4 py-3 text-gray-600">{row.productName}</td>
                    <td className="px-4 py-3 text-right">{row.quantity}</td>
                    <td className="px-4 py-3 text-right">Rp {row.price.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">Rp {row.total.toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

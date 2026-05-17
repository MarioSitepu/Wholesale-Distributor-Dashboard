import { TrendingUp, DollarSign, AlertTriangle, ShoppingBag, Download, MapPin } from 'lucide-react';
import KPICard from '../../components/KPICard';
import { getBranches, getStoresByBranch, getStores, Store } from '../../utils/mockData';
import { api } from '../../utils/apiClient';
import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast, Toaster } from 'sonner';

export default function AdminDashboard() {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.branch === 'Pusat';

  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [branches, setBranches] = useState<string[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  
  // Dashboard Analytics States
  const [kpis, setKpis] = useState({ todaySales: 0, monthlySales: 0, totalReceivables: 0, lowStockCount: 0 });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [branchSalesData, setBranchSalesData] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  
  // Daily Report States
  const [selectedReportStore, setSelectedReportStore] = useState<string>('all');
  const [selectedReportDate, setSelectedReportDate] = useState<string>(
    new Date().toLocaleDateString('en-CA')
  );
  const [dailyReportData, setDailyReportData] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // Load static/initial filters
  useEffect(() => {
    if (isSuperAdmin) {
      getBranches()
        .then(setBranches)
        .catch(err => toast.error('Gagal memuat cabang: ' + err.message));
    }
  }, [isSuperAdmin]);

  // Load stores based on active branch
  useEffect(() => {
    const targetBranch = isSuperAdmin ? selectedBranch : user?.branch;
    
    const fetchStores = async () => {
      try {
        const data = await getStoresByBranch(targetBranch);
        setStores(data);
      } catch (err: any) {
        toast.error('Gagal memuat daftar toko: ' + err.message);
      }
    };
    
    fetchStores();
  }, [isSuperAdmin, selectedBranch, user?.branch]);

  // Fetch Dashboard core metrics
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    const targetBranch = isSuperAdmin ? selectedBranch : user?.branch;
    try {
      // 1. Fetch KPIs
      const kpiRes = await api.get<any>(`/api/dashboard/kpi?branch=${targetBranch}`);
      setKpis(kpiRes);

      // 2. Fetch Weekly Trend
      const weeklyRes = await api.get<any[]>(`/api/dashboard/weekly-sales?branch=${targetBranch}`);
      setWeeklyData(weeklyRes);

      // 3. Fetch Branch Sales Contribution (Super Admin only)
      if (isSuperAdmin) {
        const contribRes = await api.get<any[]>(`/api/dashboard/branch-contribution`);
        setBranchSalesData(contribRes);
      }

      // 4. Fetch Low Stock
      const stockRes = await api.get<any[]>(`/api/dashboard/low-stock?branch=${targetBranch}`);
      setLowStockProducts(stockRes);

      // 5. Fetch Recent Orders
      const ordersRes = await api.get<any[]>(`/api/dashboard/recent-orders?branch=${targetBranch}`);
      setRecentOrders(ordersRes);

    } catch (err: any) {
      toast.error('Gagal memuat data analytics: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, selectedBranch, user?.branch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch Daily Report
  const fetchDailyReport = useCallback(async () => {
    if (!selectedReportDate) return;
    setIsReportLoading(true);
    const targetBranch = isSuperAdmin ? selectedBranch : user?.branch;
    try {
      const data = await api.get<any[]>(
        `/api/orders/daily-report?branch=${targetBranch}&date=${selectedReportDate}&storeId=${selectedReportStore}`
      );
      setDailyReportData(data);
    } catch (err: any) {
      toast.error('Gagal memuat laporan harian: ' + err.message);
    } finally {
      setIsReportLoading(false);
    }
  }, [isSuperAdmin, selectedBranch, selectedReportDate, selectedReportStore, user?.branch]);

  useEffect(() => {
    fetchDailyReport();
  }, [fetchDailyReport]);

  const handleExportExcel = () => {
    if (dailyReportData.length === 0) return;
    
    const headers = isSuperAdmin 
      ? ['Cabang', 'Nomor Faktur', 'Nama Toko', 'Nama Produk', 'Jumlah Barang', 'Harga Satuan', 'Total Harga']
      : ['Nomor Faktur', 'Nama Toko', 'Nama Produk', 'Jumlah Barang', 'Harga Satuan', 'Total Harga'];

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

  const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c'];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />
      
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
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-blue-100 flex items-center gap-2 animate-pulse">
              MODE PUSAT
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Penjualan Hari Ini"
          value={`Rp ${(kpis.todaySales / 1000).toFixed(0)}K`}
          icon={TrendingUp}
        />
        <KPICard
          title="Penjualan Bulan Ini"
          value={`Rp ${(kpis.monthlySales / 1000).toFixed(0)}K`}
          icon={ShoppingBag}
        />
        <KPICard
          title="Total Piutang"
          value={`Rp ${(kpis.totalReceivables / 1000).toFixed(0)}K`}
          icon={DollarSign}
          className={kpis.totalReceivables > 0 ? 'border-yellow-200' : ''}
        />
        <KPICard
          title="Stok Menipis"
          value={kpis.lowStockCount}
          icon={AlertTriangle}
          className={kpis.lowStockCount > 0 ? 'border-red-200' : ''}
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
            {branchSalesData.length === 0 ? (
              <p className="text-gray-500 text-center py-16">Belum ada data penjualan cabang</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={branchSalesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
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
              </>
            )}
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
                <div key={`${product.id}-${product.branch}`} className="flex justify-between items-center p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {isSuperAdmin && (
                        <span className="text-[9px] px-1 bg-white text-red-600 rounded border border-red-200 font-bold uppercase">
                          {product.branch || 'Unknown'}
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
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada pesanan</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
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
              disabled={dailyReportData.length === 0 || isReportLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-bold shadow-md shadow-green-100"
            >
              <Download className="w-4 h-4" />
              Export CSV (Excel)
            </button>
          </div>
        </div>

        {isReportLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <tr>
                  {isSuperAdmin && <th className="px-4 py-3 font-medium">Cabang</th>}
                  <th className="px-4 py-3 font-medium">Faktur</th>
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
                            {row.branch}
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
        )}
      </div>
    </div>
  );
}

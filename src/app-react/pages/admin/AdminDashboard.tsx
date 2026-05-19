import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ShoppingBag,
  Download,
  MapPin,
  RefreshCw,
} from "lucide-react";
import KPICard from "../../components/KPICard";
import {
  getOrders,
  getProducts,
  getReceivables,
  getStores,
  getGlobalOrders,
  getGlobalProducts,
  getGlobalReceivables,
  getGlobalStores,
  getBranches,
} from "../../utils/mockData";
import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import SalesTrendChart from "../../components/charts/SalesTrendChart";
import TopProductsChart from "../../components/charts/TopProductsChart";
import { getSalesTrend, getTopSellingProducts } from "../../utils/chartData";
import { exportToExcel } from "../../utils/excelExport";

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.branch === "Pusat";

  const activeBranch = useAppStore((state) => state.activeBranch);
  const setActiveBranch = useAppStore((state) => state.setActiveBranch);

  // Set fallback activeBranch to "all" if not set initially for SuperAdmin
  const selectedBranch = activeBranch || "all";
  const [refreshKey, setRefreshKey] = useState(0);

  const [trendPeriod, setTrendPeriod] = useState<"minggu" | "bulan" | "tahun">(
    "minggu",
  );
  const [trendValue, setTrendValue] = useState<number | undefined>(undefined);

  // Sync data dynamically by adding a refresh listener/interval
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const effectiveChartBranch =
    selectedBranch === "all" ? undefined : selectedBranch;

  const dataTrend = useMemo(
    () => getSalesTrend(trendPeriod, trendValue, effectiveChartBranch),
    [trendPeriod, trendValue, effectiveChartBranch, refreshKey],
  );

  const topProducts = useMemo(
    () => getTopSellingProducts(effectiveChartBranch),
    [effectiveChartBranch, refreshKey],
  );

  const allOrders = useMemo(
    () => (isSuperAdmin ? getGlobalOrders() : getOrders()),
    [isSuperAdmin, refreshKey],
  );
  const allProducts = useMemo(
    () => (isSuperAdmin ? getGlobalProducts() : getProducts()),
    [isSuperAdmin, refreshKey],
  );
  const allReceivables = useMemo(
    () => (isSuperAdmin ? getGlobalReceivables() : getReceivables()),
    [isSuperAdmin, refreshKey],
  );
  const allStores = useMemo(
    () => (isSuperAdmin ? getGlobalStores() : getStores()),
    [isSuperAdmin, refreshKey],
  );

  const orders = useMemo(
    () =>
      selectedBranch === "all"
        ? allOrders
        : allOrders.filter((o) => o.branch === selectedBranch),
    [allOrders, selectedBranch],
  );

  const products = useMemo(
    () =>
      selectedBranch === "all"
        ? allProducts
        : allProducts.filter((p) => (p as any).branch === selectedBranch),
    [allProducts, selectedBranch],
  );

  const receivables = useMemo(
    () =>
      selectedBranch === "all"
        ? allReceivables
        : allReceivables.filter((r) => (r as any).branch === selectedBranch),
    [allReceivables, selectedBranch],
  );

  const stores = useMemo(
    () =>
      selectedBranch === "all"
        ? allStores
        : allStores.filter((s) => s.branch === selectedBranch),
    [allStores, selectedBranch],
  );

  const [selectedReportStore, setSelectedReportStore] = useState<string>("all");
  const [selectedReportDate, setSelectedReportDate] = useState<string>(
    new Date().toLocaleDateString("en-CA"),
  );

  const dailyReportData = useMemo(() => {
    let filteredOrders = orders;

    if (selectedReportDate) {
      filteredOrders = filteredOrders.filter((order) => {
        const orderDateLocal = new Date(order.createdAt).toLocaleDateString(
          "en-CA",
        );
        return orderDateLocal === selectedReportDate;
      });
    }

    if (selectedReportStore !== "all") {
      filteredOrders = filteredOrders.filter(
        (o) => o.storeId === selectedReportStore,
      );
    }

    const rows: {
      orderId: string;
      storeName: string;
      branch: string;
      productName: string;
      quantity: number;
      price: number;
      total: number;
    }[] = [];
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        rows.push({
          orderId: order.id,
          storeName: order.storeName,
          branch: (order as any).branch || "General",
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
        });
      });
    });

    return rows;
  }, [orders, selectedReportStore, selectedReportDate]);

  const handleExportExcel = () => {
    if (dailyReportData.length === 0) return;

    const headers = isSuperAdmin
      ? [
          "Cabang",
          "Nomor Faktur",
          "Nama Toko",
          "Nama Produk",
          "Jumlah Barang",
          "Harga Satuan",
          "Total Harga",
        ]
      : [
          "Nomor Faktur",
          "Nama Toko",
          "Nama Produk",
          "Jumlah Barang",
          "Harga Satuan",
          "Total Harga",
        ];

    const rows = dailyReportData.map((row) => {
      const baseData = [
        row.orderId,
        row.storeName,
        row.productName,
        row.quantity,
        row.price,
        row.total,
      ];
      return isSuperAdmin ? [row.branch, ...baseData] : baseData;
    });

    const alignments: ("left" | "center" | "right")[] = isSuperAdmin
      ? ["center", "center", "left", "left", "center", "right", "right"]
      : ["center", "left", "left", "center", "right", "right"];

    const types: ("text" | "number" | "currency")[] = isSuperAdmin
      ? ["text", "text", "text", "text", "number", "currency", "currency"]
      : ["text", "text", "text", "number", "currency", "currency"];

    exportToExcel({
      filename: `Laporan_Penjualan_${selectedReportDate}.xls`,
      title: "LAPORAN PENJUALAN HARIAN",
      subtitle: `Tanggal: ${selectedReportDate} | Cabang: ${isSuperAdmin ? (selectedBranch === "all" ? "Semua Cabang" : selectedBranch) : user?.branch}`,
      headers,
      rows,
      alignments,
      types,
      showTotalRow: true,
    });
  };

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const dailySales = useMemo(() => {
    const todayOrders = orders.filter((order) => {
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
    const monthOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    });
    return monthOrders.reduce((sum, order) => sum + order.total, 0);
  }, [orders, currentMonth, currentYear]);

  const totalReceivables = receivables
    .filter((r) => !r.isPaid)
    .reduce((sum, r) => sum + r.amount, 0);

  const lowStockProducts = products.filter((p) => p.stock < 50);

  const weeklyData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate.getDate() === date.getDate() &&
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getFullYear() === date.getFullYear()
        );
      });
      const total = dayOrders.reduce((sum, order) => sum + order.total, 0);
      data.push({
        name: date.toLocaleDateString("id-ID", { weekday: "short" }),
        sales: total / 1000,
      });
    }
    return data;
  }, [orders]);

  const branchSalesData = useMemo(() => {
    if (!isSuperAdmin) return [];
    const branchMap: Record<string, number> = {};
    orders.forEach((order) => {
      const branch = (order as any).branch || "Unknown";
      branchMap[branch] = (branchMap[branch] || 0) + order.total;
    });
    return Object.entries(branchMap).map(([name, value]) => ({ name, value }));
  }, [orders, isSuperAdmin]);

  const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            {isSuperAdmin
              ? selectedBranch === "all"
                ? "Overview Performa Seluruh Cabang"
                : `Overview Performa Cabang ${selectedBranch}`
              : `Overview Performa Cabang ${user?.branch}`}
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
              <MapPin className="w-5 h-5 text-blue-600" />
              <select
                value={selectedBranch}
                onChange={(e) => setActiveBranch(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-gray-700 cursor-pointer"
              >
                <option value="all">Semua Cabang</option>
                {getBranches().map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-blue-100 flex items-center gap-2">
              MODE PUSAT
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          className={totalReceivables > 0 ? "border-yellow-200" : ""}
        />
        <KPICard
          title="Stok Menipis"
          value={lowStockProducts.length}
          icon={AlertTriangle}
          className={lowStockProducts.length > 0 ? "border-red-200" : ""}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3 bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
          <button
            onClick={handleRefresh}
            className="absolute top-6 right-6 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors z-10"
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pr-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">
              Tren Penjualan
            </h2>
            <div className="flex flex-wrap gap-2">
              <select
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none"
                value={trendPeriod}
                onChange={(e) => {
                  setTrendPeriod(e.target.value as any);
                  setTrendValue(undefined);
                }}
              >
                <option value="minggu">Minggu Ini</option>
                <option value="bulan">Bulan</option>
                <option value="tahun">Tahun</option>
              </select>

              {trendPeriod === "bulan" && (
                <select
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none"
                  value={
                    trendValue !== undefined
                      ? trendValue
                      : new Date().getMonth()
                  }
                  onChange={(e) => setTrendValue(Number(e.target.value))}
                >
                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "Mei",
                    "Jun",
                    "Jul",
                    "Ags",
                    "Sep",
                    "Okt",
                    "Nov",
                    "Des",
                  ].map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              )}

              {trendPeriod === "tahun" && (
                <select
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none"
                  value={
                    trendValue !== undefined
                      ? trendValue
                      : new Date().getFullYear()
                  }
                  onChange={(e) => setTrendValue(Number(e.target.value))}
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <SalesTrendChart data={dataTrend} />
        </div>

        <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Produk Terlaris
          </h2>
          <TopProductsChart data={topProducts} />
        </div>
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Kontribusi Cabang
            </h2>
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
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    `Rp ${(value / 1000000).toFixed(1)}jt`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {branchSalesData.map((branch, index) => (
                <div
                  key={branch.name}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-gray-600">{branch.name}</span>
                  </div>
                  <span className="font-bold">
                    Rp {(branch.value / 1000000).toFixed(1)}jt
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Produk Stok Menipis
          </h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Semua produk stok aman
            </p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={`${product.id}-${(product as any).branch}`}
                  className="flex justify-between items-center p-3 bg-white rounded-lg border border-red-200"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>
                      {isSuperAdmin && (
                        <span className="text-[9px] px-1 bg-white text-red-600 rounded border border-red-200 font-bold uppercase">
                          {(product as any).branch || "Unknown"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      Stok: {product.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Pesanan Terbaru
          </h2>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada pesanan</p>
          ) : (
            <div className="space-y-3">
              {orders
                .slice(-5)
                .reverse()
                .map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {order.storeName}
                        </p>
                        {isSuperAdmin && (
                          <span className="text-[9px] px-1 bg-blue-100 text-blue-600 rounded font-bold uppercase">
                            {order.branch}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        Rp {(order.total / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Laporan Penjualan Harian
          </h2>
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
              {stores.map((s) => (
                <option key={`${s.id}-${s.branch}`} value={s.id}>
                  {s.name} {isSuperAdmin ? `(${s.branch})` : ""}
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
                {isSuperAdmin && (
                  <th className="px-4 py-3 font-medium">Cabang</th>
                )}
                <th className="px-4 py-3 font-medium">Faktur</th>
                <th className="px-4 py-3 font-medium">Nama Toko</th>
                <th className="px-4 py-3 font-medium">Nama Produk</th>
                <th className="px-4 py-3 font-medium text-right">Jumlah</th>
                <th className="px-4 py-3 font-medium text-right">
                  Harga Satuan
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  Total Harga
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dailyReportData.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 7 : 6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
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
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {row.storeName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.productName}
                    </td>
                    <td className="px-4 py-3 text-right">{row.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      Rp {row.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      Rp {row.total.toLocaleString("id-ID")}
                    </td>
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

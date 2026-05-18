import { useState, Fragment, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  MapPin,
  Database,
} from "lucide-react";
import {
  getOrders,
  getStores,
  getProducts,
  getGlobalOrders,
  getGlobalStores,
  getBranches,
  getCategories,
  getDatabaseSize,
} from "../../utils/mockData";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";

export default function OrderHistory() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.branch === "Pusat";
  const activeBranch = useAppStore((state) => state.activeBranch);
  const selectedCategory = useAppStore((state) => state.selectedCategory);
  const setActiveBranch = useAppStore((state) => state.setActiveBranch);
  const setSelectedCategory = useAppStore((state) => state.setSelectedCategory);
  const branchFilter = isSuperAdmin ? activeBranch || "all" : "all";
  const categoryFilter = selectedCategory || "all";

  const allOrders = isSuperAdmin ? getGlobalOrders() : getOrders();
  const stores = isSuperAdmin ? getGlobalStores() : getStores();
  const products = getProducts();

  const today = new Date().toLocaleDateString("en-CA");
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<"day" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [dbSize, setDbSize] = useState({
    usedBytes: 0,
    totalBytes: 5000000,
    percentage: 0,
  });

  useEffect(() => {
    setCategories(getCategories());
    setDbSize(getDatabaseSize());
  }, []);

  const filteredOrders = allOrders.filter((order) => {
    const matchesBranch =
      branchFilter === "all" || (order as any).branch === branchFilter;
    const matchesStore =
      selectedStoreFilter === "all" || order.storeId === selectedStoreFilter;

    // Determine order category
    const firstItem = order.items[0];
    const product = products.find((p) => p.id === firstItem?.productId);
    const orderCategory = product?.category || "General";
    const matchesCategory =
      categoryFilter === "all" || orderCategory === categoryFilter;

    // Date filtering
    const dateObj = new Date(order.createdAt);
    const orderDateLocal = dateObj.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const orderMonthLocal = orderDateLocal.slice(0, 7); // YYYY-MM

    let matchesDate = false;

    if (filterType === "day") {
      matchesDate = orderDateLocal === selectedDate;
    } else {
      matchesDate = orderMonthLocal === selectedMonth;
    }

    return matchesBranch && matchesStore && matchesCategory && matchesDate;
  });

  const storeOrders = [...filteredOrders].reverse();

  const handleExportCSV = () => {
    if (storeOrders.length === 0) return;

    const headers = isSuperAdmin
      ? [
          "Cabang",
          "Faktur",
          "Tanggal",
          "Toko",
          "Produk",
          "Qty",
          "Harga",
          "Subtotal",
        ]
      : ["Faktur", "Tanggal", "Toko", "Produk", "Qty", "Harga", "Subtotal"];

    const rows = storeOrders.flatMap((order) =>
      order.items.map((item) => {
        const base = [
          order.id,
          new Date(order.createdAt).toLocaleDateString("id-ID"),
          order.storeName,
          item.productName,
          item.quantity,
          item.price,
          item.quantity * item.price,
        ];
        return isSuperAdmin ? [(order as any).branch, ...base] : base;
      }),
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Riwayat_Pesanan_${filterType}_${filterType === "day" ? selectedDate : selectedMonth}.csv`,
    );
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
          <h1 className="text-3xl font-semibold text-gray-900">
            Riwayat Pesanan
          </h1>
          <p className="text-gray-600 mt-1">
            Lihat semua pesanan yang pernah dibuat
          </p>
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

      {/* Database Storage Widget */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-800">
              Kapasitas Penyimpanan
            </h3>
          </div>
          <span className="text-sm font-medium text-gray-600">
            Tersisa:{" "}
            {((dbSize.totalBytes - dbSize.usedBytes) / 1000000).toFixed(2)} MB
            dari {(dbSize.totalBytes / 1000000).toFixed(0)} MB
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              dbSize.percentage > 95
                ? "bg-red-600 animate-pulse"
                : dbSize.percentage >= 80
                  ? "bg-orange-500"
                  : dbSize.percentage >= 50
                    ? "bg-yellow-500"
                    : "bg-green-500"
            }`}
            style={{ width: `${Math.min(dbSize.percentage, 100)}%` }}
          ></div>
        </div>

        <p
          className={`text-sm font-semibold ${
            dbSize.percentage > 95
              ? "text-red-600"
              : dbSize.percentage >= 80
                ? "text-orange-600"
                : dbSize.percentage >= 50
                  ? "text-yellow-600"
                  : "text-green-600"
          }`}
        >
          {dbSize.percentage > 95
            ? "Status Kritis! Bersihkan riwayat lama agar sistem tidak crash."
            : dbSize.percentage >= 80
              ? "Penyimpanan hampir penuh, hapus data segera!"
              : dbSize.percentage >= 50
                ? "Penyimpanan cukup. Performa sistem optimal."
                : "Penyimpanan aman. Ruang basis data sangat lega."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filter:</span>
        </div>

        {/* Filter Type Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterType("day")}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
              filterType === "day"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setFilterType("month")}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
              filterType === "month"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Bulanan
          </button>
        </div>

        {/* Date Picker */}
        {filterType === "day" ? (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        ) : (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        )}

        {isSuperAdmin && (
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
            <MapPin className="w-4 h-4 text-blue-600" />
            <select
              value={branchFilter}
              onChange={(e) => {
                setActiveBranch(e.target.value === "all" ? "" : e.target.value);
                setSelectedStoreFilter("all");
              }}
              className="bg-transparent border-none outline-none text-sm font-bold text-blue-700 cursor-pointer"
            >
              <option value="all">Semua Cabang</option>
              {getBranches().map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
        )}

        <select
          value={selectedStoreFilter}
          onChange={(e) => setSelectedStoreFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 outline-none"
        >
          <option value="all">Semua Toko</option>
          {stores
            .filter((s) => branchFilter === "all" || s.branch === branchFilter)
            .map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}{" "}
                {isSuperAdmin && branchFilter === "all"
                  ? `(${store.branch})`
                  : ""}
              </option>
            ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) =>
            setSelectedCategory(e.target.value === "all" ? "" : e.target.value)
          }
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 outline-none"
        >
          <option value="all">Semua Brand</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Status</th>
                {isSuperAdmin && (
                  <th className="px-6 py-4 text-blue-600">Cabang</th>
                )}
                <th className="px-6 py-4">Faktur</th>
                <th className="px-6 py-4">Toko</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {storeOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 7 : 6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Belum ada riwayat pesanan.
                  </td>
                </tr>
              ) : (
                storeOrders.map((order) => {
                  const uniqueKey = `${(order as any).branch || "General"}|${order.id}`;
                  return (
                    <Fragment key={uniqueKey}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
                            Selesai
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="px-6 py-4 font-bold text-blue-700">
                            {(order as any).branch}
                          </td>
                        )}
                        <td className="px-6 py-4 font-mono font-medium">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {order.storeName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString(
                            "id-ID",
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                          Rp {order.total.toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"
                          >
                            {expandedOrder === order.id ? (
                              <ChevronUp />
                            ) : (
                              <ChevronDown />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedOrder === order.id && (
                        <tr className="bg-gray-50">
                          <td
                            colSpan={isSuperAdmin ? 7 : 6}
                            className="px-6 py-4"
                          >
                            <div className="space-y-2">
                              <p className="font-bold text-gray-700 text-xs uppercase mb-3">
                                Detail Produk:
                              </p>
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900">
                                        {item.productName}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {item.quantity} x Rp{" "}
                                        {item.price.toLocaleString("id-ID")}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="font-bold text-blue-600">
                                    Rp{" "}
                                    {(
                                      item.quantity * item.price
                                    ).toLocaleString("id-ID")}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

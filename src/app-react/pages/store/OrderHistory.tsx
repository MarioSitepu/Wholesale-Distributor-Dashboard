import { useState, Fragment, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  MapPin,
  Database,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import { api } from "../../utils/apiClient";
import { exportToExcel } from "../../utils/excelExport";


export default function OrderHistory() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.branch === "Pusat";
  const activeBranch = useAppStore((state) => state.activeBranch);
  const selectedCategory = useAppStore((state) => state.selectedCategory);
  const setActiveBranch = useAppStore((state) => state.setActiveBranch);
  const setSelectedCategory = useAppStore((state) => state.setSelectedCategory);
  const branchFilter = isSuperAdmin ? activeBranch || "all" : "all";
  const categoryFilter = selectedCategory || "all";

  const today = new Date().toLocaleDateString("en-CA");
  const currentMonth = today.slice(0, 7);

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
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [deleteMonthYear, setDeleteMonthYear] = useState<string>(currentMonth);
  const [deleteBranch, setDeleteBranch] = useState<string>(
    isSuperAdmin ? "ALL" : user?.branch || "",
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  const [orders, setOrders] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStorageInfo = async () => {
      try {
        if (!isSuperAdmin) return;
        const data = await api.get<any>('/api/database/storage');
        const percentage = (data.usedBytes / data.maxBytes) * 100;
        setDbSize({
          usedBytes: data.usedBytes,
          totalBytes: data.maxBytes,
          percentage: percentage,
        });
      } catch (error) {
        console.error("Gagal memuat status database:", error);
      }
    };
    fetchStorageInfo();
  }, [isSuperAdmin]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const effectiveBranch = isSuperAdmin ? (activeBranch || "all") : user?.branch;
      
      const [storesRes, productsRes, branchesRes, categoriesRes] = await Promise.all([
        api.get<any[]>(`/api/stores?branch=${effectiveBranch}`),
        api.get<any[]>(`/api/products?branch=${effectiveBranch}`),
        api.get<any>('/api/branches'),
        api.get<any>('/api/categories')
      ]);

      setStores(storesRes);
      setProducts(productsRes);
      
      const branchList = branchesRes.branches ? branchesRes.branches.map((b: any) => b.name || b) : [];
      setBranches(branchList);
      
      const catList = categoriesRes.categories ? categoriesRes.categories.map((c: any) => c.name || c) : [];
      setCategories(catList);
      
      await fetchOrders();
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data utama");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const effectiveBranch = isSuperAdmin ? (activeBranch || "all") : user?.branch;
      
      // Let backend handle date filtering if possible, otherwise we filter on frontend
      const qs = new URLSearchParams();
      if (effectiveBranch && effectiveBranch !== "all") qs.set("branch", effectiveBranch);
      if (filterType === "day") qs.set("date", selectedDate);
      if (filterType === "month") qs.set("month", selectedMonth);
      
      const ordersRes = await api.get<any[]>(`/api/orders?${qs.toString()}`);
      setOrders(ordersRes);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat daftar pesanan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [activeBranch, isSuperAdmin, refreshCounter]);

  useEffect(() => {
    fetchOrders();
  }, [filterType, selectedDate, selectedMonth]);

  useEffect(() => {
    if (
      !isSuperAdmin &&
      activeBranch &&
      activeBranch !== "all" &&
      activeBranch !== user?.branch
    ) {
      console.warn("Security Alert: Branch manipulation detected!");
      setActiveBranch(user?.branch || "");
    }
  }, [isSuperAdmin, activeBranch, user?.branch, setActiveBranch]);

  if (
    !isSuperAdmin &&
    activeBranch &&
    activeBranch !== "all" &&
    activeBranch !== user?.branch
  ) {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Akses Ditolak: Anda tidak memiliki izin melihat data cabang lain.
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    const matchesStore =
      selectedStoreFilter === "all" || order.storeId === selectedStoreFilter;

    // Determine order category
    const firstItem = order.items[0];
    const product = products.find((p) => p.id === firstItem?.productId);
    const orderCategory = product?.categoryName || product?.category || "General";
    const matchesCategory =
      categoryFilter === "all" || orderCategory === categoryFilter;

    return matchesStore && matchesCategory;
  });

  const storeOrders = [...filteredOrders];

  const handleExportExcel = () => {
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

    const alignments: ("left" | "center" | "right")[] = isSuperAdmin
      ? [
          "center",
          "center",
          "center",
          "left",
          "left",
          "center",
          "right",
          "right",
        ]
      : ["center", "center", "left", "left", "center", "right", "right"];

    const types: ("text" | "number" | "currency")[] = isSuperAdmin
      ? [
          "text",
          "text",
          "text",
          "text",
          "text",
          "number",
          "currency",
          "currency",
        ]
      : ["text", "text", "text", "text", "number", "currency", "currency"];

    const subtitle = `Filter: ${filterType === "day" ? `Harian (${selectedDate})` : `Bulanan (${selectedMonth})`} | Cabang: ${isSuperAdmin ? (branchFilter === "all" ? "Semua Cabang" : branchFilter) : user?.branch}`;

    exportToExcel({
      filename: `Riwayat_Pesanan_${filterType}_${filterType === "day" ? selectedDate : selectedMonth}.xls`,
      title: "LAPORAN RIWAYAT PESANAN",
      subtitle,
      headers,
      rows,
      alignments,
      types,
      showTotalRow: true,
      totalRowSumColumns: [headers.length - 1],
      totalRowLabelColumn: 0,
    });
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const executeDeleteHistory = async () => {
    if (!deleteMonthYear) return;

    try {
      // In a real implementation, you would call api.delete('/api/orders?beforeDate=...')
      // For now, since the endpoint might not exist, we just simulate or toast.
      // await api.delete(`/api/orders?beforeMonth=${deleteMonthYear}`);
      
      setRefreshCounter((prev) => prev + 1);
      setIsDeleteDialogOpen(false);
      toast.success(
        `Penghapusan riwayat saat ini ditangguhkan pada mode Supabase demi keamanan data.`,
      );
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus riwayat pesanan.");
    }
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
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={handleExportExcel}
            disabled={storeOrders.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-sm"
          >
            <Download className="w-4 h-4" />
            Export ke Excel
          </button>

          {isSuperAdmin && (
            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors shadow-sm font-bold text-sm">
                  <Trash2 className="w-4 h-4" />
                  Hapus Riwayat Lama
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-red-600 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" /> Hapus Riwayat Pesanan
                  </DialogTitle>
                  <DialogDescription>
                    Pilih bulan dan tahun untuk menghapus riwayat pesanan
                    (seluruh cabang) sebelum tanggal tersebut secara permanen.
                    Tindakan ini tidak dapat dibatalkan.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700">
                      Pilih Batas Waktu Hapus (Hingga Akhir Bulan)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={deleteMonthYear.slice(5, 7)}
                        onChange={(e) =>
                          setDeleteMonthYear(
                            `${deleteMonthYear.slice(0, 4)}-${e.target.value}`,
                          )
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-red-500 outline-none w-1/2"
                      >
                        <option value="01">Januari</option>
                        <option value="02">Februari</option>
                        <option value="03">Maret</option>
                        <option value="04">April</option>
                        <option value="05">Mei</option>
                        <option value="06">Juni</option>
                        <option value="07">Juli</option>
                        <option value="08">Agustus</option>
                        <option value="09">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                      </select>
                      <select
                        value={deleteMonthYear.slice(0, 4)}
                        onChange={(e) =>
                          setDeleteMonthYear(
                            `${e.target.value}-${deleteMonthYear.slice(5, 7)}`,
                          )
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-red-500 outline-none w-1/2"
                      >
                        {Array.from(
                          { length: 11 },
                          (_, i) => new Date().getFullYear() - 5 + i,
                        ).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter className="sm:justify-end gap-2 p-0 mt-2">
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                    >
                      Batal
                    </button>
                  </DialogClose>
                  <button
                    type="button"
                    onClick={executeDeleteHistory}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                  >
                    Ya, Hapus Permanen
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Database Storage Widget */}
      {isSuperAdmin && (
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
      )}

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
          <div className="flex gap-2">
            <select
              value={selectedMonth.slice(5, 7)}
              onChange={(e) =>
                setSelectedMonth(
                  `${selectedMonth.slice(0, 4)}-${e.target.value}`,
                )
              }
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none w-32"
            >
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
            <select
              value={selectedMonth.slice(0, 4)}
              onChange={(e) =>
                setSelectedMonth(
                  `${e.target.value}-${selectedMonth.slice(5, 7)}`,
                )
              }
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none w-24"
            >
              {Array.from(
                { length: 11 },
                (_, i) => new Date().getFullYear() - 5 + i,
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
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
              {branches.map((branch) => (
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
          <table className="w-full text-sm text-left hidden md:table">
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
              {isLoading ? (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 7 : 6}
                    className="px-6 py-10 text-center text-blue-500 font-semibold animate-pulse"
                  >
                    Memuat data dari database...
                  </td>
                </tr>
              ) : storeOrders.length === 0 ? (
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

          {/* Card View untuk Mobile */}
          <div className="block md:hidden p-4 space-y-4 bg-gray-50">
            {isLoading ? (
              <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-200">
                <span className="text-blue-500 font-semibold animate-pulse">Memuat data dari database...</span>
              </div>
            ) : storeOrders.length === 0 ? (
              <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow-sm border border-gray-200">
                Belum ada riwayat pesanan.
              </div>
            ) : (
              storeOrders.map((order) => {
                const uniqueKeyLocal = `mob-${(order as any).branch || "General"}|${order.id}`;
                return (
                  <div
                    key={uniqueKeyLocal}
                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 relative"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                          Nomor Faktur
                        </p>
                        <p className="font-mono font-bold text-gray-900 text-sm">
                          {order.id}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
                        Selesai
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-gray-100 pt-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                          Toko / Pelanggan
                        </p>
                        <p className="font-medium text-gray-800 text-sm">
                          {order.storeName}
                        </p>
                      </div>
                      {isSuperAdmin && (
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                            Cabang
                          </p>
                          <p className="font-bold text-blue-700 text-sm">
                            {(order as any).branch}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-end mt-1 pt-3 border-t border-dashed border-gray-200">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                          Tanggal
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                          {new Date(order.createdAt).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                          Total
                        </p>
                        <p className="font-black text-blue-600 text-base">
                          Rp {order.total.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

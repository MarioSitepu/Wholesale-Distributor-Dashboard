import { useState, useEffect } from "react";

import { Check, AlertCircle, MapPin, Clock } from "lucide-react";
import { api } from "../../utils/apiClient";
import { toast, Toaster } from "sonner";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";


export default function ReceivablesManagement() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.branch === "Pusat";
  const activeBranch = useAppStore((state) => state.activeBranch);
  const setActiveBranch = useAppStore((state) => state.setActiveBranch);
  const branchFilter = isSuperAdmin ? activeBranch || "all" : "all";

  const [receivables, setReceivables] = useState<any[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<
    (typeof receivables)[number] | null
  >(null);

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

  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const fetchReceivables = async () => {
    try {
      setIsLoading(true);
      const effectiveBranch = isSuperAdmin ? (branchFilter === "all" ? "Pusat" : branchFilter) : user?.branch;
      const res = await api.get<any[]>(`/api/receivables?branch=${effectiveBranch || ''}`);
      setReceivables(res);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data piutang");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      if (!isSuperAdmin) return;
      const res = await api.get<any>('/api/branches');
      setBranches(res.branches ? res.branches.map((b: any) => b.name || b) : []);
    } catch (error) {
      console.error("Failed to load branches");
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchReceivables();
  }, [isSuperAdmin, branchFilter]);

  const handleOpenPayment = (id: string) => {
    const receivable = receivables.find((r) => r.id === id);
    if (!receivable) return;

    setSelectedReceivable(receivable);
    setIsPaymentOpen(true);
  };

  const refreshReceivables = () => {
    fetchReceivables();
  };

  const handlePaymentSubmit = async () => {
    if (!selectedReceivable) return;

    setIsSubmittingPayment(true);
    try {
      await api.patch(`/api/receivables/${selectedReceivable.id}/pay`, {});
      toast.success("Piutang berhasil dilunasi");
      refreshReceivables();
      setIsPaymentOpen(false);
      setSelectedReceivable(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal melunasi piutang");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const unpaidReceivables = receivables.filter((r) => !r.isPaid);
  const paidReceivables = receivables.filter((r) => r.isPaid);

  const totalUnpaid = unpaidReceivables.reduce((sum, r) => sum + r.amount, 0);

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const receivablesByStore = unpaidReceivables.reduce(
    (acc, r) => {
      if (!acc[r.storeId]) {
        acc[r.storeId] = {
          storeName: r.storeName,
          total: 0,
          count: 0,
        };
      }
      acc[r.storeId].total += r.amount;
      acc[r.storeId].count += 1;
      return acc;
    },
    {} as Record<string, { storeName: string; total: number; count: number }>,
  );

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Kelola Piutang
            </h1>
            <p className="text-gray-600 mt-1">Pantau dan kelola piutang toko</p>
          </div>

          {isSuperAdmin && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
              <MapPin className="w-5 h-5 text-blue-600" />
              <select
                value={branchFilter}
                onChange={(e) =>
                  setActiveBranch(
                    e.target.value === "all" ? "" : e.target.value,
                  )
                }
                className="bg-transparent border-none outline-none font-bold text-gray-700 cursor-pointer"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Total Piutang Belum Lunas
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  Rp {totalUnpaid.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Piutang Jatuh Tempo</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {unpaidReceivables.filter((r) => isOverdue(r.dueDate)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Check className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toko dengan Piutang</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Object.keys(receivablesByStore).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ringkasan per Toko
          </h2>
          {Object.keys(receivablesByStore).length === 0 ? (
            <p className="text-gray-500 text-center py-8">Tidak ada piutang</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(receivablesByStore).map(([storeId, data]) => (
                <div
                  key={storeId}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {data.storeName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-1">
                    {data.count} pesanan belum lunas
                  </p>
                  <p className="text-xl font-semibold text-red-600">
                    Rp {data.total.toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Piutang Belum Lunas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Toko
                  </th>
                  {isSuperAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                      Cabang
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. Faktur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Piutang
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jatuh Tempo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-blue-500 font-semibold animate-pulse"
                    >
                      Memuat data dari database...
                    </td>
                  </tr>
                ) : unpaidReceivables.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Tidak ada piutang belum lunas
                    </td>
                  </tr>
                ) : (
                  unpaidReceivables.map((receivable) => {
                    const overdue = isOverdue(receivable.dueDate);
                    return (
                      <tr
                        key={receivable.id}
                        className={overdue ? "bg-red-50" : "hover:bg-gray-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {receivable.storeName}
                        </td>
                        {isSuperAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-blue-600">
                              {(receivable as any).branch}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {receivable.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Rp {receivable.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                overdue
                                  ? "text-red-600 font-medium"
                                  : "text-gray-900"
                              }
                            >
                              {new Date(receivable.dueDate).toLocaleDateString(
                                "id-ID",
                              )}
                            </span>
                            {overdue && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Jatuh Tempo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleOpenPayment(receivable.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Bayar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {paidReceivables.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Riwayat Piutang Lunas
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Toko
                    </th>
                    {isSuperAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                        Cabang
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Pesanan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paidReceivables.map((receivable) => (
                    <tr key={receivable.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receivable.storeName}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">
                            {(receivable as any).branch}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receivable.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rp {receivable.amount.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          Lunas
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isPaymentOpen && selectedReceivable && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Pembayaran Piutang
                </h2>
                <p className="text-gray-500 mb-4 text-sm">
                  {selectedReceivable.storeName} • Sisa piutang Rp{" "}
                  {selectedReceivable.amount.toLocaleString("id-ID")}
                </p>

                <div className="space-y-4">
                  <p className="text-gray-700">
                    Apakah Anda yakin ingin menandai piutang ini sebagai lunas?
                  </p>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPaymentOpen(false);
                        setSelectedReceivable(null);
                      }}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handlePaymentSubmit}
                      disabled={isSubmittingPayment}
                      className="flex-1 py-3 px-4 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-100 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                    >
                      {isSubmittingPayment ? "Memproses..." : "Ya, Lunas"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

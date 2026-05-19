import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, AlertCircle, MapPin, Clock } from "lucide-react";
import {
  getReceivables,
  applyReceivablePayment,
  getGlobalReceivables,
  getBranches,
} from "../../utils/mockData";
import { toast, Toaster } from "sonner";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import { paymentSchema, PaymentFormValues } from "../../schemas/paymentSchema";
import { InputError } from "../../components/ui/ErrorMessage";

export default function ReceivablesManagement() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.branch === "Pusat";
  const activeBranch = useAppStore((state) => state.activeBranch);
  const setActiveBranch = useAppStore((state) => state.setActiveBranch);
  const branchFilter = isSuperAdmin ? activeBranch || "all" : "all";

  const [receivables, setReceivables] = useState(
    isSuperAdmin ? getGlobalReceivables() : getReceivables(),
  );
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<
    (typeof receivables)[number] | null
  >(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    mode: "onChange",
    defaultValues: {
      amount: 0,
      paymentMethod: "Cash",
      date: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    let allReceivables = isSuperAdmin
      ? getGlobalReceivables()
      : getReceivables();
    if (isSuperAdmin && branchFilter !== "all") {
      allReceivables = allReceivables.filter(
        (r) => (r as any).branch === branchFilter,
      );
    }
    setReceivables(allReceivables);
  }, [isSuperAdmin, branchFilter]);

  const handleOpenPayment = (id: string) => {
    const receivable = receivables.find((r) => r.id === id);
    if (!receivable) return;

    setSelectedReceivable(receivable);
    reset({
      amount: receivable.amount,
      paymentMethod: "Cash",
      date: new Date().toISOString().slice(0, 10),
    });
    setIsPaymentOpen(true);
  };

  const refreshReceivables = () => {
    let allReceivables = isSuperAdmin
      ? getGlobalReceivables()
      : getReceivables();
    if (isSuperAdmin && branchFilter !== "all") {
      allReceivables = allReceivables.filter(
        (r) => (r as any).branch === branchFilter,
      );
    }
    setReceivables(allReceivables);
  };

  const handlePaymentSubmit = async (data: PaymentFormValues) => {
    if (!selectedReceivable) return;

    const currentDebt = selectedReceivable.amount;
    if (data.amount > currentDebt) {
      toast.error("Nominal bayar melebihi sisa piutang!");
      return;
    }

    const branchToUse = (selectedReceivable as any).branch || user?.branch;
    const result = applyReceivablePayment(
      selectedReceivable.id,
      data.amount,
      branchToUse,
    );

    if (!result) {
      toast.error("Data piutang tidak ditemukan");
      return;
    }

    refreshReceivables();
    setIsPaymentOpen(false);
    setSelectedReceivable(null);

    if (result.remainingAmount === 0) {
      toast.success("Piutang berhasil dilunasi");
    } else {
      toast.success(
        `Pembayaran dicatat. Sisa piutang: Rp ${result.remainingAmount.toLocaleString("id-ID")}`,
      );
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
                {getBranches().map((branch) => (
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
                {unpaidReceivables.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
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

                <form
                  onSubmit={handleSubmit(handlePaymentSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                      Nominal Bayar
                    </label>
                    <input
                      type="number"
                      {...register("amount", { valueAsNumber: true })}
                      className={`w-full bg-gray-50 border rounded-xl py-3 px-4 outline-none transition-all ${
                        errors.amount
                          ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500"
                          : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                      }`}
                      placeholder="Contoh: 500000"
                    />
                    <InputError message={errors.amount?.message} />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                      Metode Pembayaran
                    </label>
                    <select
                      {...register("paymentMethod")}
                      className={`w-full bg-gray-50 border rounded-xl py-3 px-4 outline-none transition-all ${
                        errors.paymentMethod
                          ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500"
                          : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                      }`}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Transfer Bank">Transfer Bank</option>
                    </select>
                    <InputError message={errors.paymentMethod?.message} />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                      Tanggal Bayar
                    </label>
                    <input
                      type="date"
                      {...register("date")}
                      className={`w-full bg-gray-50 border rounded-xl py-3 px-4 outline-none transition-all ${
                        errors.date
                          ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500"
                          : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                      }`}
                    />
                    <InputError message={errors.date?.message} />
                  </div>

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
                      type="submit"
                      disabled={!isValid || isSubmitting}
                      className="flex-1 py-3 px-4 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-100 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Menyimpan..." : "Simpan Pembayaran"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

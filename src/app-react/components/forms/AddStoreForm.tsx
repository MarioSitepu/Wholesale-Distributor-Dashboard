import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storeSchema, StoreFormValues } from "../../schemas/storeSchema";
import { toast } from "sonner";
import { addStore } from "../../utils/mockData";
import { useAppStore } from "../../../store/useAppStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { InputError } from "../ui/ErrorMessage";

export const AddStoreForm: React.FC<{ onSuccess?: () => void }> = ({
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { activeBranch } = useAppStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: StoreFormValues) => {
    console.log("Data Toko siap kirim:", data);

    // Tentukan cabang berdasarkan hak akses
    const branchToUse =
      user?.branch === "Pusat"
        ? activeBranch || "Pusat"
        : user?.branch || "Unknown";

    addStore(
      {
        id: "STR-" + Date.now(),
        name: data.storeName,
        owner: data.ownerName,
        phone: data.phone,
        address: data.address,
        maxCredit: data.maxCredit,
        branch: branchToUse,
        totalDebt: 0,
        receivables: 0,
        lastOrder: new Date().toLocaleDateString("en-CA"),
        isNew: true,
      },
      branchToUse,
    );

    toast.success(`Toko ${data.storeName} berhasil ditambahkan!`);
    reset();
    if (onSuccess) onSuccess();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200"
    >
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nama Toko
        </label>
        <input
          type="text"
          {...register("storeName")}
          className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
            errors.storeName
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          }`}
          placeholder="Contoh: Toko Berkah"
        />
        <InputError message={errors.storeName?.message} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nama Pemilik
        </label>
        <input
          type="text"
          {...register("ownerName")}
          className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
            errors.ownerName
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          }`}
          placeholder="Contoh: Budi Santoso"
        />
        <InputError message={errors.ownerName?.message} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nomor HP
        </label>
        <input
          type="tel"
          {...register("phone")}
          className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
            errors.phone
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          }`}
          placeholder="Contoh: 081234567890"
        />
        <InputError message={errors.phone?.message} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Alamat Lengkap
        </label>
        <textarea
          {...register("address")}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
            errors.address
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          }`}
          placeholder="Contoh: Jl. Sudirman No. 123, Jakarta"
        />
        <InputError message={errors.address?.message} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Limit Piutang
        </label>
        <input
          type="number"
          {...register("maxCredit", { valueAsNumber: true })}
          className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
            errors.maxCredit
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          }`}
          placeholder="Contoh: 5000000"
        />
        <InputError message={errors.maxCredit?.message} />
      </div>

      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Menyimpan..." : "Simpan Toko Baru"}
      </button>
    </form>
  );
};

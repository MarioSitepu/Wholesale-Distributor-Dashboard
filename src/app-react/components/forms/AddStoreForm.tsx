import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storeSchema, StoreFormValues } from "../../schema/storeSchema";
import { toast } from "sonner";
import { addStore } from "../../utils/mockData";
import { useAppStore } from "../../../store/useAppStore";
import { useAuthStore } from "../../../store/useAuthStore";

export const AddStoreForm: React.FC<{ onSuccess?: () => void }> = ({
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { activeBranch } = useAppStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    mode: "onChange",
  });

  const onSubmit = (data: StoreFormValues) => {
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
        branch: branchToUse,
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
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.storeName ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
          placeholder="Contoh: Toko Berkah"
        />
        {errors.storeName && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.storeName.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nama Pemilik
        </label>
        <input
          type="text"
          {...register("ownerName")}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.ownerName ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
          placeholder="Contoh: Budi Santoso"
        />
        {errors.ownerName && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.ownerName.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nomor HP
        </label>
        <input
          type="tel"
          {...register("phone")}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.phone ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
          placeholder="Contoh: 081234567890"
        />
        {errors.phone && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.phone.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Alamat Lengkap
        </label>
        <textarea
          {...register("address")}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.address ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
          placeholder="Contoh: Jl. Sudirman No. 123, Jakarta"
        />
        {errors.address && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.address.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Simpan Toko Baru
      </button>
    </form>
  );
};

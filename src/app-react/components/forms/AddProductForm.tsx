import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "../../schemas/productSchema";
import { toast } from "sonner";
import { addProduct } from "../../utils/mockData";
import { InputError } from "../ui/ErrorMessage";

export const AddProductForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onChange", // 🌟 Kunci reaktivitas: Validasi berjalan tiap kali agen mengetik!
  });

  const onSubmit = async (data: ProductFormValues) => {
    // Data yang masuk ke sini DIJAMIN 100% sudah lolos validasi Zod
    console.log("Data siap kirim ke database/Global State:", data);

    // Simpan ke "database"
    addProduct({
      id: "PRD-" + Date.now(),
      name: data.productName,
      category: data.category,
      price: data.price,
      stock: data.stock,
      totalIn: data.stock,
      totalOut: 0,
      unit: data.unit,
    });

    toast.success(`${data.productName} berhasil ditambahkan!`);
    reset(); // Kosongkan form setelah sukses
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200"
    >
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nama Produk
        </label>
        <input
          type="text"
          {...register("productName")}
          className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
            errors.productName
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          }`}
          placeholder="Contoh: Sosis Fiesta 500g"
        />
        <InputError message={errors.productName?.message} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Kategori
        </label>
        <select
          {...register("category")}
          className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
            errors.category
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          }`}
        >
          <option value="">Pilih Kategori...</option>
          <option value="Fiesta">Fiesta</option>
          <option value="Shifudo">Shifudo</option>
        </select>
        <InputError message={errors.category?.message} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Satuan
        </label>
        <select
          {...register("unit")}
          className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
            errors.unit
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          }`}
        >
          <option value="">Pilih Satuan...</option>
          <option value="Dus">Dus</option>
          <option value="Pack">Pack</option>
          <option value="Pcs">Pcs</option>
        </select>
        <InputError message={errors.unit?.message} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Harga (Rp)
        </label>
        <input
          type="number"
          {...register("price", { valueAsNumber: true })}
          className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
            errors.price
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          }`}
          placeholder="Contoh: 25000"
        />
        <InputError message={errors.price?.message} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Stok Awal
        </label>
        <input
          type="number"
          {...register("stock", { valueAsNumber: true })}
          className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${
            errors.stock
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          }`}
          placeholder="Contoh: 100"
        />
        <InputError message={errors.stock?.message} />
      </div>

      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Menyimpan..." : "Simpan Produk Baru"}
      </button>
    </form>
  );
};

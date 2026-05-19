import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "../../schema/productSchema";
import { toast } from "sonner";
import { addProduct } from "../../utils/mockData";

export const AddProductForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onChange", // 🌟 Kunci reaktivitas: Validasi berjalan tiap kali agen mengetik!
  });

  const onSubmit = (data: ProductFormValues) => {
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
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.productName ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
          placeholder="Contoh: Sosis Fiesta 500g"
        />
        {errors.productName && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.productName.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Kategori
        </label>
        <select
          {...register("category")}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.category ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        >
          <option value="">Pilih Kategori...</option>
          <option value="Fiesta">Fiesta</option>
          <option value="Shifudo">Shifudo</option>
        </select>
        {errors.category && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.category.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Harga (Rp)
        </label>
        <input
          type="number"
          {...register("price", { valueAsNumber: true })}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.price ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
          placeholder="Contoh: 25000"
        />
        {errors.price && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.price.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Stok Awal
        </label>
        <input
          type="number"
          {...register("stock", { valueAsNumber: true })}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.stock ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
          placeholder="Contoh: 100"
        />
        {errors.stock && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            {errors.stock.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Simpan Produk Baru
      </button>
    </form>
  );
};

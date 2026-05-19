import { z } from "zod";

export const productSchema = z.object({
  productName: z
    .string()
    .min(3, "Nama produk minimal 3 karakter")
    .max(50, "Nama terlalu panjang"),
  category: z.enum(["Fiesta", "Shifudo"], {
    required_error: "Kategori wajib dipilih",
  }),
  price: z
    .number({ invalid_type_error: "Harga harus berupa angka" })
    .min(100, "Harga tidak boleh kurang dari Rp 100") // Mencegah minus dan 0
    .max(10000000, "Harga tidak masuk akal"),
  stock: z.number().min(0, "Stok tidak boleh minus"),
});

export type ProductFormValues = z.infer<typeof productSchema>;

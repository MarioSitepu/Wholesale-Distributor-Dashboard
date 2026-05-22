import { z } from "zod";

export const productSchema = z.object({
  productName: z.string().min(3, "Nama terlalu pendek").max(100),
  category: z.enum(["Fiesta", "Shifudo"], {
    message: "Pilih kategori brand",
  }),
  price: z
    .number()
    .int("Harga harus bulat (tanpa koma)")
    .min(500, "Harga minimal Rp 500"),
  stock: z
    .number()
    .int("Stok tidak bisa pecahan")
    .min(0, "Stok tidak boleh minus"),
  unit: z.enum(["Dus", "Pack", "Pcs"], {
    message: "Pilih satuan jual",
  }),
});

export type ProductFormValues = z.infer<typeof productSchema>;

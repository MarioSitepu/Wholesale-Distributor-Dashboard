import { z } from "zod";

export const storeSchema = z.object({
  storeName: z
    .string()
    .min(1, "Nama toko wajib diisi")
    .max(100, "Nama toko terlalu panjang"),
  ownerName: z
    .string()
    .min(1, "Nama pemilik wajib diisi")
    .max(100, "Nama pemilik terlalu panjang"),
  phone: z
    .string()
    .regex(
      /^08[0-9]{8,11}$/,
      "Nomor HP harus diawali 08 dan berisi 10-13 angka",
    ),
  address: z
    .string()
    .min(5, "Alamat terlalu pendek, mohon berikan alamat lengkap"),
});

export type StoreFormValues = z.infer<typeof storeSchema>;

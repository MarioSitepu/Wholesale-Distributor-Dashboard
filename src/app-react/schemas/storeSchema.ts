import { z } from "zod";

export const storeSchema = z.object({
  storeName: z.string().min(3, "Nama toko wajib diisi"),
  ownerName: z.string().min(3, "Nama pemilik wajib diisi"),
  phone: z
    .string()
    .regex(/^08[0-9]{8,11}$/, "Format HP salah (Contoh: 08123456789)"),
  address: z.string().min(10, "Alamat harus detail untuk patokan pengiriman"),
  maxCredit: z.number().min(0, "Limit piutang tidak boleh minus"),
});

export type StoreFormValues = z.infer<typeof storeSchema>;

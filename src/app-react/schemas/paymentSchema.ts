import { z } from "zod";

export const paymentSchema = z.object({
  amount: z.number().min(1000, "Pembayaran minimal Rp 1.000"),
  paymentMethod: z.enum(["Cash", "Transfer Bank"]),
  date: z.string().min(1, "Tanggal bayar wajib diisi"),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

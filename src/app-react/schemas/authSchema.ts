import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3, "Username minimal 3 huruf").trim().toLowerCase(),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

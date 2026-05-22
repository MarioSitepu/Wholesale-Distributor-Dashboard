import { z } from "zod";

export const accountSchema = z
  .object({
    username: z
      .string()
      .min(4, "Username min. 4 karakter")
      .regex(/^[a-zA-Z0-9_]+$/, "Hanya boleh huruf, angka, dan underscore"),
    password: z.string().min(8, "Password min. 8 karakter (keamanan sistem)"),
    role: z.enum(["admin", "superadmin"], {
      message: "Role tidak valid",
    }),
    branch: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "admin" && !data.branch) return false;
      return true;
    },
    {
      message: "Cabang wajib diisi untuk role Admin",
      path: ["branch"],
    },
  );

export type AccountFormValues = z.infer<typeof accountSchema>;

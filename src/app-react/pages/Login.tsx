import { useEffect, useState } from "react";
import { useNavigate } from "../router-compat";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getUsers, User } from "../utils/mockData";
import { useAuthStore } from "../../store/useAuthStore";
import { loginSchema, LoginFormValues } from "../schemas/authSchema";
import { InputError } from "../components/ui/ErrorMessage";

export default function Login() {
  const users = getUsers();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    if (user) {
      navigate("/admin");
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
    },
  });
  if (user) return null; // Mencegah kedipan UI jika sudah login
  const handleLogin = async (data: LoginFormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const user = users.find(
      (u) => u.username === data.username && u.password === data.password,
    );

    if (!user) {
      toast.error("Username atau password salah");
      return;
    }

    login({
      username: user.username,
      role: user.role,
      branch: user.branch,
    });
    toast.success(`Selamat datang, Admin ${user.branch}!`);

    setTimeout(() => {
      navigate("/admin");
    }, 500);
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              PT Anugerah Indotirta Raharja
            </h1>
            <p className="text-gray-600">
              Wholesale Distributor Management System
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Daftar Akun Cabang:
              </h3>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-blue-50 shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-gray-900">
                        Cabang {user.branch}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">
                        U:{" "}
                        <code className="bg-blue-50 px-1 rounded text-blue-700 font-bold">
                          {user.username}
                        </code>{" "}
                        | P:{" "}
                        <code className="bg-blue-50 px-1 rounded text-blue-700 font-bold">
                          {user.password}
                        </code>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Admin Sign In
            </h2>

            <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  {...register("username")}
                  className={`w-full px-4 py-3 border rounded-lg outline-none transition-colors ${
                    errors.username
                      ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
                      : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="Masukkan username"
                  autoComplete="username"
                />
                <InputError message={errors.username?.message} />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  className={`w-full px-4 py-3 border rounded-lg outline-none transition-colors ${
                    errors.password
                      ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
                      : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                />
                <InputError message={errors.password?.message} />
              </div>

              <button
                type="submit"
                disabled={!isValid || isSubmitting || isOffline}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isOffline
                  ? "Menunggu Koneksi Internet..."
                  : isSubmitting
                    ? "Memproses..."
                    : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

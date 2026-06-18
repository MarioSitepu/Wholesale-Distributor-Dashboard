"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "sonner";

import { getUsers } from "../app-react/utils/mockData";
import { useAuthStore } from "../store/useAuthStore";

export default function Login() {
  const users = getUsers();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase(), password }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        const rawError = await response.text();
        if (contentType.includes('application/json')) {
          try {
            const err = JSON.parse(rawError);
            throw new Error(err.message || 'Username atau password salah');
          } catch {
            throw new Error(rawError || 'Username atau password salah');
          }
        }

        throw new Error(rawError || 'Username atau password salah');
      }

      const result = await response.json();
      
      localStorage.setItem('token', result.token);

      login({
        username: result.user.username,
        role: result.user.role as any,
        branch: result.user.branch,
      });
      
      toast.success(`Selamat datang, Admin ${result.user.branch}!`);

      setTimeout(() => {
        router.push("/admin");
      }, 500);
    } catch (error: any) {
      toast.error(error.message || "Username atau password salah");
    } finally {
      setIsLoading(false);
    }
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
            {/*<div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
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
            </div> */}

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Admin Sign In
            </h2>

            <form onSubmit={handleLogin} className="space-y-5">
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Masukkan username"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Masukkan password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isLoading ? "Memproses..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

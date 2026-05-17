"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  DollarSign,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  History,
  Book,
  BookOpen,
  Users,
} from "lucide-react";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { initializeMockData } from "../../app-react/utils/mockData";
import { useAuthStore } from "../../store/useAuthStore";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    initializeMockData();
    if (!user) {
      router.replace("/");
    }
  }, [router, user]);

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-center" richColors />
      <aside
        className={`${isSidebarExpanded ? "w-64" : "w-20"} bg-white border-r border-gray-200 fixed top-0 left-0 bottom-0 flex flex-col transition-all duration-300`}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className={`${isSidebarExpanded ? "block" : "hidden"}`}>
            <h1 className="text-lg font-semibold text-blue-600">
              PT Anugerah Indotirta
            </h1>
            <p className="text-xs text-gray-600 mt-1 font-medium bg-blue-50 px-2 py-1 rounded inline-block">
              Admin {user?.branch || "Dashboard"}
            </p>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarExpanded ? (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Dashboard" : ""}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Dashboard
            </span>
          </Link>
          <Link
            href="/admin/order"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/order") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Pesan Produk" : ""}
          >
            <ShoppingCart className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Pesan Produk
            </span>
          </Link>
          <Link
            href="/admin/history"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/history") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Riwayat Pesanan" : ""}
          >
            <History className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Riwayat Pesanan
            </span>
          </Link>
          <Link
            href="/admin/stock"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/stock") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Kelola Stok" : ""}
          >
            <Package className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Kelola Stok
            </span>
          </Link>
          <Link
            href="/admin/receivables"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/receivables") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Piutang" : ""}
          >
            <DollarSign className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Piutang
            </span>
          </Link>
          <Link
            href="/admin/store-books"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/store-books") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Buku Toko" : ""}
          >
            <Book className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Buku Toko
            </span>
          </Link>
          <Link
            href="/admin/product-books"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/product-books") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Buku Produk" : ""}
          >
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Buku Produk
            </span>
          </Link>

          {user?.branch === "Pusat" && (
            <Link
              href="/admin/accounts"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/accounts") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
              title={!isSidebarExpanded ? "Kelola Akun" : ""}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
                Kelola Akun
              </span>
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg`}
            title={!isSidebarExpanded ? "Keluar" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Keluar
            </span>
          </button>
        </div>
      </aside>

      <main
        className={`flex-1 ${isSidebarExpanded ? "ml-64" : "ml-20"} p-8 transition-all duration-300`}
      >
        {children}
      </main>
    </div>
  );
}

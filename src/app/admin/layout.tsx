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
  Menu,
  X,
  HelpCircle,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    initializeMockData();
    if (!user) {
      router.replace("/");
    }
  }, [router, user]);

  // Tutup menu mobile ketika navigasi berpindah
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Toaster position="top-center" richColors />

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 bottom-0 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 z-50
          ${isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          md:translate-x-0 md:flex ${isSidebarExpanded ? "md:w-64" : "md:w-20"}
        `}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div
            className={`${isSidebarExpanded || isMobileMenuOpen ? "block" : "hidden"} md:${isSidebarExpanded ? "block" : "hidden"}`}
          >
            <h1 className="text-lg font-semibold text-blue-600">
              PT Anugerah Indotirta
            </h1>
            <p className="text-xs text-gray-600 mt-1 font-medium bg-blue-50 px-2 py-1 rounded inline-block">
              Admin {user?.branch || "Dashboard"}
            </p>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={toggleSidebar}
            className="hidden md:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarExpanded ? (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded && !isMobileMenuOpen ? "Dashboard" : ""}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span
              className={`${isSidebarExpanded || isMobileMenuOpen ? "block" : "hidden"} md:${isSidebarExpanded ? "block" : "hidden"}`}
            >
              Dashboard
            </span>
          </Link>
          <Link
            href="/admin/order"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/order") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={
              !isSidebarExpanded && !isMobileMenuOpen ? "Pesan Produk" : ""
            }
          >
            <ShoppingCart className="w-5 h-5 flex-shrink-0" />
            <span
              className={`${isSidebarExpanded || isMobileMenuOpen ? "block" : "hidden"} md:${isSidebarExpanded ? "block" : "hidden"}`}
            >
              Pesan Produk
            </span>
          </Link>
          <Link
            href="/admin/history"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/history") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={
              !isSidebarExpanded && !isMobileMenuOpen ? "Riwayat Pesanan" : ""
            }
          >
            <History className="w-5 h-5 flex-shrink-0" />
            <span
              className={`${isSidebarExpanded || isMobileMenuOpen ? "block" : "hidden"} md:${isSidebarExpanded ? "block" : "hidden"}`}
            >
              Riwayat Pesanan
            </span>
          </Link>
          <Link
            href="/admin/stock"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/stock") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded && !isMobileMenuOpen ? "Kelola Stok" : ""}
          >
            <Package className="w-5 h-5 flex-shrink-0" />
            <span
              className={`${isSidebarExpanded || isMobileMenuOpen ? "block" : "hidden"} md:${isSidebarExpanded ? "block" : "hidden"}`}
            >
              Kelola Stok
            </span>
          </Link>
          <Link
            href="/admin/receivables"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/receivables") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded && !isMobileMenuOpen ? "Piutang" : ""}
          >
            <DollarSign className="w-5 h-5 flex-shrink-0" />
            <span
              className={`${isSidebarExpanded || isMobileMenuOpen ? "block" : "hidden"} md:${isSidebarExpanded ? "block" : "hidden"}`}
            >
              Piutang
            </span>
          </Link>
          <Link
            href="/admin/store-books"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/store-books") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded && !isMobileMenuOpen ? "Buku Toko" : ""}
          >
            <Book className="w-5 h-5 flex-shrink-0" />
            <span
              className={`${isSidebarExpanded || isMobileMenuOpen ? "block" : "hidden"} md:${isSidebarExpanded ? "block" : "hidden"}`}
            >
              Buku Toko
            </span>
          </Link>
          <Link
            href="/admin/product-books"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/product-books") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded && !isMobileMenuOpen ? "Buku Produk" : ""}
          >
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <span
              className={`${isSidebarExpanded || isMobileMenuOpen ? "block" : "hidden"} md:${isSidebarExpanded ? "block" : "hidden"}`}
            >
              Buku Produk
            </span>
          </Link>

          {user?.branch === "Pusat" && (
            <Link
              href="/admin/accounts"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/accounts") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
              title={
                !isSidebarExpanded && !isMobileMenuOpen ? "Kelola Akun" : ""
              }
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              <span
                className={`${isSidebarExpanded || isMobileMenuOpen ? "block" : "hidden"} md:${isSidebarExpanded ? "block" : "hidden"}`}
              >
                Kelola Akun
              </span>
            </Link>
          )}
          <Link
            href="/admin/help-center"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/help-center") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded && !isMobileMenuOpen ? "Help Center" : ""}
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            <span
              className={`${isSidebarExpanded || isMobileMenuOpen ? "block" : "hidden"} md:${isSidebarExpanded ? "block" : "hidden"}`}
            >
              Help Center
            </span>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg`}
            title={!isSidebarExpanded && !isMobileMenuOpen ? "Keluar" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span
              className={`${isSidebarExpanded || isMobileMenuOpen ? "block" : "hidden"} md:${isSidebarExpanded ? "block" : "hidden"}`}
            >
              Keluar
            </span>
          </button>
        </div>
      </aside>

      <div
        className={`flex-1 flex flex-col min-w-0 max-w-full transition-all duration-300 ml-0 ${isSidebarExpanded ? "md:ml-64" : "md:ml-20"}`}
      >
        {/* MOBILE HEADER */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-semibold text-blue-600">PT Anugerah</h1>
            <p className="text-xs text-gray-600 font-medium">
              Admin {user?.branch || "Dashboard"}
            </p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-4 md:p-8 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

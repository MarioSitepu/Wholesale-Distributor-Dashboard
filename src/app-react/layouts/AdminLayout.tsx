import { Outlet, Link, useLocation, useNavigate } from "../router-compat";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { initializeMockData } from "../utils/mockData";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useAppStore } from "../../store/useAppStore";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const clearCartStore = useCartStore((state) => state.clearCart);
  const setActiveBranch = useAppStore((state) => state.setActiveBranch);
  const setSelectedCategory = useAppStore((state) => state.setSelectedCategory);

  useEffect(() => {
    initializeMockData();

    // Security check: if user is null, redirect to login
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
    clearCartStore();
    setActiveBranch("");
    setSelectedCategory("Semua Kategori");
    navigate("/");
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // Timeout 30 menit (30 * 60 * 1000)
      timeoutId = setTimeout(
        () => {
          handleLogout();
          toast.info("Sesi Anda telah berakhir karena tidak ada aktivitas.");
        },
        30 * 60 * 1000,
      );
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("scroll", resetTimer);
    window.addEventListener("click", resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!user) return null; // Guest Guard

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* HEADER MOBILE */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-blue-600 truncate max-w-[200px]">
              PT Anugerah Indotirta
            </h1>
          </div>
        </div>
      </header>

      {/* OVERLAY SIDEBAR UNTUK MOBILE */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileMenu}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col md:hidden"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-blue-600">
                    PT Anugerah Indotirta
                  </h1>
                  <p className="text-xs text-gray-600 mt-1 font-medium bg-blue-50 px-2 py-1 rounded inline-block">
                    Admin {user?.branch || "Dashboard"}
                  </p>
                </div>
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <Link
                  to="/admin"
                  onClick={toggleMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                  <span className="block">Dashboard</span>
                </Link>
                <Link
                  to="/admin/order"
                  onClick={toggleMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/order") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                  <span className="block">Pesan Produk</span>
                </Link>
                <Link
                  to="/admin/history"
                  onClick={toggleMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/history") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <History className="w-5 h-5 flex-shrink-0" />
                  <span className="block">Riwayat Pesanan</span>
                </Link>
                <Link
                  to="/admin/stock"
                  onClick={toggleMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/stock") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <Package className="w-5 h-5 flex-shrink-0" />
                  <span className="block">Kelola Stok</span>
                </Link>
                <Link
                  to="/admin/receivables"
                  onClick={toggleMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/receivables") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <DollarSign className="w-5 h-5 flex-shrink-0" />
                  <span className="block">Piutang</span>
                </Link>
                <Link
                  to="/admin/store-books"
                  onClick={toggleMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/store-books") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <Book className="w-5 h-5 flex-shrink-0" />
                  <span className="block">Buku Toko</span>
                </Link>
                <Link
                  to="/admin/product-books"
                  onClick={toggleMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/product-books") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <BookOpen className="w-5 h-5 flex-shrink-0" />
                  <span className="block">Buku Produk</span>
                </Link>

                {user?.branch === "Pusat" && (
                  <Link
                    to="/admin/accounts"
                    onClick={toggleMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/accounts") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    <Users className="w-5 h-5 flex-shrink-0" />
                    <span className="block">Kelola Akun</span>
                  </Link>
                )}
              </nav>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="block">Keluar</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* SIDEBAR DESKTOP */}
      <aside
        className={`hidden md:flex ${isSidebarExpanded ? "w-64" : "w-20"} bg-white border-r border-gray-200 sticky top-0 h-screen flex-col transition-all duration-300 z-30`}
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
            to="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Dashboard" : ""}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Dashboard
            </span>
          </Link>
          <Link
            to="/admin/order"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/order") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Pesan Produk" : ""}
          >
            <ShoppingCart className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Pesan Produk
            </span>
          </Link>
          <Link
            to="/admin/history"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/history") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Riwayat Pesanan" : ""}
          >
            <History className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Riwayat Pesanan
            </span>
          </Link>
          <Link
            to="/admin/stock"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/stock") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Kelola Stok" : ""}
          >
            <Package className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Kelola Stok
            </span>
          </Link>
          <Link
            to="/admin/receivables"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/receivables") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Piutang" : ""}
          >
            <DollarSign className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Piutang
            </span>
          </Link>
          <Link
            to="/admin/store-books"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive("/admin/store-books") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
            title={!isSidebarExpanded ? "Buku Toko" : ""}
          >
            <Book className="w-5 h-5 flex-shrink-0" />
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Buku Toko
            </span>
          </Link>
          <Link
            to="/admin/product-books"
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
              to="/admin/accounts"
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
        className={`flex-1 flex flex-col min-w-0 max-w-full p-4 md:p-8 transition-all duration-300 w-full`}
      >
        <Outlet />
      </main>
    </div>
  );
}

import { createBrowserRouter, redirect } from "react-router";
import OrderPage from "./pages/store/OrderPage";
import OrderHistory from "./pages/store/OrderHistory";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StockManagement from "./pages/admin/StockManagement";
import ReceivablesManagement from "./pages/admin/ReceivablesManagement";
import StoreLedger from "./pages/admin/StoreLedger";
import ProductLedger from "./pages/admin/ProductLedger";
import AccountManagement from "./pages/admin/AccountManagement";
import AdminLayout from "./layouts/AdminLayout";
import Login from "./pages/Login";

const checkAuth = () => {
  const user = localStorage.getItem('currentUser');
  if (!user) {
    throw redirect('/');
  }
  return JSON.parse(user);
};

const redirectToAdmin = () => {
  throw redirect('/admin');
};

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/admin",
    Component: AdminLayout,
    loader: checkAuth,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "order", Component: OrderPage },
      { path: "history", Component: OrderHistory },
      { path: "stock", Component: StockManagement },
      { path: "receivables", Component: ReceivablesManagement },
      { path: "store-books", Component: StoreLedger },
      { path: "product-books", Component: ProductLedger },
      { path: "accounts", Component: AccountManagement },
    ],
  },
  {
    path: "/store",
    loader: redirectToAdmin,
    Component: () => null,
  },
  {
    path: "*",
    loader: () => { throw redirect('/'); },
    Component: () => null,
  },
]);
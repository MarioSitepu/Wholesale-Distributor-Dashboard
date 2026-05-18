import { getOrders } from "./mockData";

export const getWeeklySalesTrend = (branch?: string) => {
  const orders = getOrders();
  const filteredOrders = branch
    ? orders.filter((o) => o.branch === branch)
    : orders;

  const trend = [];
  // Get the last 7 days including today
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const formattedDate = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }); // e.g. 12 Mei

    // Calculate total for this specific day
    const dailyTotal = filteredOrders
      .filter((o) => o.createdAt.startsWith(dateStr))
      .reduce((sum, o) => sum + o.total, 0);

    trend.push({
      date: formattedDate,
      total: dailyTotal,
    });
  }

  return trend;
};

export const getTopSellingProducts = (branch?: string) => {
  const orders = getOrders();
  const filteredOrders = branch
    ? orders.filter((o) => o.branch === branch)
    : orders;

  const productSales: Record<string, number> = {};

  filteredOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (productSales[item.productName]) {
        productSales[item.productName] += item.quantity;
      } else {
        productSales[item.productName] = item.quantity;
      }
    });
  });

  const sortedProducts = Object.entries(productSales)
    .map(([name, sold]) => ({ name, sold }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  return sortedProducts;
};

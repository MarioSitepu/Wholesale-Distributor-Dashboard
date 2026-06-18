export const getSalesTrend = (
  orders: any[],
  type: "minggu" | "bulan" | "tahun",
  value?: number,
  branch?: string,
) => {
  const filteredOrders = branch
    ? orders.filter((o) => o.branch === branch)
    : orders;

  const trend = [];
  const today = new Date();

  if (type === "minggu") {
    let currentDay = today.getDay();
    let adjustedDay = currentDay === 0 ? 6 : currentDay - 1;

    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - adjustedDay);

    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);

      let dateStr = "";
      try {
        const localD = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        dateStr = localD.toISOString().split("T")[0];
      } catch (e) {
        dateStr = d.toISOString().split("T")[0];
      }

      const formattedDate = d.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      let dailyTotal: number | null = 0;
      // Start of today for proper comparison without time component
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (startOfD <= startOfToday) {
        dailyTotal = filteredOrders
          .filter((o) => o.createdAt.startsWith(dateStr))
          .reduce((sum, o) => sum + o.total, 0);
      } else {
        dailyTotal = null; // Future days empty
      }

      trend.push({
        date: formattedDate,
        total: dailyTotal,
      });
    }
  } else if (type === "bulan") {
    const month = value !== undefined ? value : today.getMonth();
    const year = today.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let week1 = 0,
      week2 = 0,
      week3 = 0,
      week4 = 0,
      week5 = 0;

    filteredOrders.forEach((o) => {
      const oDate = new Date(o.createdAt);
      if (oDate.getFullYear() === year && oDate.getMonth() === month) {
        const date = oDate.getDate();
        if (date <= 7) week1 += o.total;
        else if (date <= 14) week2 += o.total;
        else if (date <= 21) week3 += o.total;
        else if (date <= 28) week4 += o.total;
        else week5 += o.total;
      }
    });

    const isCurrentMonth =
      year === today.getFullYear() && month === today.getMonth();
    const currentD = today.getDate();

    trend.push({
      date: "Minggu 1 (1-7)",
      total: isCurrentMonth && currentD < 1 ? null : week1,
    });
    trend.push({
      date: "Minggu 2 (8-14)",
      total: isCurrentMonth && currentD < 8 ? null : week2,
    });
    trend.push({
      date: "Minggu 3 (15-21)",
      total: isCurrentMonth && currentD < 15 ? null : week3,
    });
    trend.push({
      date: "Minggu 4 (22-28)",
      total: isCurrentMonth && currentD < 22 ? null : week4,
    });
    if (daysInMonth > 28) {
      trend.push({
        date: `Minggu 5 (29-${daysInMonth})`,
        total: isCurrentMonth && currentD < 29 ? null : week5,
      });
    }
  } else if (type === "tahun") {
    const year = value !== undefined ? value : today.getFullYear();
    const monthlyTotals = new Array(12).fill(0);

    filteredOrders.forEach((o) => {
      const oDate = new Date(o.createdAt);
      if (oDate.getFullYear() === year) {
        monthlyTotals[oDate.getMonth()] += o.total;
      }
    });

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Ags",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    monthNames.forEach((name, idx) => {
      const isFuture = year === today.getFullYear() && idx > today.getMonth();
      const isPastYear = year > today.getFullYear();
      trend.push({
        date: name,
        total: isFuture || isPastYear ? null : monthlyTotals[idx],
      });
    });
  }

  return trend;
};

// Kept for backward compatibility if used elsewhere, but ideally replace its usage
export const getWeeklySalesTrend = (orders: any[], branch?: string) => {
  return getSalesTrend(orders, "minggu", undefined, branch);
};

export const getTopSellingProducts = (orders: any[], branch?: string) => {
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

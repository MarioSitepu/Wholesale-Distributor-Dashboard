import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import {
  KpiResponse,
  WeeklySalesItem,
  BranchContributionItem,
  LowStockItem,
  RecentOrderItem,
} from '../types/index';
import { OrderRepository } from '../repositories/order.repository';
import { ReceivableRepository } from '../repositories/receivable.repository';
import { StockRepository } from '../repositories/stock.repository';

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export class DashboardService {
  private orderRepo = new OrderRepository();
  private receivableRepo = new ReceivableRepository();
  private stockRepo = new StockRepository();

  async getKpi(branch: string): Promise<KpiResponse> {
    const now = new Date();

    // Penjualan hari ini
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const dailySales = await this.orderRepo.sumTotal(branch, todayStart, todayEnd);

    // Penjualan bulan ini
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthlySales = await this.orderRepo.sumTotal(branch, monthStart, monthEnd);

    // Total piutang belum dibayar
    const totalReceivables = await this.receivableRepo.sumUnpaid(branch);

    // Jumlah produk stok rendah
    const lowStockCount = await this.stockRepo.countLowStock(branch);

    return { dailySales, monthlySales, totalReceivables, lowStockCount };
  }

  async getSalesTrend(branch: string, type: "minggu" | "bulan" | "tahun", value?: number): Promise<any[]> {
    const trend = [];
    const today = new Date();

    if (type === "minggu") {
      for (let i = 6; i >= 0; i--) {
        const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const next = new Date(day);
        next.setDate(next.getDate() + 1);

        const sales = await this.orderRepo.sumTotal(branch, day, next);
        trend.push({ date: DAY_LABELS[day.getDay()], sales });
      }
    } else if (type === "bulan") {
      const month = value !== undefined ? value : today.getMonth();
      const year = today.getFullYear();
      
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 1);
      const orders = await this.orderRepo.findByDateRange(branch, startOfMonth, endOfMonth);

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      let week1 = 0, week2 = 0, week3 = 0, week4 = 0, week5 = 0;

      orders.forEach((o) => {
        const date = new Date(o.createdAt).getDate();
        if (date <= 7) week1 += Number(o.total);
        else if (date <= 14) week2 += Number(o.total);
        else if (date <= 21) week3 += Number(o.total);
        else if (date <= 28) week4 += Number(o.total);
        else week5 += Number(o.total);
      });

      const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
      const currentD = today.getDate();

      trend.push({ date: "Minggu 1 (1-7)", sales: isCurrentMonth && currentD < 1 ? null : week1 });
      trend.push({ date: "Minggu 2 (8-14)", sales: isCurrentMonth && currentD < 8 ? null : week2 });
      trend.push({ date: "Minggu 3 (15-21)", sales: isCurrentMonth && currentD < 15 ? null : week3 });
      trend.push({ date: "Minggu 4 (22-28)", sales: isCurrentMonth && currentD < 22 ? null : week4 });
      if (daysInMonth > 28) {
        trend.push({ date: `Minggu 5 (29-${daysInMonth})`, sales: isCurrentMonth && currentD < 29 ? null : week5 });
      }
    } else if (type === "tahun") {
      const year = value !== undefined ? value : today.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);
      const orders = await this.orderRepo.findByDateRange(branch, startOfYear, endOfYear);

      const monthlyTotals = new Array(12).fill(0);
      orders.forEach((o) => {
        monthlyTotals[new Date(o.createdAt).getMonth()] += Number(o.total);
      });

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
      monthNames.forEach((name, idx) => {
        const isFuture = year === today.getFullYear() && idx > today.getMonth();
        const isPastYear = year > today.getFullYear();
        trend.push({
          date: name,
          sales: isFuture || isPastYear ? null : monthlyTotals[idx],
        });
      });
    }

    return trend;
  }

  async getTopProducts(branch: string): Promise<{ name: string; sold: number }[]> {
    const isUniversal = branch === 'all' || branch === 'Pusat';
    const query = isUniversal 
      ? Prisma.sql`SELECT "productName" as name, SUM(quantity) as sold FROM order_items GROUP BY "productName" ORDER BY sold DESC LIMIT 5`
      : Prisma.sql`SELECT oi."productName" as name, SUM(oi.quantity) as sold FROM order_items oi JOIN orders o ON oi."orderId" = o.id WHERE o.branch = ${branch} GROUP BY oi."productName" ORDER BY sold DESC LIMIT 5`;
    
    const result = await prisma.$queryRaw<any[]>(query);
    return result.map(r => ({ name: r.name, sold: Number(r.sold) }));
  }

  async getBranchContribution(): Promise<BranchContributionItem[]> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const groups = await this.orderRepo.groupByBranch(monthStart, monthEnd);
    return groups.map((g) => ({
      name: g.branch,
      value: Number(g._sum.total ?? 0),
    }));
  }

  async getLowStock(branch: string): Promise<LowStockItem[]> {
    const items = await this.stockRepo.findLowStock(branch);
    return items.map((s) => ({
      id: s.product.id,
      name: s.product.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim(),
      category: s.product.categoryName,
      stock: s.totalIn - s.totalOut,
      branch: s.branch,
    }));
  }

  async getRecentOrders(branch: string): Promise<RecentOrderItem[]> {
    const orders = await this.orderRepo.findRecent(branch, 5);
    return orders.map((o) => ({
      id: o.id,
      storeName: o.store.name,
      total: Number(o.total),
      branch: o.branch,
      createdAt: o.createdAt
    }));
  }
}

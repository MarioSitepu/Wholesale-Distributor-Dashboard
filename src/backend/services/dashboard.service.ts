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

  async getWeeklySales(branch: string): Promise<WeeklySalesItem[]> {
    const result: WeeklySalesItem[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);

      const sales = await this.orderRepo.sumTotal(branch, day, next);
      result.push({ name: DAY_LABELS[day.getDay()], sales });
    }

    return result;
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
    }));
  }
}

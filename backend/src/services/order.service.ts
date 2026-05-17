import { JwtPayload, Order, OrderItem, DailyReportRow } from '../types/index.js';
import { OrderRepository } from '../repositories/order.repository.js';
import { StoreRepository } from '../repositories/store.repository.js';
import { StockRepository } from '../repositories/stock.repository.js';
import { ReceivableRepository } from '../repositories/receivable.repository.js';
import { Errors } from '../utils/errors.js';

export class OrderService {
  private orderRepo = new OrderRepository();
  private storeRepo = new StoreRepository();
  private stockRepo = new StockRepository();
  private receivableRepo = new ReceivableRepository();

  async getOrders(
    filter: { branch: string; date?: string; month?: string },
    user: JwtPayload,
  ): Promise<Order[]> {
    const targetBranch = user.branch === 'Pusat' ? filter.branch : user.branch;
    const rows = await this.orderRepo.findMany({ ...filter, branch: targetBranch });

    return rows.map((o) => ({
      id: o.id,
      storeId: o.storeId,
      storeName: o.store.name,
      branch: o.branch,
      items: o.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        price: Number(i.price),
      })),
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
    }));
  }

  async createOrder(
    data: {
      id: string;
      storeId: string;
      storeName: string;
      branch: string;
      items: OrderItem[];
      total: number;
      createdAt: string;
    },
    user: JwtPayload,
  ): Promise<Order> {
    // Pastikan branch sesuai user (non-superadmin tidak bisa buat order di branch lain)
    if (user.branch !== 'Pusat' && data.branch !== user.branch) {
      throw Errors.forbidden();
    }

    // Pastikan order ID belum ada
    const exists = await this.orderRepo.existsById(data.id);
    if (exists) throw Errors.conflict(`Order '${data.id}' sudah ada`);

    // Pastikan toko ada
    const store = await this.storeRepo.findById(data.storeId);
    if (!store) throw Errors.notFound(`Toko '${data.storeId}' tidak ditemukan`);

    // Validasi & kurangi stok untuk tiap item
    for (const item of data.items) {
      const currentStock = await this.stockRepo.getCurrentStock(item.productId, data.branch);
      if (currentStock < item.quantity) {
        throw Errors.unprocessable(
          `Stok tidak mencukupi untuk produk '${item.productName}'`,
          { productId: item.productId },
        );
      }
    }

    // Buat order
    const order = await this.orderRepo.create({
      id: data.id,
      storeId: data.storeId,
      branch: data.branch,
      total: data.total,
      createdAt: new Date(data.createdAt),
      items: data.items,
    });

    // Kurangi stok
    for (const item of data.items) {
      await this.stockRepo.deductStock(item.productId, data.branch, item.quantity);
    }

    // Buat piutang (jatuh tempo 30 hari)
    const dueDate = new Date(data.createdAt);
    dueDate.setDate(dueDate.getDate() + 30);
    await this.receivableRepo.create({
      storeId: data.storeId,
      orderId: data.id,
      amount: data.total,
      dueDate,
    });

    return {
      id: order.id,
      storeId: order.storeId,
      storeName: order.store.name,
      branch: order.branch,
      items: order.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        price: Number(i.price),
      })),
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
    };
  }

  async getDailyReport(
    filter: { branch: string; date: string; storeId: string },
    user: JwtPayload,
  ): Promise<DailyReportRow[]> {
    const targetBranch = user.branch === 'Pusat' ? filter.branch : user.branch;
    const orders = await this.orderRepo.findForDailyReport({
      ...filter,
      branch: targetBranch,
    });

    const rows: DailyReportRow[] = [];
    for (const o of orders) {
      for (const item of o.items) {
        rows.push({
          orderId: o.id,
          storeName: o.store.name,
          branch: o.branch,
          productName: item.productName,
          quantity: item.quantity,
          price: Number(item.price),
          total: item.quantity * Number(item.price),
        });
      }
    }
    return rows;
  }
}

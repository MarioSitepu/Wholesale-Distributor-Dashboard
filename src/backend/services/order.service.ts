import { JwtPayload, Order, OrderItem, DailyReportRow } from '../types/index';
import { OrderRepository } from '../repositories/order.repository';
import { StoreRepository } from '../repositories/store.repository';
import { StockRepository } from '../repositories/stock.repository';
import { ReceivableRepository } from '../repositories/receivable.repository';
import { Errors } from '../utils/errors';
import { prisma } from '../config/prisma';

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
        productName: i.productName.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim(),
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

    // Gunakan Prisma Transaction untuk menjamin ACID & Konsistensi Stok (mencegah Race Condition)
    return await prisma.$transaction(async (tx) => {
      // 1. Validasi Bisnis: Pastikan nomor faktur (Order ID) unik & tidak duplikat
      const exists = await tx.order.count({ where: { id: data.id } });
      if (exists > 0) throw Errors.conflict(`Nomor faktur '${data.id}' sudah digunakan di sistem`);

      // 2. Pastikan toko ada
      const store = await tx.store.findUnique({ where: { id: data.storeId } });
      if (!store) throw Errors.notFound(`Toko '${data.storeId}' tidak ditemukan`);

      let calculatedTotal = 0;
      const verifiedItems: any[] = [];

      // 3. Validasi stok secara atomik menggunakan SELECT ... FOR UPDATE untuk mengunci baris stok
      for (const item of data.items) {
        // Ambil dan kunci baris stok di database
        const stockRows = await tx.$queryRaw<any[]>`
          SELECT "totalIn", "totalOut" 
          FROM stock_items 
          WHERE "productId" = ${item.productId} AND "branch" = ${data.branch} 
          FOR UPDATE
        `;

        const stockItem = stockRows[0];
        const currentStock = stockItem ? (stockItem.totalIn - stockItem.totalOut) : 0;

        // Validasi Bisnis: Mencegah stok menjadi negatif
        if (currentStock < item.quantity) {
          throw Errors.unprocessable(
            `Stok tidak mencukupi untuk produk '${item.productName}' (Stok Tersedia: ${currentStock}, Diminta: ${item.quantity})`,
            { productId: item.productId },
          );
        }

        // Keamanan Transaksi: Ambil produk dari DB untuk validasi harga (mencegah manipulasi konsol browser)
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        if (!product) {
          throw Errors.notFound(`Produk '${item.productId}' tidak ditemukan di database`);
        }

        const dbPrice = Number(product.price);
        // Bandingkan harga kiriman klien dengan harga terdaftar di database
        if (Math.abs(dbPrice - item.price) > 0.01) {
          throw Errors.badRequest(
            `Keamanan Transaksi: Ketidakcocokan harga terdeteksi untuk produk '${item.productName}'. Harga sistem: Rp ${dbPrice}, Harga kiriman: Rp ${item.price}`
          );
        }

        calculatedTotal += dbPrice * item.quantity;
        verifiedItems.push({
          productId: item.productId,
          productName: product.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim(),
          quantity: item.quantity,
          price: dbPrice
        });

        // 4. Kurangi stok (secara atomik mengupdate totalOut di bawah kunci FOR UPDATE)
        await tx.stockItem.update({
          where: { productId_branch: { productId: item.productId, branch: data.branch } },
          data: { totalOut: { increment: item.quantity } },
        });
      }

      // Keamanan Transaksi: Validasi total belanja keseluruhan
      if (Math.abs(calculatedTotal - data.total) > 0.01) {
        throw Errors.badRequest(
          `Keamanan Transaksi: Manipulasi total belanja terdeteksi. Kalkulasi sistem: Rp ${calculatedTotal}, Kiriman klien: Rp ${data.total}`
        );
      }

      // 5. Buat order
      const order = await tx.order.create({
        data: {
          id: data.id,
          storeId: data.storeId,
          branch: data.branch,
          total: calculatedTotal, // Simpan total yang telah divalidasi sistem
          createdAt: new Date(data.createdAt),
          items: {
            create: verifiedItems.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          store: true,
          items: true
        }
      });

      // 6. Buat piutang (jatuh tempo 30 hari)
      const dueDate = new Date(data.createdAt);
      dueDate.setDate(dueDate.getDate() + 30);
      await tx.receivable.create({
        data: {
          storeId: data.storeId,
          orderId: data.id,
          amount: calculatedTotal, // Piutang didasarkan pada harga tervalidasi sistem
          dueDate,
        }
      });

      return {
        id: order.id,
        storeId: order.storeId,
        storeName: order.store.name,
        branch: order.branch,
        items: order.items.map((i) => ({
          productId: i.productId,
          productName: i.productName.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim(),
          quantity: i.quantity,
          price: Number(i.price),
        })),
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
      };
    });
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
          productName: item.productName.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim(),
          quantity: item.quantity,
          price: Number(item.price),
          total: item.quantity * Number(item.price),
        });
      }
    }
    return rows;
  }

  async deleteOrdersBefore(month: string, user: JwtPayload): Promise<{ deletedCount: number }> {
    if (user.branch !== 'Pusat') {
      throw Errors.forbidden('Hanya Super Admin yang dapat menghapus riwayat pesanan');
    }

    const [year, m] = month.split('-').map(Number);
    if (!year || !m) {
      throw Errors.badRequest('Format bulan tidak valid. Gunakan YYYY-MM');
    }

    // Hitung tanggal 1 pada bulan tersebut. Kita ingin menghapus sebelum tanggal tersebut.
    // Misalnya input 2026-07. Berarti hapus sebelum 2026-07-01.
    const beforeDate = new Date(year, m - 1, 1);
    
    return await this.orderRepo.deleteBeforeDate(beforeDate);
  }
}

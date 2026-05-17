import { prisma } from '../config/prisma';

export class DatabaseService {
  /**
   * Menghapus data transaksi (Orders, OrderItems, Receivables) yang dibuat
   * pada atau sebelum tanggal yang ditentukan.
   */
  async deleteDataBeforeDate(date: Date) {
    const ordersToDelete = await prisma.order.findMany({
      where: {
        createdAt: {
          lte: date,
        },
      },
      select: { id: true },
    });

    const orderIds = ordersToDelete.map((o) => o.id);

    if (orderIds.length === 0) {
      return { deletedCount: 0 };
    }

    // Gunakan transaksi untuk memastikan semua data terkait terhapus
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }),
      prisma.receivable.deleteMany({ where: { orderId: { in: orderIds } } }),
      prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    ]);

    return { deletedCount: orderIds.length };
  }

  /**
   * Menampilkan sisa storage database (khusus PostgreSQL).
   */
  async getDatabaseStorage() {
    try {
      // Query untuk mendapatkan ukuran database saat ini (hanya untuk PostgreSQL)
      const result = await prisma.$queryRaw<{ pg_database_size: bigint }[]>`SELECT pg_database_size(current_database());`;
      
      const usedBytes = result[0]?.pg_database_size?.toString() || "0";
      
      // Asumsi batas storage (misalnya 512MB untuk free tier), bisa disesuaikan.
      const maxBytes = 512 * 1024 * 1024; 
      const remainingBytes = maxBytes - Number(usedBytes);

      return {
        usedBytes: Number(usedBytes),
        maxBytes,
        remainingBytes: remainingBytes > 0 ? remainingBytes : 0,
      };
    } catch (error) {
      // Fallback jika bukan PostgreSQL atau gagal query
      console.error("Gagal mendapatkan ukuran database", error);
      return {
        usedBytes: 0,
        maxBytes: 512 * 1024 * 1024,
        remainingBytes: 512 * 1024 * 1024,
      };
    }
  }
}

import { ScheduledPrice } from '../types/index';
import { ScheduledPriceRepository } from '../repositories/scheduledPrice.repository';
import { ProductRepository } from '../repositories/product.repository';
import { Errors } from '../utils/errors';

export class ScheduledPriceService {
  private repo = new ScheduledPriceRepository();
  private productRepo = new ProductRepository();

  async getScheduledPrices(branch: string): Promise<ScheduledPrice[]> {
    const rows = await this.repo.findAll(branch === 'all' ? undefined : branch);
    return rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      newPrice: Number(r.newPrice),
      startDate: r.startDate.toISOString().split('T')[0],
    }));
  }

  async createScheduledPrice(data: {
    productId: string;
    newPrice: number;
    startDate: string;
  }): Promise<ScheduledPrice> {
    const product = await this.productRepo.findById(data.productId);
    if (!product) throw Errors.notFound(`Produk '${data.productId}' tidak ditemukan`);

    const row = await this.repo.create({
      productId: data.productId,
      newPrice: data.newPrice,
      startDate: new Date(data.startDate),
    });

    return {
      id: row.id,
      productId: row.productId,
      productName: row.product.name,
      newPrice: Number(row.newPrice),
      startDate: row.startDate.toISOString().split('T')[0],
    };
  }

  async deleteScheduledPrice(id: string): Promise<void> {
    const exists = await this.repo.existsById(id);
    if (!exists) throw Errors.notFound(`Jadwal harga '${id}' tidak ditemukan`);
    await this.repo.delete(id);
  }
}

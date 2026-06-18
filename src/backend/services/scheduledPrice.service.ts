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
      productName: r.product.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim(),
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
      productName: row.product.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim(),
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

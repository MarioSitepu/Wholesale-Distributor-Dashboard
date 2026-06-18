import { JwtPayload, StockItem } from '../types/index';
import { StockRepository } from '../repositories/stock.repository';
import { ProductRepository } from '../repositories/product.repository';
import { Errors } from '../utils/errors';

export class StockService {
  private stockRepo = new StockRepository();
  private productRepo = new ProductRepository();

  async getStock(branch: string, user: JwtPayload): Promise<StockItem[]> {
    const targetBranch = user.branch === 'Pusat' ? branch : user.branch;
    const rows = await this.stockRepo.findByBranch(targetBranch);

    return rows.map((s) => ({
      id: s.productId,
      name: s.product.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim(),
      category: s.product.categoryName,
      totalIn: s.totalIn,
      totalOut: s.totalOut,
      stock: s.totalIn - s.totalOut,
      branch: s.branch,
    }));
  }

  async restock(
    data: { productId: string; branch: string; amount: number; action?: 'add' | 'reduce' },
    user: JwtPayload,
  ): Promise<StockItem> {
    // Non-superadmin hanya bisa restock di branch sendiri
    if (user.branch !== 'Pusat' && data.branch !== user.branch) {
      throw Errors.forbidden();
    }

    const product = await this.productRepo.findById(data.productId);
    if (!product) throw Errors.notFound(`Produk '${data.productId}' tidak ditemukan`);

    let updated;
    if (data.action === 'reduce') {
      const currentStock = await this.stockRepo.getCurrentStock(data.productId, data.branch);
      if (currentStock < data.amount) {
        throw Errors.badRequest('Stok tidak mencukupi untuk dikurangi');
      }
      updated = await this.stockRepo.deductStock(data.productId, data.branch, data.amount);
    } else {
      updated = await this.stockRepo.addStock(data.productId, data.branch, data.amount);
    }

    return {
      id: updated.productId,
      name: product.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim(),
      category: product.categoryName,
      totalIn: updated.totalIn,
      totalOut: updated.totalOut,
      stock: updated.totalIn - updated.totalOut,
      branch: updated.branch,
    };
  }

  async exportCsv(
    branch: string,
    user: JwtPayload,
  ): Promise<{ csv: string; filename: string }> {
    const items = await this.getStock(branch, user);

    const header = 'ID,Nama Produk,Kategori,Branch,Total Masuk,Total Keluar,Stok\n';
    const rows = items
      .map(
        (i) =>
          `${i.id},"${i.name}","${i.category}","${i.branch}",${i.totalIn},${i.totalOut},${i.stock}`,
      )
      .join('\n');

    const targetBranch = user.branch === 'Pusat' ? branch : user.branch;
    const date = new Date().toISOString().split('T')[0];
    const filename = `stock-${targetBranch}-${date}.csv`;

    return { csv: header + rows, filename };
  }
}

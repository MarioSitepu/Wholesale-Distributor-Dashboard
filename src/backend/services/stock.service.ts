import { JwtPayload, StockItem } from '../types/index';
import { StockRepository } from '../repositories/stock.repository';
import { ProductRepository } from '../repositories/product.repository';
import { Errors } from '../utils/errors';

export class StockService {
  private stockRepo = new StockRepository();
  private productRepo = new ProductRepository();

  async getStock(
    branch: string, 
    user: JwtPayload,
    page?: number,
    limit?: number,
    search?: string,
    category?: string,
    status?: string
  ): Promise<any> {
    const targetBranch = user.branch === 'Pusat' ? branch : user.branch;
    
    // If status filter is provided, we must fetch all matching records and paginate in memory
    // because totalIn - totalOut cannot be filtered directly in Prisma's where clause.
    const isMemoryPagination = !!status && status !== 'all';
    
    const rows = await this.stockRepo.findByBranch(
      targetBranch, 
      isMemoryPagination ? undefined : page, 
      isMemoryPagination ? undefined : limit, 
      search, 
      category
    );

    let data = rows.map((s: any) => ({
      id: s.productId,
      name: s.product?.name ? s.product.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim() : `Produk ${s.productId}`,
      category: s.product?.categoryName || 'Tanpa Kategori',
      unitsPerCarton: s.product?.unitsPerCarton || 0,
      totalIn: s.totalIn,
      totalOut: s.totalOut,
      stock: s.totalIn - s.totalOut,
      branch: s.branch,
    }));

    if (isMemoryPagination) {
      if (status === 'normal') data = data.filter(d => d.stock > 49);
      else if (status === 'low') data = data.filter(d => d.stock > 0 && d.stock < 50);
      else if (status === 'empty') data = data.filter(d => d.stock === 0);
    }

    let totalItems = data.length;
    
    if (!isMemoryPagination && page !== undefined && limit !== undefined) {
      totalItems = await this.stockRepo.countByBranch(targetBranch, search, category);
    }

    if (isMemoryPagination && page !== undefined && limit !== undefined) {
      const startIndex = (page - 1) * limit;
      data = data.slice(startIndex, startIndex + limit);
    }

    if (page !== undefined && limit !== undefined) {
      return {
        data,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        summaryStats: await this.stockRepo.getSummaryStats(targetBranch),
      };
    }

    return data;
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
      name: product?.name ? product.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim() : `Produk ${updated.productId}`,
      category: product?.categoryName || 'Tanpa Kategori',
      unitsPerCarton: product?.unitsPerCarton || 0,
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
    const result = await this.getStock(branch, user);
    const items = Array.isArray(result) ? result : result.data;

    const header = 'ID,Nama Produk,Kategori,Branch,Total Masuk,Total Keluar,Stok\n';
    const rows = items
      .map(
        (i: any) =>
          `${i.id},"${i.name}","${i.category}","${i.branch}",${i.totalIn},${i.totalOut},${i.stock}`,
      )
      .join('\n');

    const targetBranch = user.branch === 'Pusat' ? branch : user.branch;
    const date = new Date().toISOString().split('T')[0];
    const filename = `stock-${targetBranch}-${date}.csv`;

    return { csv: header + rows, filename };
  }
}

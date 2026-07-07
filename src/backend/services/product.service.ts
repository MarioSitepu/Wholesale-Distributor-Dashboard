import { JwtPayload, Product } from '../types/index';
import { ProductRepository } from '../repositories/product.repository';
import { Errors } from '../utils/errors';

export class ProductService {
  private productRepo = new ProductRepository();

  async getProducts(
    branch: string, 
    user: JwtPayload,
    page?: number,
    limit?: number,
    search?: string,
    category?: string
  ): Promise<any> {
    const targetBranch = user.branch === 'Pusat' ? branch : user.branch;
    const rows = await this.productRepo.findByBranch(targetBranch, page, limit, search, category);

    let totalItems = 0;
    if (page !== undefined && limit !== undefined) {
      totalItems = await this.productRepo.countByBranch(targetBranch, search, category);
    }

    const data = rows.map((p: any) => {
      const s = p.stockItems?.find((si: any) => si.branch === targetBranch) ?? p.stockItems?.[0];
      const totalIn = s?.totalIn ?? 0;
      const totalOut = s?.totalOut ?? 0;
      return {
        id: p.id,
        name: p.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim(),
        category: p.categoryName,
        price: Number(p.price),
        stock: totalIn - totalOut,
        totalIn,
        totalOut,
      };
    });

    if (page !== undefined && limit !== undefined) {
      return {
        data,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page
      };
    }

    return data;
  }

  async createProduct(
    data: { id: string; name: string; category: string; price: number; branch?: string },
    user: JwtPayload,
  ): Promise<Product> {
    const exists = await this.productRepo.existsById(data.id);
    if (exists) throw Errors.conflict(`Produk '${data.id}' sudah ada`);

    const targetBranch = user.branch === 'Pusat' ? (data.branch || 'Palembang') : user.branch;

    const p = await this.productRepo.create({
      id: data.id,
      name: data.name,
      categoryName: data.category,
      price: data.price,
      branch: targetBranch,
    });

    const s = p.stockItems[0];
    return {
      id: p.id,
      name: p.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim(),
      category: p.categoryName,
      price: Number(p.price),
      stock: 0,
      totalIn: s?.totalIn ?? 0,
      totalOut: s?.totalOut ?? 0,
    };
  }

  async updateProduct(
    id: string,
    data: { name: string; price: number; category: string },
  ): Promise<Product> {
    const existing = await this.productRepo.findById(id);
    if (!existing) throw Errors.notFound(`Produk '${id}' tidak ditemukan`);

    const p = await this.productRepo.update(id, {
      name: data.name,
      price: data.price,
      categoryName: data.category,
    });

    const s = p.stockItems[0];
    const totalIn = s?.totalIn ?? 0;
    const totalOut = s?.totalOut ?? 0;
    return {
      id: p.id,
      name: p.name ? p.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim() : `Produk ${p.id}`,
      category: p.categoryName,
      price: Number(p.price),
      stock: totalIn - totalOut,
      totalIn,
      totalOut,
    };
  }

  async deleteProduct(id: string): Promise<void> {
    const exists = await this.productRepo.existsById(id);
    if (!exists) throw Errors.notFound(`Produk '${id}' tidak ditemukan`);

    const inUse = await this.productRepo.isUsedInOrder(id);
    if (inUse) throw Errors.conflict('Produk sudah digunakan dalam order, tidak bisa dihapus');

    await this.productRepo.delete(id);
  }
}

import { JwtPayload, Product } from '../types/index.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { Errors } from '../utils/errors.js';

export class ProductService {
  private productRepo = new ProductRepository();

  async getProducts(branch: string, user: JwtPayload): Promise<Product[]> {
    const targetBranch = user.branch === 'Pusat' ? branch : user.branch;
    const rows = await this.productRepo.findByBranch(targetBranch);

    return rows.map((p) => {
      const s = p.stockItems.find((si) => si.branch === targetBranch) ?? p.stockItems[0];
      const totalIn = s?.totalIn ?? 0;
      const totalOut = s?.totalOut ?? 0;
      return {
        id: p.id,
        name: p.name,
        category: p.categoryName,
        price: Number(p.price),
        stock: totalIn - totalOut,
        totalIn,
        totalOut,
      };
    });
  }

  async createProduct(
    data: { id: string; name: string; category: string; price: number },
    user: JwtPayload,
  ): Promise<Product> {
    const exists = await this.productRepo.existsById(data.id);
    if (exists) throw Errors.conflict(`Produk '${data.id}' sudah ada`);

    const p = await this.productRepo.create({
      id: data.id,
      name: data.name,
      categoryName: data.category,
      price: data.price,
      branch: user.branch,
    });

    const s = p.stockItems[0];
    return {
      id: p.id,
      name: p.name,
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
      name: p.name,
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

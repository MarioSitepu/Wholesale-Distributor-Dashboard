import { CategoryRepository } from '../repositories/category.repository';
import { Errors } from '../utils/errors';

export class CategoryService {
  private categoryRepo = new CategoryRepository();

  async getCategories(): Promise<string[]> {
    return this.categoryRepo.findAll();
  }

  async createCategory(name: string): Promise<string[]> {
    const exists = await this.categoryRepo.existsByName(name);
    if (exists) throw Errors.conflict(`Kategori '${name}' sudah ada`);

    await this.categoryRepo.create(name);
    return this.categoryRepo.findAll();
  }

  async deleteCategory(name: string): Promise<void> {
    const exists = await this.categoryRepo.existsByName(name);
    if (!exists) throw Errors.notFound(`Kategori '${name}' tidak ditemukan`);

    const inUse = await this.categoryRepo.isUsedByProduct(name);
    if (inUse) throw Errors.conflict(`Kategori '${name}' masih digunakan produk`);

    await this.categoryRepo.deleteByName(name);
  }
}

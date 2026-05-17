import { JwtPayload, Store } from '../types/index.js';
import { StoreRepository } from '../repositories/store.repository.js';
import { Errors } from '../utils/errors.js';

export class StoreService {
  private storeRepo = new StoreRepository();

  async getStores(branch: string, user: JwtPayload): Promise<Store[]> {
    const targetBranch = user.branch === 'Pusat' ? branch : user.branch;
    const rows = await this.storeRepo.findByBranch(targetBranch);

    const stores = await Promise.all(
      rows.map(async (s) => ({
        id: s.id,
        name: s.name,
        branch: s.branch,
        totalDebt: await this.storeRepo.getTotalDebt(s.id),
      })),
    );
    return stores;
  }

  async createStore(
    data: { name: string; branch: string },
    user: JwtPayload,
  ): Promise<Store> {
    const branch = user.branch === 'Pusat' ? data.branch : user.branch;
    const id = `STR-${branch.toUpperCase().substring(0, 3)}-${Date.now()}`;

    const row = await this.storeRepo.create({ id, name: data.name, branch });
    return { id: row.id, name: row.name, branch: row.branch, totalDebt: 0 };
  }

  async updateStore(id: string, name: string, user: JwtPayload): Promise<Store> {
    const existing = await this.storeRepo.findById(id);
    if (!existing) throw Errors.notFound(`Toko '${id}' tidak ditemukan`);

    if (user.branch !== 'Pusat' && existing.branch !== user.branch) {
      throw Errors.forbidden();
    }

    const row = await this.storeRepo.update(id, name);
    const totalDebt = await this.storeRepo.getTotalDebt(id);
    return { id: row.id, name: row.name, branch: row.branch, totalDebt };
  }

  async deleteStore(id: string, user: JwtPayload): Promise<void> {
    const existing = await this.storeRepo.findById(id);
    if (!existing) throw Errors.notFound(`Toko '${id}' tidak ditemukan`);

    if (user.branch !== 'Pusat' && existing.branch !== user.branch) {
      throw Errors.forbidden();
    }

    const hasOrders = await this.storeRepo.hasOrders(id);
    if (hasOrders) throw Errors.conflict('Toko tidak bisa dihapus karena memiliki order');

    await this.storeRepo.delete(id);
  }
}

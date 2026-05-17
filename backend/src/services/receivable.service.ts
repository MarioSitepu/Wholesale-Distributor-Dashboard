import { JwtPayload, Receivable } from '../types/index.js';
import { ReceivableRepository } from '../repositories/receivable.repository.js';
import { Errors } from '../utils/errors.js';

export class ReceivableService {
  private receivableRepo = new ReceivableRepository();

  async getReceivables(branch: string, user: JwtPayload): Promise<Receivable[]> {
    const targetBranch = user.branch === 'Pusat' ? branch : user.branch;
    const rows = await this.receivableRepo.findByBranch(targetBranch);

    return rows.map((r) => ({
      id: r.id,
      storeId: r.storeId,
      storeName: r.store.name,
      orderId: r.orderId,
      amount: Number(r.amount),
      dueDate: r.dueDate.toISOString(),
      isPaid: r.isPaid,
    }));
  }

  async getSummary(
    branch: string,
    user: JwtPayload,
  ): Promise<{ total: number; unpaid: number; paid: number }> {
    const targetBranch = user.branch === 'Pusat' ? branch : user.branch;
    const rows = await this.receivableRepo.findByBranch(targetBranch);

    const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);
    const paid = rows.filter((r) => r.isPaid).reduce((sum, r) => sum + Number(r.amount), 0);
    const unpaid = total - paid;

    return { total, unpaid, paid };
  }

  async markAsPaid(id: string, user: JwtPayload): Promise<Receivable> {
    const existing = await this.receivableRepo.findById(id);
    if (!existing) throw Errors.notFound(`Piutang '${id}' tidak ditemukan`);

    if (user.branch !== 'Pusat' && existing.store.branch !== user.branch) {
      throw Errors.forbidden();
    }

    if (existing.isPaid) throw Errors.badRequest('Piutang sudah lunas');

    const updated = await this.receivableRepo.markAsPaid(id);
    return {
      id: updated.id,
      storeId: updated.storeId,
      storeName: updated.store.name,
      orderId: updated.orderId,
      amount: Number(updated.amount),
      dueDate: updated.dueDate.toISOString(),
      isPaid: updated.isPaid,
    };
  }
}

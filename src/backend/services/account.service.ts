import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { Errors } from '../utils/errors';

export class AccountService {
  private userRepo = new UserRepository();

  async getAccounts() {
    return this.userRepo.findAll();
  }

  async createAccount(data: {
    username: string;
    password: string;
    role: 'admin';
    branch: string;
  }) {
    const exists = await this.userRepo.existsByUsername(data.username);
    if (exists) throw Errors.conflict(`Username '${data.username}' sudah digunakan`);

    const hashed = await bcrypt.hash(data.password, 10);
    return this.userRepo.create({
      username: data.username,
      password: hashed,
      role: data.role,
      branch: data.branch,
    });
  }

  async deleteAccount(username: string): Promise<void> {
    const exists = await this.userRepo.existsByUsername(username);
    if (!exists) throw Errors.notFound(`Akun '${username}' tidak ditemukan`);
    await this.userRepo.deleteByUsername(username);
  }
}

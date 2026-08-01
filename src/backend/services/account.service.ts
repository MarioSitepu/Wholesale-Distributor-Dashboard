import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/user.repository";
import { Errors } from "../utils/errors";
import { prisma } from "../config/prisma";

export class AccountService {
  private userRepo = new UserRepository();

  async getAccounts() {
    return this.userRepo.findAll();
  }

  async createAccount(data: {
    username: string;
    password: string;
    role: "admin" | "superadmin";
    branch: string;
  }) {
    const exists = await this.userRepo.existsByUsername(data.username);
    if (exists)
      throw Errors.conflict(`Username '${data.username}' sudah digunakan`);

    const hashed = await bcrypt.hash(data.password, 10);
    
    // Auto-register branch if it doesn't exist
    const branchId = data.branch.toLowerCase().replace(/\s+/g, '-');
    const existingBranch = await prisma.branch.findUnique({ where: { name: data.branch } });
    if (!existingBranch) {
      await prisma.branch.create({
        data: { id: branchId, name: data.branch }
      });
    }

    return this.userRepo.create({
      username: data.username,
      password: hashed,
      role: data.role,
      branch: data.branch,
    });
  }

  async deleteAccount(username: string): Promise<void> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw Errors.notFound(`Akun '${username}' tidak ditemukan`);

    const branchName = user.branch;
    await this.userRepo.deleteByUsername(username);

    // Jika cabang lain bukan Pusat, dan tidak ada lagi akun user di cabang tersebut, hapus cabang dari master
    if (branchName && branchName !== "Pusat") {
      const remainingUsers = await prisma.user.count({ where: { branch: branchName } });
      if (remainingUsers === 0) {
        await prisma.branch.deleteMany({ where: { name: branchName } });
      }
    }
  }

  async changePassword(username: string, newPassword: string): Promise<void> {
    const exists = await this.userRepo.existsByUsername(username);
    if (!exists) throw Errors.notFound(`Akun '${username}' tidak ditemukan`);

    if (newPassword.length < 6) {
      throw Errors.badRequest("Password baru minimal 6 karakter");
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepo.updatePassword(username, hashed);
  }
}

import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AccountService } from '../services/account.service.js';
import { AuthRequest } from '../types/index.js';

const createAccountSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  role: z.literal('admin'),
  branch: z.string().min(1),
});

export class AccountController {
  private service = new AccountService();

  getAccounts = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accounts = await this.service.getAccounts();
      res.status(200).json(accounts);
    } catch (err) {
      next(err);
    }
  };

  createAccount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createAccountSchema.parse(req.body);
      const account = await this.service.createAccount(body);
      res.status(201).json(account);
    } catch (err) {
      next(err);
    }
  };

  deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteAccount(req.params.username);
      res.status(200).json({ message: 'Akun berhasil dihapus' });
    } catch (err) {
      next(err);
    }
  };
}

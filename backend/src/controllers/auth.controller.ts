import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { AuthRequest } from '../types/index.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export class AuthController {
  private service = new AuthService();

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = loginSchema.parse(req.body);
      const result = await this.service.login(body.username, body.password);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization!.split(' ')[1];
      await this.service.logout(token);
      res.status(200).json({ message: 'Logout berhasil' });
    } catch (err) {
      next(err);
    }
  };
}

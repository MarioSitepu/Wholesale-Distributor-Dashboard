import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AuthRequest, JwtPayload } from '../types/index.js';
import { Errors } from '../utils/errors.js';

/**
 * Middleware autentikasi — memvalidasi JWT dari header Authorization.
 * Menyimpan payload user ke req.user untuk digunakan controller/service.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
  }
}

/**
 * Middleware otorisasi — memastikan user adalah Super Admin (branch === 'Pusat').
 * Harus digunakan setelah `authenticate`.
 */
export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.branch !== 'Pusat') {
    res.status(403).json({ message: 'Akses ditolak' });
    return;
  }
  next();
}

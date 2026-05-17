import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errors.js';
import { ZodError } from 'zod';

/**
 * Global error handler — harus didaftarkan terakhir di app.ts.
 * Menangani HttpError, ZodError, dan error tak terduga.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...err.extra,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validasi input gagal',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
    return;
  }

  // Error tak terduga — jangan bocorkan detail ke client
  console.error('[Unhandled Error]', err);
  res.status(500).json({ message: 'Terjadi kesalahan internal server' });
}

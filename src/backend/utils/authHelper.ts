import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types/index';
import { NextResponse } from 'next/server';
import { HttpError } from './errors';

export function getAuthenticatedUser(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    // Bypass auth for local development if frontend hasn't fully integrated JWT login
    if (env.NODE_ENV === 'development') {
      return { id: 'dev-admin', role: 'admin', branch: 'Pusat', username: 'superadmin' } as JwtPayload;
    }
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    if (env.NODE_ENV === 'development') {
      return { id: 'dev-admin', role: 'admin', branch: 'Pusat', username: 'superadmin' } as JwtPayload;
    }
    return null;
  }
}

export function handleUnauthorized() {
  return NextResponse.json({ message: 'Token tidak valid atau sudah kedaluwarsa' }, { status: 401 });
}

export function handleForbidden() {
  return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
}

export function handleError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ message: error.message, ...error.extra }, { status: error.statusCode });
  }
  console.error(error);
  const msg = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ message: `Terjadi kesalahan pada server: ${msg}` }, { status: 500 });
}

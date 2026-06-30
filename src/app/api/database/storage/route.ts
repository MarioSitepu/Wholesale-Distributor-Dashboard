export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { DatabaseService } from '../../../../backend/services/database.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../backend/utils/authHelper';

const dbService = new DatabaseService();

export async function GET(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  // Hanya admin/superadmin yang diizinkan melihat storage
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const storageInfo = await dbService.getDatabaseStorage();
    
    return NextResponse.json(storageInfo, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}


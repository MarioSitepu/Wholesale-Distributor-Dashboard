import { NextResponse } from 'next/server';
import { DatabaseService } from '../../../../backend/services/database.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../backend/utils/authHelper';

const dbService = new DatabaseService();

export async function GET(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  // Hanya admin yang diizinkan melihat storage
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const storageInfo = await dbService.getDatabaseStorage();
    
    return NextResponse.json(storageInfo, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

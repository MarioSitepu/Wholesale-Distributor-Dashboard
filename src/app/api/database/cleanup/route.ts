export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DatabaseService } from '../../../../backend/services/database.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../backend/utils/authHelper';

const dbService = new DatabaseService();

const cleanupSchema = z.object({
  date: z.string().datetime(),
});

export async function DELETE(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  // Hanya admin yang diizinkan menghapus database
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = cleanupSchema.parse(await request.json());
    const targetDate = new Date(body.date);
    
    const result = await dbService.deleteDataBeforeDate(targetDate);
    
    return NextResponse.json(
      { message: `Berhasil menghapus ${result.deletedCount} order dan data terkaitnya.`, ...result }, 
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}


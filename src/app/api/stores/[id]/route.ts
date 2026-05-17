import { NextResponse } from 'next/server';
import { z } from 'zod';
import { StoreService } from '../../../../backend/services/store.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../backend/utils/authHelper';

const storeService = new StoreService();

const updateStoreSchema = z.object({
  name: z.string().min(1),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  try {
    const { id } = await context.params;
    const body = updateStoreSchema.parse(await request.json());
    const store = await storeService.updateStore(id, body.name, user);
    return NextResponse.json(store, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  try {
    const { id } = await context.params;
    await storeService.deleteStore(id, user);
    return NextResponse.json({ message: 'Toko berhasil dihapus' }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

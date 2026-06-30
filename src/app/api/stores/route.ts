import { NextResponse } from 'next/server';
import { z } from 'zod';
import { StoreService } from '../../../backend/services/store.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../backend/utils/authHelper';

const storeService = new StoreService();

const createStoreSchema = z.object({
  name: z.string().min(1),
  branch: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || user.branch;
    const stores = await storeService.getStores(branch, user);
    return NextResponse.json(stores, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const body = createStoreSchema.parse(await request.json());
    const store = await storeService.createStore(body, user);
    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

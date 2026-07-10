export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { StockService } from '../../../backend/services/stock.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../backend/utils/authHelper';

const stockService = new StockService();

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || user.branch;
    
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;

    const page = pageParam ? parseInt(pageParam) : undefined;
    const limit = limitParam ? parseInt(limitParam) : undefined;

    const stocks = await stockService.getStock(branch, user, page, limit, search, category, status);
    console.log(`[GET /api/stock] branch=${branch}, userBranch=${user.branch}, targetBranch=${user.branch === 'Pusat' ? branch : user.branch}, resultCount=${Array.isArray(stocks) ? stocks.length : stocks.data.length}`);
    return NextResponse.json(stocks, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

const restockSchema = z.object({
  productId: z.string().min(1),
  branch: z.string().min(1),
  amount: z.number().int().positive(),
  action: z.enum(['add', 'reduce']).optional().default('add'),
});

export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const body = restockSchema.parse(await request.json());
    const result = await stockService.restock(body, user);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

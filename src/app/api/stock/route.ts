import { NextResponse } from 'next/server';
import { z } from 'zod';
import { StockService } from '../../../backend/services/stock.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../backend/utils/authHelper';

const stockService = new StockService();

export async function GET(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || user.branch;
    const stocks = await stockService.getStock(branch, user);
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
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  try {
    const body = restockSchema.parse(await request.json());
    const result = await stockService.restock(body, user);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

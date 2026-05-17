import { NextResponse } from 'next/server';
import { z } from 'zod';
import { StockService } from '../../../../backend/services/stock.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../backend/utils/authHelper';

const stockService = new StockService();

const restockSchema = z.object({
  productId: z.string().min(1),
  branch: z.string().min(1),
  amount: z.number().int().positive({ message: 'Jumlah restock harus berupa bilangan bulat positif' }),
});

export async function POST(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  try {
    const body = restockSchema.parse(await request.json());
    const updatedStock = await stockService.restock(body, user);
    return NextResponse.json(updatedStock, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

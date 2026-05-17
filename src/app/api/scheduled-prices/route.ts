import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ScheduledPriceService } from '../../../backend/services/scheduledPrice.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../backend/utils/authHelper';

const scheduledPriceService = new ScheduledPriceService();

const createSchema = z.object({
  productId: z.string().min(1),
  newPrice: z.number().positive({ message: 'newPrice harus lebih dari 0' }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format startDate harus YYYY-MM-DD' }),
});

export async function GET(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || user.branch;
    const prices = await scheduledPriceService.getScheduledPrices(branch);
    return NextResponse.json(prices, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  try {
    const body = createSchema.parse(await request.json());
    const result = await scheduledPriceService.createScheduledPrice(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

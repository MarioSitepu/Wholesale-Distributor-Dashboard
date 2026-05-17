import { NextResponse } from 'next/server';
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

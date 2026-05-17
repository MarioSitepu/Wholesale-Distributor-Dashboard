import { NextResponse } from 'next/server';
import { StockService } from '../../../../backend/services/stock.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../backend/utils/authHelper';

const stockService = new StockService();

export async function GET(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || user.branch;
    const result = await stockService.exportCsv(branch, user);

    return new NextResponse(result.csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

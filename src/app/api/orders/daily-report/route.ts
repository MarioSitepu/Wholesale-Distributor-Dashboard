import { NextResponse } from 'next/server';
import { OrderService } from '../../../../backend/services/order.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../backend/utils/authHelper';

const orderService = new OrderService();

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || user.branch;
    const date = searchParams.get('date');
    const storeId = searchParams.get('storeId') || 'all';

    if (!date) {
      return NextResponse.json({ message: 'Parameter date harus ditentukan (YYYY-MM-DD)' }, { status: 400 });
    }

    const report = await orderService.getDailyReport({ branch, date, storeId }, user);
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

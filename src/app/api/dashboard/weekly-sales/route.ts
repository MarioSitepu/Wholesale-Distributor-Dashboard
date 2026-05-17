import { NextResponse } from 'next/server';
import { DashboardService } from '../../../../backend/services/dashboard.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../backend/utils/authHelper';

const dashboardService = new DashboardService();

export async function GET(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || user.branch;
    const data = await dashboardService.getWeeklySales(branch);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

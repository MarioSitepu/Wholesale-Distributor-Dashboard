export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { DashboardService } from '../../../../backend/services/dashboard.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../backend/utils/authHelper';

const dashboardService = new DashboardService();

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || user.branch;
    const kpis = await dashboardService.getKpi(branch);
    return NextResponse.json(kpis, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}


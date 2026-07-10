import { NextResponse } from 'next/server';
import { DashboardService } from '../../../../backend/services/dashboard.service';

const dashboardService = new DashboardService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || 'all';

    const data = await dashboardService.getTopProducts(branch);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Top products error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data produk terlaris', details: error.message },
      { status: 500 }
    );
  }
}

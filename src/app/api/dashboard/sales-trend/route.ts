import { NextResponse } from 'next/server';
import { DashboardService } from '../../../../backend/services/dashboard.service';

const dashboardService = new DashboardService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || 'all';
    const type = (searchParams.get('type') || 'minggu') as 'minggu' | 'bulan' | 'tahun';
    const valueStr = searchParams.get('value');
    const value = valueStr ? parseInt(valueStr, 10) : undefined;

    const data = await dashboardService.getSalesTrend(branch, type, value);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Sales trend error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data tren penjualan', details: error.message },
      { status: 500 }
    );
  }
}

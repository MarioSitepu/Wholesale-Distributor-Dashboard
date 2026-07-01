export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../backend/config/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || 'Palembang';

    const countAll = await prisma.stockItem.count();
    const countBranch = await prisma.stockItem.count({
      where: { branch: { in: [branch, 'all', 'Pusat'] } }
    });

    const first5 = await prisma.stockItem.findMany({
      where: { branch: { in: [branch, 'all', 'Pusat'] } },
      take: 5,
      include: { product: true }
    });

    return NextResponse.json({
      success: true,
      branch_tested: branch,
      total_stock_all_branches: countAll,
      total_stock_this_branch: countBranch,
      first_5_items: first5,
      database_url: process.env.DATABASE_URL ? "SET" : "MISSING",
      direct_url: process.env.DIRECT_URL ? "SET" : "MISSING",
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

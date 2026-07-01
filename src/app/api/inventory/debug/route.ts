export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../backend/config/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || 'Palembang';

    const countAll = await prisma.stockItem.count();
    const productCount = await prisma.product.count();
    const userCount = await prisma.user.count();

    const dbUrl = process.env.DATABASE_URL || "";
    
    return NextResponse.json({
      success: true,
      total_stock_all_branches: countAll,
      total_products: productCount,
      total_users: userCount,
      db_url_starts_with: dbUrl.substring(0, 15),
      db_url_host: dbUrl.includes("@") ? dbUrl.split("@")[1].split("/")[0] : "unknown",
      db_url_is_supabase: dbUrl.includes("supabase"),
      direct_url_is_supabase: (process.env.DIRECT_URL || "").includes("supabase"),
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

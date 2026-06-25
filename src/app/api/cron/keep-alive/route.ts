import { NextResponse } from 'next/server';
import { prisma } from '@/backend/prisma';

// Endpoint ini dapat dipanggil oleh layanan cron (seperti Vercel Cron, cron-job.org, dll)
// secara berkala (misal setiap 5 menit atau 1 hari sekali) untuk menjaga agar 
// Supabase/database tidak dalam status "paused" akibat tidak aktif.
export async function GET() {
  try {
    // Mengeksekusi query paling ringan ke database untuk melakukan 'ping'
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      message: 'Database connection kept alive.',
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Keep-alive cron error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to keep database alive.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

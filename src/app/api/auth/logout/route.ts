import { NextResponse } from 'next/server';
import { getAuthenticatedUser, handleUnauthorized } from '../../../../backend/utils/authHelper';

export async function POST(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  return NextResponse.json({ success: true, message: 'Logout berhasil' }, { status: 200 });
}

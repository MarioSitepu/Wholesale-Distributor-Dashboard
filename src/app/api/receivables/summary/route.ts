import { NextResponse } from 'next/server';
import { ReceivableService } from '../../../../backend/services/receivable.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../backend/utils/authHelper';

const receivableService = new ReceivableService();

export async function GET(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || user.branch;
    const summary = await receivableService.getSummary(branch, user);
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

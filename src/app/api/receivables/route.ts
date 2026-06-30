import { NextResponse } from 'next/server';
import { ReceivableService } from '../../../backend/services/receivable.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../backend/utils/authHelper';

const receivableService = new ReceivableService();

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || user.branch;
    const receivables = await receivableService.getReceivables(branch, user);
    return NextResponse.json(receivables, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

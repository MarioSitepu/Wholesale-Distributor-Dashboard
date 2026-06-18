import { NextResponse } from 'next/server';
import { ReceivableService } from '../../../../../backend/services/receivable.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../../backend/utils/authHelper';

const receivableService = new ReceivableService();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  try {
    const { id } = await params;
    const result = await receivableService.markAsPaid(id, user);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

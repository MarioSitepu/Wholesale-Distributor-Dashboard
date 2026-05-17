import { NextResponse } from 'next/server';
import { ReceivableService } from '../../../../backend/services/receivable.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../backend/utils/authHelper';

const receivableService = new ReceivableService();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  try {
    const { id } = await context.params;
    const updated = await receivableService.markAsPaid(id, user);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

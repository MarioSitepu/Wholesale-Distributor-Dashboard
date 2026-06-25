import { NextResponse } from 'next/server';
import { ScheduledPriceService } from '../../../../backend/services/scheduledPrice.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../backend/utils/authHelper';

const scheduledPriceService = new ScheduledPriceService();

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await scheduledPriceService.deleteScheduledPrice(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

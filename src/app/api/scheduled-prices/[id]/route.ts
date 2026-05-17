import { NextResponse } from 'next/server';
import { ScheduledPriceService } from '../../../../backend/services/scheduledPrice.service';
import { getAuthenticatedUser, handleUnauthorized, handleForbidden, handleError } from '../../../../backend/utils/authHelper';

const scheduledPriceService = new ScheduledPriceService();

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();
  if (user.branch !== 'Pusat') return handleForbidden();

  try {
    const { id } = await context.params;
    await scheduledPriceService.deleteScheduledPrice(id);
    return NextResponse.json({ message: 'Jadwal berhasil dihapus' }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

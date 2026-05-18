import { NextResponse } from 'next/server';
import { AccountService } from '../../../../backend/services/account.service';
import { getAuthenticatedUser, handleUnauthorized, handleForbidden, handleError } from '../../../../backend/utils/authHelper';

const accountService = new AccountService();

export async function DELETE(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();
  if (user.branch !== 'Pusat') return handleForbidden();

  try {
    const { username } = await context.params;
    if (username === 'superadmin') {
      return NextResponse.json({ message: 'Tidak dapat menghapus superadmin' }, { status: 403 });
    }
    await accountService.deleteAccount(username);
    return NextResponse.json({ message: 'Akun berhasil dihapus' }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();
  // Hanya superadmin (Pusat) yang dapat mengubah password via panel admin
  if (user.branch !== 'Pusat') return handleForbidden();

  try {
    const { username } = await context.params;
    const body = await request.json();
    const newPassword = body.password;

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ message: 'Password baru diperlukan' }, { status: 400 });
    }

    await accountService.changePassword(username, newPassword);
    return NextResponse.json({ message: 'Password berhasil diubah' }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

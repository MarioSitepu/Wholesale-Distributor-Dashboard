import { NextResponse } from 'next/server';
import { CategoryService } from '../../../../backend/services/category.service';
import { getAuthenticatedUser, handleUnauthorized, handleForbidden, handleError } from '../../../../backend/utils/authHelper';

const categoryService = new CategoryService();

export async function DELETE(
  request: Request,
  context: { params: Promise<{ name: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();
  if (user.branch !== 'Pusat') return handleForbidden();

  try {
    const { name } = await context.params;
    // Decode URI name in case it contains spaces/special characters
    const decodedName = decodeURIComponent(name);
    await categoryService.deleteCategory(decodedName);
    return NextResponse.json({ message: 'Kategori berhasil dihapus' }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

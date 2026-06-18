import { NextResponse } from 'next/server';
import { CategoryService } from '../../../../../backend/services/category.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../../backend/utils/authHelper';

const categoryService = new CategoryService();

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    // URL-decoded name
    const categoryName = decodeURIComponent(id);
    await categoryService.deleteCategory(categoryName);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

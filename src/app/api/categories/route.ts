export const revalidate = 3600; // Cache 1 jam
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { CategoryService } from '../../../backend/services/category.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../backend/utils/authHelper';

const categoryService = new CategoryService();

const createCategorySchema = z.object({
  name: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const categories = await categoryService.getCategories();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}


export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const body = createCategorySchema.parse(await request.json());
    const category = await categoryService.createCategory(body.name);
    revalidatePath('/api/categories');
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

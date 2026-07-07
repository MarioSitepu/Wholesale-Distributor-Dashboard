import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ProductService } from '../../../backend/services/product.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../backend/utils/authHelper';

const productService = new ProductService();

export const dynamic = 'force-dynamic';

const createProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  branch: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || 'all';
    
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;

    const page = pageParam ? parseInt(pageParam) : undefined;
    const limit = limitParam ? parseInt(limitParam) : undefined;

    const products = await productService.getProducts(branch, user, page, limit, search, category);
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const body = createProductSchema.parse(await request.json());
    const product = await productService.createProduct(body, user);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

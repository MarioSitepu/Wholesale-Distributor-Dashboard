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
  price: z.coerce.number().positive(),
  unitsPerCarton: z.coerce.number().int().min(0).default(0),
  branch: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || 'all';
    const products = await productService.getProducts(branch, user);
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

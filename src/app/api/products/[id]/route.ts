import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ProductService } from '../../../../../backend/services/product.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../../../backend/utils/authHelper';

const productService = new ProductService();

const updateProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  category: z.string().min(1),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = updateProductSchema.parse(await request.json());
    const product = await productService.updateProduct(id, body);
    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await productService.deleteProduct(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

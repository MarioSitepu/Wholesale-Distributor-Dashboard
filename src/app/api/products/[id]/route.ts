import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ProductService } from '../../../../backend/services/product.service';
import { getAuthenticatedUser, handleUnauthorized, handleForbidden, handleError } from '../../../../backend/utils/authHelper';

const productService = new ProductService();

const updateProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string().min(1),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();
  if (user.branch !== 'Pusat') return handleForbidden();

  try {
    const { id } = await context.params;
    const body = updateProductSchema.parse(await request.json());
    const product = await productService.updateProduct(id, body);
    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();
  if (user.branch !== 'Pusat') return handleForbidden();

  try {
    const { id } = await context.params;
    await productService.deleteProduct(id);
    return NextResponse.json({ message: 'Produk berhasil dihapus' }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../backend/config/prisma';
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
    const targetBranch = user.branch === 'Pusat' ? branch : user.branch;
    
    // Query directly to bypass any Next.js build cache issues with external files
    const where = targetBranch === 'all' ? {} : { branch: { in: [targetBranch, 'all'] } };
    
    const rows = await prisma.product.findMany({
      where,
      include: { stockItems: true },
      orderBy: { name: 'asc' },
    });

    const products = rows.map((p: any) => {
      const s = p.stockItems.find((si: any) => si.branch === targetBranch) ?? p.stockItems[0];
      const totalIn = s?.totalIn ?? 0;
      const totalOut = s?.totalOut ?? 0;
      return {
        id: p.id,
        name: p.name.replace(/^\s*\d+\s+/, '').replace(/\s*\([^)]+\)\s*$/g, '').replace(/\s*(?:\d+\s*(?:G|GR|KG|ML)?\s*[xX]\s*\d+|\d+\s*[xX]\s*\d+\s*(?:G|GR|KG|ML)?|\d+\s*(?:G|GR|KG|ML|PCS)\b|\bSZ\b|\d+$).*$/i, '').trim(),
        category: p.categoryName,
        price: Number(p.price),
        stock: totalIn - totalOut,
        totalIn,
        totalOut,
      };
    });

    if (targetBranch === 'Baturaja') {
      return NextResponse.json({
        debug: {
          branch: branch,
          targetBranch: targetBranch,
          where: where,
          rowsLength: rows.length,
          productsLength: products.length,
          firstRow: rows[0],
          firstProduct: products[0]
        },
        products: products
      }, { status: 200 });
    }
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

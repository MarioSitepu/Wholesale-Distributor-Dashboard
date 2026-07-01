export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { OrderService } from '../../../backend/services/order.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../backend/utils/authHelper';

const orderService = new OrderService();

const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const createOrderSchema = z.object({
  id: z.string().min(1),
  storeId: z.string().min(1),
  storeName: z.string().min(1),
  branch: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  total: z.number().positive(),
  createdAt: z.string().datetime(),
});

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || user.branch;
    const date = searchParams.get('date') || undefined;
    const month = searchParams.get('month') || undefined;

    const orders = await orderService.getOrders({ branch, date, month }, user);
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const body = createOrderSchema.parse(await request.json());
    const order = await orderService.createOrder(body, user);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}


export async function DELETE(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const { searchParams } = new URL(request.url);
    const beforeMonth = searchParams.get('beforeMonth');
    if (!beforeMonth) {
      return NextResponse.json({ error: "Parameter beforeMonth diperlukan" }, { status: 400 });
    }

    const result = await orderService.deleteOrdersBefore(beforeMonth, user);
    return NextResponse.json({ message: "Berhasil menghapus riwayat pesanan", deletedCount: result.deletedCount }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

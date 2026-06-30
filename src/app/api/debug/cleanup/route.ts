import { NextResponse } from 'next/server';
import { prisma } from '../../../../../backend/config/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Exact IDs from seed.ts
    const dummyStoreIds = [
      "STR-PAL-001", "STR-PAL-002", "STR-PAL-003",
      "STR-BAT-001", "STR-BAT-002",
      "STR-JAM-001", "STR-JAM-002"
    ];

    const dummyOrderIds = [
      "ORD-PAL-1001", "ORD-PAL-1002", "ORD-PAL-1003",
      "ORD-BAT-1001", "ORD-BAT-1002",
      "ORD-JAM-1001"
    ];

    // Delete Receivables associated with dummy orders
    await prisma.receivable.deleteMany({
      where: { orderId: { in: dummyOrderIds } }
    });

    // Delete OrderItems associated with dummy orders
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: dummyOrderIds } }
    });

    // Delete dummy orders
    await prisma.order.deleteMany({
      where: { id: { in: dummyOrderIds } }
    });

    // Delete dummy stores
    await prisma.store.deleteMany({
      where: { id: { in: dummyStoreIds } }
    });

    // Find all dummy products (their IDs end with -PAL, -BAT, -JAM based on seed.ts)
    const allProducts = await prisma.product.findMany({ select: { id: true } });
    const dummyProductIds = allProducts
      .filter(p => p.id.endsWith('-PAL') || p.id.endsWith('-BAT') || p.id.endsWith('-JAM'))
      .map(p => p.id);

    if (dummyProductIds.length > 0) {
      // Delete stock items for these products
      await prisma.stockItem.deleteMany({
        where: { productId: { in: dummyProductIds } }
      });
      // Delete scheduled prices for these products
      await prisma.scheduledPrice.deleteMany({
        where: { productId: { in: dummyProductIds } }
      });
      // Delete the dummy products
      await prisma.product.deleteMany({
        where: { id: { in: dummyProductIds } }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Dummy data wiped out cleanly.",
      deletedOrders: dummyOrderIds.length,
      deletedStores: dummyStoreIds.length,
      deletedProducts: dummyProductIds.length
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

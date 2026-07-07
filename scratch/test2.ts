import { OrderRepository } from '../src/backend/repositories/order.repository';

async function main() {
  const repo = new OrderRepository();
  const resultDay = await repo.findMany({ branch: 'all', date: '2026-07-01' });
  console.log('day count 07-01:', resultDay.length);
  
  const resultDayToday = await repo.findMany({ branch: 'all', date: '2026-07-02' });
  console.log('day count 07-02:', resultDayToday.length);

  const resultMonth = await repo.findMany({ branch: 'all', month: '2026-07' });
  console.log('month count 2026-07:', resultMonth.length);
}

main().catch(console.error);

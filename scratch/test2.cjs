const { OrderRepository } = require('./src/backend/repositories/order.repository');
const repo = new OrderRepository();

async function main() {
  const resultDay = await repo.findMany({ branch: 'all', date: '2026-07-01' });
  console.log('day count:', resultDay.length);

  const resultMonth = await repo.findMany({ branch: 'all', month: '2026-07' });
  console.log('month count:', resultMonth.length);
}

main().catch(console.error);

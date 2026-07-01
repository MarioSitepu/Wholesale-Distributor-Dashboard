const { StockService } = require('./src/backend/services/stock.service.ts');
const stockService = new StockService();
async function main() {
  const user = { branch: 'Pusat' };
  try {
    const result = await stockService.getStock('Palembang', user);
    console.log("Stock length:", result.length);
  } catch(e) {
    console.error("Error in getStock:", e);
  }
}
main();

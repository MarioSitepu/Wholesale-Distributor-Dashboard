const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.join(__dirname, 'products.txt'), 'utf8');

const lines = text.split('\n').map(l => l.trim()).filter(l => l);

const productTemplates = [];
let currentCategory = '';

for (const line of lines) {
  if (line.startsWith('=== SHEET:')) {
    currentCategory = line.split('=== SHEET:')[1].split('===')[0].trim();
    // Use proper casing
    currentCategory = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1).toLowerCase();
    if (currentCategory === 'Okefood') currentCategory = 'OkeFood'; // Or just Okefood
    continue;
  }
  
  if (line.includes('KODE PRODUK') || line.startsWith('No |')) {
    continue;
  }
  
  const parts = line.split('|').map(p => p.trim());
  if (parts.length >= 6) {
    const [no, code, name, isi, grKg, priceStr] = parts;
    const price = parseInt(priceStr.replace(/\D/g, ''), 10);
    if (!isNaN(price) && code && name) {
      productTemplates.push({
        id: code,
        name: name.replace('_x000D_', '').trim(),
        categoryName: currentCategory,
        price: price,
        totalIn: 100, // random initial stock
        totalOut: 10
      });
    }
  }
}

// Generate the code strings
const categoriesString = `const categories = [{ name: "Fiesta" }, { name: "Shifudo" }, { name: "OkeFood" }];`;
const productsString = `const productTemplates = [\n` + productTemplates.map(p => `    { id: "${p.id}", name: "${p.name}", categoryName: "${p.categoryName}", price: ${p.price}, totalIn: ${p.totalIn}, totalOut: ${p.totalOut} },`).join('\n') + `\n  ];`;

const seedPath = path.join(__dirname, '..', 'prisma', 'seed.ts');
let seedContent = fs.readFileSync(seedPath, 'utf8');

// Replace categories
seedContent = seedContent.replace(
  /const categories = \[{ name: "Fiesta" }, { name: "Shifudo" }\];/,
  categoriesString
);

// Replace productTemplates
const prodStart = seedContent.indexOf('const productTemplates = [');
const prodEnd = seedContent.indexOf('];', prodStart) + 2;
seedContent = seedContent.substring(0, prodStart) + productsString + seedContent.substring(prodEnd);

// Fix sample orders to use the new IDs. We know FIESTA has 12010111, 12010112...
// Or we can just empty the sampleOrders array to be safe:
// const sampleOrders = [];
const orderStart = seedContent.indexOf('const sampleOrders = [');
const orderEnd = seedContent.indexOf('];', orderStart) + 2;
seedContent = seedContent.substring(0, orderStart) + `const sampleOrders = [];` + seedContent.substring(orderEnd);

fs.writeFileSync(seedPath, seedContent);

console.log('Successfully updated seed.ts');

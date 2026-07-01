const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:');
  users.forEach(u => console.log(u.username, u.branch));
}
main().then(() => prisma.$disconnect()).catch(console.error);

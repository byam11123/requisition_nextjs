const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst();
  if (user) {
    console.log(`User ID: ${user.id}, Org ID: ${user.organizationId}, Role: ${user.role}`);
  } else {
    console.log("No users found");
  }
}

run();

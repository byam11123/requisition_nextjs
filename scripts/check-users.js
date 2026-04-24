const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Default Org',
        requisitionPrefix: 'REQ',
        contactEmail: 'org@example.com',
      }
    });
    console.log("Created default organization");
  }

  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  
  const passwordHash = await bcrypt.hash('password123', 10);

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        fullName: 'System Admin',
        role: 'ADMIN',
        organizationId: org.id,
        passwordHash,
      }
    });
    console.log("Created new admin user:");
    console.log("Email: admin@example.com");
    console.log("Password: password123");
  } else {
    // Overwrite password so we know what it is
    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash }
    });
    console.log("Found existing admin! Password has been reset.");
    console.log(`Email: ${admin.email}`);
    console.log("Password: password123");
  }

  let manager = await prisma.user.findFirst({ where: { email: 'manager@example.com' } });
  if (!manager) {
    await prisma.user.create({
      data: {
        email: 'manager@example.com',
        fullName: 'Test Manager',
        role: 'MANAGER',
        organizationId: org.id,
        passwordHash,
      }
    });
    console.log("Created new manager user:");
    console.log("Email: manager@example.com");
    console.log("Password: password123");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const LOCAL_DIR = path.join(process.cwd(), '.local');

async function syncFileToDb(filename: string, model: any, entityName: string) {
  const filepath = path.join(LOCAL_DIR, filename);
  if (!fs.existsSync(filepath)) return;

  console.log(`Syncing ${filename}...`);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

  for (const [orgId, payload] of Object.entries(data)) {
    if (isNaN(Number(orgId)) || orgId === 'demo') continue;

    try {
      await model.upsert({
        where: { organizationId: BigInt(orgId) },
        update: { payload: JSON.stringify(payload) },
        create: {
          organizationId: BigInt(orgId),
          payload: JSON.stringify(payload),
        },
      });
      console.log(`  Synced ${entityName} for org ${orgId}`);
    } catch (err) {
      console.error(`  Error syncing ${entityName} for org ${orgId}:`, err);
    }
  }
}

async function main() {
  await syncFileToDb('workflow-config.json', prisma.workflowConfig, 'Workflow');
  await syncFileToDb('custom-roles.json', prisma.customRoleConfig, 'Custom Roles');
  await syncFileToDb('contacts.json', prisma.contactConfig, 'Contacts');
  await syncFileToDb('designations.json', prisma.designationConfig, 'Designations');
  await syncFileToDb('store-management-store.json', prisma.storeManagementConfig, 'Store Management');

  // Sync user custom roles
  const userRolesPath = path.join(LOCAL_DIR, 'user-custom-roles.json');
  if (fs.existsSync(userRolesPath)) {
    const userRoles = JSON.parse(fs.readFileSync(userRolesPath, 'utf8'));
    for (const [userId, roleKey] of Object.entries(userRoles)) {
      if (isNaN(Number(userId))) continue;
      try {
        await prisma.user.update({
          where: { id: BigInt(userId) },
          data: { customRoleKey: String(roleKey) },
        });
        console.log(`  Synced custom role for user ${userId}`);
      } catch (err) {
        console.error(`  Error syncing user ${userId}:`, err);
      }
    }
  }

  console.log('Migration complete!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

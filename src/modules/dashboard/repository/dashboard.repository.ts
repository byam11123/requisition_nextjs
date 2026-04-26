import { prisma } from '@/lib/prisma';

export class DashboardRepository {
  async getCounts(organizationId: string) {
    const orgId = BigInt(organizationId);
    
    const [reqsCount, repairsCount, usersCount] = await Promise.all([
      prisma.requisition.count({
        where: {
          organizationId: orgId,
          OR: [
            { requiredFor: null },
            { requiredFor: '' },
            { requiredFor: { notIn: ['REPAIR_MAINTAINANCE', 'DRIVER_ATTENDANCE', 'SALARY_ADVANCE', 'VEHICLE_FUEL'] } },
          ],
        },
      }),
      prisma.requisition.count({
        where: {
          organizationId: orgId,
          requiredFor: 'REPAIR_MAINTAINANCE',
        },
      }),
      prisma.user.count({
        where: { organizationId: orgId },
      }),
    ]);

    return {
      requisitions: reqsCount,
      repairs: repairsCount,
      users: usersCount,
    };
  }

  async getRecentRequisitions(organizationId: string, limit = 10) {
    const orgId = BigInt(organizationId);
    return await prisma.requisition.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { requiredFor: null },
          { requiredFor: '' },
          { requiredFor: { notIn: ['REPAIR_MAINTAINANCE', 'DRIVER_ATTENDANCE', 'SALARY_ADVANCE', 'VEHICLE_FUEL'] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRecentRepairs(organizationId: string, limit = 10) {
    const orgId = BigInt(organizationId);
    return await prisma.requisition.findMany({
      where: {
        organizationId: orgId,
        requiredFor: 'REPAIR_MAINTAINANCE',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRecentNotifications(organizationId: string, limit = 10) {
    return [];
  }
}

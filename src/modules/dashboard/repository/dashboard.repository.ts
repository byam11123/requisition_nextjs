import { prisma } from '@/lib/prisma';

export class DashboardRepository {
  async getCounts(organizationId: string) {
    const orgId = BigInt(organizationId);
    
    const [reqsCount, repairsCount, usersCount, attendanceCount, fuelCount, salaryCount] = await Promise.all([
      prisma.requisition.count({
        where: {
          organizationId: orgId,
          OR: [
            { requiredFor: null },
            { requiredFor: '' },
            { requiredFor: { notIn: ['REPAIR_MAINTENANCE', 'DRIVER_ATTENDANCE', 'SALARY_ADVANCE', 'VEHICLE_FUEL'] } },
          ],
        },
      }),
      prisma.requisition.count({
        where: {
          organizationId: orgId,
          requiredFor: 'REPAIR_MAINTENANCE',
        },
      }),
      prisma.user.count({
        where: { organizationId: orgId },
      }),
      prisma.requisition.count({
        where: {
          organizationId: orgId,
          requiredFor: 'DRIVER_ATTENDANCE',
        },
      }),
      prisma.requisition.count({
        where: {
          organizationId: orgId,
          requiredFor: 'VEHICLE_FUEL',
        },
      }),
      prisma.requisition.count({
        where: {
          organizationId: orgId,
          requiredFor: 'SALARY_ADVANCE',
        },
      }),
    ]);

    return {
      requisitions: reqsCount,
      repairs: repairsCount,
      users: usersCount,
      attendance: attendanceCount,
      fuel: fuelCount,
      salary: salaryCount,
      total: reqsCount + repairsCount + attendanceCount + fuelCount + salaryCount,
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
          { requiredFor: { notIn: ['REPAIR_MAINTENANCE', 'DRIVER_ATTENDANCE', 'SALARY_ADVANCE', 'VEHICLE_FUEL'] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        createdBy: { select: { fullName: true } }
      }
    });
  }

  async getRecentRepairs(organizationId: string, limit = 10) {
    const orgId = BigInt(organizationId);
    return await prisma.requisition.findMany({
      where: {
        organizationId: orgId,
        requiredFor: 'REPAIR_MAINTENANCE',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        createdBy: { select: { fullName: true } }
      }
    });
  }

  async getRecentOtherActivities(organizationId: string, limit = 20) {
    const orgId = BigInt(organizationId);
    return await prisma.requisition.findMany({
      where: {
        organizationId: orgId,
        requiredFor: { in: ['DRIVER_ATTENDANCE', 'SALARY_ADVANCE', 'VEHICLE_FUEL'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        createdBy: { select: { fullName: true } }
      }
    });
  }

  async getRecentNotifications(organizationId: string, limit = 10) {
    return [];
  }
}

import { RequisitionService } from '@/modules/requisitions/services/requisition.service';
import { RequisitionRepository } from '@/modules/requisitions/repository/requisition.repository';

jest.mock('@/modules/requisitions/repository/requisition.repository');

describe('RequisitionService', () => {
  let service: RequisitionService;
  let mockRepository: jest.Mocked<RequisitionRepository>;

  beforeEach(() => {
    mockRepository = new RequisitionRepository() as jest.Mocked<RequisitionRepository>;
    service = new RequisitionService();
    (service as any).repository = mockRepository;
  });

  describe('calculateStats', () => {
    it('should correctly count statuses', () => {
      const data = [
        { approvalStatus: 'PENDING' },
        { approvalStatus: 'APPROVED', paymentStatus: 'DONE' },
        { approvalStatus: 'APPROVED', paymentStatus: 'PENDING' },
      ];
      const stats = service.calculateStats(data);
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(2);
      expect(stats.toPay).toBe(1);
      expect(stats.total).toBe(3);
    });
  });

  describe('createRequisition', () => {
    it('should inject mandatory fields on creation', async () => {
      mockRepository.create.mockResolvedValue({ id: 'req_123' } as any);
      const res = await service.createRequisition({ item: 'test' }, 'u_1', 'o_1');
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        item: 'test',
        createdById: 'u_1',
        organizationId: 'o_1',
        status: 'SUBMITTED',
        approvalStatus: 'PENDING'
      });
      expect(res.id).toBe('req_123');
    });
  });
});

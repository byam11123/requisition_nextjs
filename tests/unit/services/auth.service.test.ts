import { AuthService } from '@/modules/auth/services/auth.service';
import { AuthRepository } from '@/modules/auth/repository/auth.repository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('@/modules/auth/repository/auth.repository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    mockRepository = new AuthRepository() as jest.Mocked<AuthRepository>;
    authService = new AuthService();
    (authService as any).repository = mockRepository;
  });

  describe('login', () => {
    it('should throw error if user not found', async () => {
      mockRepository.findUserByEmail.mockResolvedValue(null);
      await expect(authService.login('test@example.com', 'pwd')).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if password invalid', async () => {
      mockRepository.findUserByEmail.mockResolvedValue({ password_hash: 'hashed' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(authService.login('test@example.com', 'pwd')).rejects.toThrow('Invalid email or password');
    });

    it('should return token and user on success', async () => {
      const mockUser = { id: 1, email: 'test@example.com', password_hash: 'hashed', role: 'ADMIN', organization_id: 'org1' };
      mockRepository.findUserByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock_token');

      const result = await authService.login('test@example.com', 'pwd');
      expect(result.token).toBe('mock_token');
      expect(result.user.email).toBe('test@example.com');
    });
  });
});

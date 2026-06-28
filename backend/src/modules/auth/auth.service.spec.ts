import { UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthService } from './auth.service';
import { SecUser } from '../../entities/secuser.entity';
import { SecUserPropietario } from '../../entities/secuserpropietario.entity';
import { Propietario } from '../../entities/propietario.entity';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserPropRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const mockPropRepo = {
    findOne: jest.fn(),
    findBy: jest.fn(),
  };
  const mockUserRepo = {
    findOne: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('SIGNED_TOKEN'),
  };
  const mockDataSource = {} as DataSource;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      mockUserRepo as any,
      mockUserPropRepo as any,
      mockPropRepo as any,
      mockJwtService as any,
      mockDataSource,
    );
  });

  describe('selectAccount', () => {
    const dto = { propietarioId: 5 };

    it('throws Unauthorized when the user has no relation to the account', async () => {
      mockUserPropRepo.findOne.mockResolvedValue(null);

      await expect(service.selectAccount(1, dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('throws Unauthorized when the user record does not exist', async () => {
      mockUserPropRepo.findOne.mockResolvedValue({
        secUserId: 1,
        propietarioId: 5,
      });
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.selectAccount(1, dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('preserves isAdmin=true in the new JWT (bug fix: was dropped before)', async () => {
      mockUserPropRepo.findOne.mockResolvedValue({
        secUserId: 1,
        propietarioId: 5,
      });
      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        username: 'admin',
        isAdmin: true,
      });
      mockPropRepo.findOne.mockResolvedValue({ id: 5, nombre: 'NUNTIUS' });

      await service.selectAccount(1, dto);

      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
      const signedPayload = mockJwtService.sign.mock.calls[0][0];
      expect(signedPayload).toMatchObject({
        sub: 1,
        username: 'admin',
        propietarioId: 5,
        isAdmin: true,
      });
    });

    it('preserves isAdmin=false for regular users (triangulation, not hardcoded)', async () => {
      mockUserPropRepo.findOne.mockResolvedValue({
        secUserId: 7,
        propietarioId: 5,
      });
      mockUserRepo.findOne.mockResolvedValue({
        id: 7,
        username: 'pepe',
        isAdmin: false,
      });
      mockPropRepo.findOne.mockResolvedValue({ id: 5, nombre: 'NUNTIUS' });

      await service.selectAccount(7, dto);

      const signedPayload = mockJwtService.sign.mock.calls[0][0];
      expect(signedPayload.isAdmin).toBe(false);
      expect(signedPayload.username).toBe('pepe');
    });

    it('returns the signed token and the propietario', async () => {
      mockUserPropRepo.findOne.mockResolvedValue({
        secUserId: 1,
        propietarioId: 5,
      });
      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        username: 'admin',
        isAdmin: true,
      });
      const propietario = { id: 5, nombre: 'NUNTIUS' };
      mockPropRepo.findOne.mockResolvedValue(propietario);

      const result = await service.selectAccount(1, dto);

      expect(result).toEqual({ token: 'SIGNED_TOKEN', propietario });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { SubscribeDto } from './dto/subscribe.dto';

describe('PushController', () => {
  let controller: PushController;
  let pushService: { subscribe: jest.Mock; unsubscribe: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();

    pushService = {
      subscribe: jest.fn().mockResolvedValue(undefined),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushController],
      providers: [{ provide: PushService, useValue: pushService }],
    }).compile();

    controller = module.get<PushController>(PushController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ============================================
  // POST /subscribe
  // ============================================
  describe('subscribe', () => {
    const dto: SubscribeDto = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      keys: { p256dh: 'p256dh-value', auth: 'auth-value' },
      expirationTime: 1234567890,
    };

    it('delegates to service.subscribe with the tenantId from @TenantId (not the body)', async () => {
      await controller.subscribe(7, dto);

      // The controller must forward the JWT-derived tenantId, never a body field.
      expect(pushService.subscribe).toHaveBeenCalledWith(7, dto);
      expect(pushService.subscribe).toHaveBeenCalledTimes(1);
    });

    it('uses a different tenantId per request (tenant isolation)', async () => {
      await controller.subscribe(42, dto);

      expect(pushService.subscribe).toHaveBeenCalledWith(42, dto);
    });

    it('forwards the full DTO unchanged (endpoint + keys + expirationTime)', async () => {
      const minimalDto: SubscribeDto = {
        endpoint: 'https://example.com/push/xyz',
        keys: { p256dh: 'k1', auth: 'k2' },
      };

      await controller.subscribe(1, minimalDto);

      expect(pushService.subscribe).toHaveBeenCalledWith(1, minimalDto);
    });
  });

  // ============================================
  // DELETE /subscribe
  // ============================================
  describe('unsubscribe', () => {
    it('delegates to service.unsubscribe with tenantId + endpoint', async () => {
      const endpoint = 'https://fcm.googleapis.com/fcm/send/abc';

      await controller.unsubscribe(5, endpoint);

      expect(pushService.unsubscribe).toHaveBeenCalledWith(5, endpoint);
      expect(pushService.unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('scopes the deletion to the calling tenant', async () => {
      await controller.unsubscribe(99, 'https://example.com/ep');

      expect(pushService.unsubscribe).toHaveBeenCalledWith(99, 'https://example.com/ep');
    });
  });

  // ============================================
  // GET /vapid-public (PUBLIC — no auth)
  // ============================================
  describe('vapidPublic', () => {
    afterEach(() => {
      delete process.env.VAPID_PUBLIC_KEY;
    });

    it('returns the VAPID public key from the environment', () => {
      process.env.VAPID_PUBLIC_KEY = 'PUBLIC_KEY_ABC123';

      const result = controller.vapidPublic();

      expect(result).toEqual({ publicKey: 'PUBLIC_KEY_ABC123' });
    });

    it('returns whatever key is currently set (triangulation)', () => {
      process.env.VAPID_PUBLIC_KEY = 'DIFFERENT_KEY_XYZ';

      expect(controller.vapidPublic().publicKey).toBe('DIFFERENT_KEY_XYZ');
    });
  });
});

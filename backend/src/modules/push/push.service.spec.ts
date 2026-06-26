import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from '../../entities/push-subscription.entity';
import { MovimientosRecurrentesService } from '../movimientos-recurrentes/movimientos-recurrentes.service';
import { PushService } from './push.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { buildReminderPayload } from './push-payload';

jest.mock('web-push');

const sendNotificationMock = webpush.sendNotification as jest.MockedFunction<
  typeof webpush.sendNotification
>;
const setVapidDetailsMock = webpush.setVapidDetails as jest.MockedFunction<
  typeof webpush.setVapidDetails
>;

const VAPID_ENV = {
  VAPID_PUBLIC_KEY: 'PUBLIC_X',
  VAPID_PRIVATE_KEY: 'PRIVATE_Y',
  VAPID_SUBJECT: 'admin@example.com',
};

describe('PushService', () => {
  let service: PushService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
  };

  const mockMrService = {
    getPendientes: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    sendNotificationMock.mockResolvedValue({} as never);
    setVapidDetailsMock.mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: getRepositoryToken(PushSubscription), useValue: mockRepo },
        { provide: MovimientosRecurrentesService, useValue: mockMrService },
      ],
    }).compile();

    service = module.get<PushService>(PushService);
  });

  afterEach(() => {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // onModuleInit — VAPID fail-fast
  // ============================================
  describe('onModuleInit', () => {
    it('throws when VAPID_PUBLIC_KEY is missing', async () => {
      process.env.VAPID_PRIVATE_KEY = 'x';
      process.env.VAPID_SUBJECT = 'x';

      await expect(service.onModuleInit()).rejects.toThrow(/VAPID/i);
      expect(setVapidDetailsMock).not.toHaveBeenCalled();
    });

    it('throws when any VAPID_* env var is missing', async () => {
      process.env.VAPID_PUBLIC_KEY = 'x';
      process.env.VAPID_PRIVATE_KEY = 'x';
      // VAPID_SUBJECT intentionally missing

      await expect(service.onModuleInit()).rejects.toThrow(/VAPID/i);
    });

    it('calls setVapidDetails with mailto: subject when all vars present', async () => {
      Object.assign(process.env, VAPID_ENV);

      await service.onModuleInit();

      expect(setVapidDetailsMock).toHaveBeenCalledWith(
        'mailto:admin@example.com',
        'PUBLIC_X',
        'PRIVATE_Y',
      );
    });
  });

  // ============================================
  // subscribe — create + idempotent update
  // ============================================
  describe('subscribe', () => {
    const dto: SubscribeDto = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      keys: { p256dh: 'p256dh-1', auth: 'auth-1' },
      expirationTime: 999,
    };

    it('creates a new row when the endpoint is unknown', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const created: any = { id: 1, propietarioId: 7, ...dto.keys };
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockImplementation(async (e) => e);

      await service.subscribe(7, dto);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { propietarioId: 7, endpoint: dto.endpoint },
      });
      expect(mockRepo.create).toHaveBeenCalled();
      const saved = mockRepo.save.mock.calls[0][0];
      expect(saved.propietarioId).toBe(7);
      expect(saved.endpoint).toBe(dto.endpoint);
      expect(saved.keysP256dh).toBe('p256dh-1');
      expect(saved.keysAuth).toBe('auth-1');
      expect(saved.expirationTime).toBe(999);
    });

    it('updates keys on the existing row (idempotent — no new row) when the endpoint matches', async () => {
      const existing: any = {
        id: 42,
        propietarioId: 7,
        endpoint: dto.endpoint,
        keysP256dh: 'OLD-p256dh',
        keysAuth: 'OLD-auth',
        expirationTime: null,
      };
      mockRepo.findOne.mockResolvedValue(existing);
      mockRepo.save.mockImplementation(async (e) => e);

      const result = await service.subscribe(7, {
        endpoint: dto.endpoint,
        keys: { p256dh: 'NEW-p256dh', auth: 'NEW-auth' },
        expirationTime: 111,
      });

      // No new row created — repo.create must NOT be called.
      expect(mockRepo.create).not.toHaveBeenCalled();
      // The existing row is mutated and saved.
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(result.keysP256dh).toBe('NEW-p256dh');
      expect(result.keysAuth).toBe('NEW-auth');
      expect(result.expirationTime).toBe(111);
      expect(result.id).toBe(42); // same row, updated in place
    });
  });

  // ============================================
  // unsubscribe
  // ============================================
  describe('unsubscribe', () => {
    it('deletes by (tenantId, endpoint)', async () => {
      const endpoint = 'https://fcm.googleapis.com/fcm/send/abc';

      await service.unsubscribe(7, endpoint);

      expect(mockRepo.delete).toHaveBeenCalledWith({
        propietarioId: 7,
        endpoint,
      });
    });

    it('scopes deletion to the calling tenant only', async () => {
      await service.unsubscribe(99, 'https://example.com/ep');

      expect(mockRepo.delete).toHaveBeenCalledWith({
        propietarioId: 99,
        endpoint: 'https://example.com/ep',
      });
    });
  });

  // ============================================
  // sendDailyReminders — cron logic
  // ============================================
  describe('sendDailyReminders', () => {
    const makeSub = (id: number, propietarioId = 1): PushSubscription =>
      ({
        id,
        propietarioId,
        endpoint: `https://push/ep/${id}`,
        keysP256dh: `p256dh-${id}`,
        keysAuth: `auth-${id}`,
        expirationTime: null,
      }) as PushSubscription;

    it('sends nothing when there are 0 pending items (1 owner, 1 sub)', async () => {
      mockRepo.find.mockResolvedValue([makeSub(1)]);
      mockMrService.getPendientes.mockResolvedValue([]);

      await service.sendDailyReminders();

      expect(mockMrService.getPendientes).toHaveBeenCalledWith(1);
      expect(sendNotificationMock).not.toHaveBeenCalled();
    });

    it('sends 1 push when 5 pending + 1 subscription', async () => {
      mockRepo.find.mockResolvedValue([makeSub(1)]);
      mockMrService.getPendientes.mockResolvedValue([
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
      ]);

      await service.sendDailyReminders();

      expect(sendNotificationMock).toHaveBeenCalledTimes(1);
      const payloadArg = sendNotificationMock.mock.calls[0][1];
      expect(payloadArg).toContain('Tenés 5 recurrentes pendientes');
    });

    it('skips an owner that has pending items but 0 subscriptions', async () => {
      // Only owner 1 has a subscription; owner 2 has pendientes but no subs.
      mockRepo.find.mockResolvedValue([makeSub(1)]);
      mockMrService.getPendientes.mockResolvedValue([{ id: 1 }]);

      await service.sendDailyReminders();

      // getPendientes only called for owners that own a subscription.
      expect(mockMrService.getPendientes).toHaveBeenCalledTimes(1);
      expect(mockMrService.getPendientes).toHaveBeenCalledWith(1);
      expect(sendNotificationMock).toHaveBeenCalledTimes(1);
    });

    it('sends to all of an owner subscriptions (2 subs → 2 sends)', async () => {
      mockRepo.find.mockResolvedValue([makeSub(1), makeSub(2)]);
      mockMrService.getPendientes.mockResolvedValue([{ id: 1 }]);

      await service.sendDailyReminders();

      expect(sendNotificationMock).toHaveBeenCalledTimes(2);
    });

    it('prunes the subscription on 410 and still sends to the other device', async () => {
      const staleSub = makeSub(1);
      const liveSub = makeSub(2);
      mockRepo.find.mockResolvedValue([staleSub, liveSub]);
      mockMrService.getPendientes.mockResolvedValue([{ id: 1 }]);

      sendNotificationMock.mockRejectedValueOnce(
        Object.assign(new Error('gone'), { statusCode: 410 }),
      );

      await service.sendDailyReminders();

      // Both devices were attempted...
      expect(sendNotificationMock).toHaveBeenCalledTimes(2);
      // ...but only the stale one was pruned.
      expect(mockRepo.delete).toHaveBeenCalledTimes(1);
      expect(mockRepo.delete).toHaveBeenCalledWith(staleSub.id);
    });

    it('prunes the subscription on 404 as well', async () => {
      const staleSub = makeSub(1);
      mockRepo.find.mockResolvedValue([staleSub]);
      mockMrService.getPendientes.mockResolvedValue([{ id: 1 }]);
      sendNotificationMock.mockRejectedValueOnce(
        Object.assign(new Error('not found'), { statusCode: 404 }),
      );

      await service.sendDailyReminders();

      expect(mockRepo.delete).toHaveBeenCalledWith(staleSub.id);
    });
  });

  // ============================================
  // buildReminderPayload (pure function)
  // ============================================
  describe('buildReminderPayload', () => {
    it('builds a payload whose body states the exact pending count', () => {
      expect(buildReminderPayload(3)).toEqual({
        title: 'Wallet',
        body: 'Tenés 3 recurrentes pendientes',
        url: '/recurrentes',
      });
    });

    it('reflects a different count (triangulation)', () => {
      expect(buildReminderPayload(12).body).toBe('Tenés 12 recurrentes pendientes');
      expect(buildReminderPayload(1).url).toBe('/recurrentes');
    });
  });
});

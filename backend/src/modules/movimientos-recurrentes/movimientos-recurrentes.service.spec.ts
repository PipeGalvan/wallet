import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MovimientoRecurrente } from '../../entities/movimientorecurrente.entity';
import { MovimientosRecurrentesService } from './movimientos-recurrentes.service';
import { CreateMovimientoRecurrenteDto } from './dto/create-movimiento-recurrente.dto';
import { UpdateMovimientoRecurrenteDto } from './dto/update-movimiento-recurrente.dto';
import { IngresosService } from '../ingresos/ingresos.service';
import { EgresosService } from '../egresos/egresos.service';

describe('MovimientosRecurrentesService', () => {
  let service: MovimientosRecurrentesService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockIngresosService = {
    create: jest.fn(),
  };

  const mockEgresosService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovimientosRecurrentesService,
        {
          provide: getRepositoryToken(MovimientoRecurrente),
          useValue: mockRepo,
        },
        {
          provide: IngresosService,
          useValue: mockIngresosService,
        },
        {
          provide: EgresosService,
          useValue: mockEgresosService,
        },
      ],
    }).compile();

    service = module.get<MovimientosRecurrentesService>(MovimientosRecurrentesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns paginated list with data and pagination metadata', async () => {
      const mockData = [
        { id: 1, tipo: 'INGRESO', activo: true },
        { id: 2, tipo: 'EGRESO', activo: true },
      ];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockData, 2]),
      };
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(1, 1, 20, {});

      expect(result).toEqual({
        data: mockData,
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      });
      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('mr');
      expect(qb.where).toHaveBeenCalledWith('mr.propietarioId = :tenantId', { tenantId: 1 });
    });

    it('applies tipo filter when provided', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(1, 1, 20, { tipo: 'INGRESO' });

      expect(qb.andWhere).toHaveBeenCalledWith('mr.tipo = :tipo', { tipo: 'INGRESO' });
    });

    it('applies activo filter when provided', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(1, 1, 20, { activo: 'true' });

      expect(qb.andWhere).toHaveBeenCalledWith('mr.activo = :activo', { activo: true });
    });
  });

  describe('findOne', () => {
    it('returns a single template with relations', async () => {
      const mockTemplate = { id: 1, tipo: 'INGRESO', propietarioId: 1, caja: { id: 1 } };
      mockRepo.findOne.mockResolvedValue(mockTemplate);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockTemplate);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, propietarioId: 1 },
        relations: ['caja', 'moneda', 'cliente', 'propietario'],
      });
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a template with correct defaults and calculates fechaProxima', async () => {
      const dto: CreateMovimientoRecurrenteDto = {
        tipo: 'INGRESO',
        tipoMovimientoId: 1,
        monedaId: 1,
        montoEstimado: 50000,
        cajaId: 1,
        frecuencia: 'mensual',
        diaDelMes: 15,
        fechaInicio: '2026-05-15',
      };

      const created = { id: 1, ...dto, activo: true, pausado: false, ocurrenciasConfirmadas: 0, propietarioId: 1 };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create(1, dto);

      expect(result).toEqual(created);
      // Verify defaults set on the entity
      const saved = mockRepo.save.mock.calls[0][0];
      expect(saved.activo).toBe(true);
      expect(saved.pausado).toBe(false);
      expect(saved.ocurrenciasConfirmadas).toBe(0);
      expect(saved.propietarioId).toBe(1);
    });

    it('sets fechaProxima to fechaInicio when fechaInicio is in the future', async () => {
      const dto: CreateMovimientoRecurrenteDto = {
        tipo: 'EGRESO',
        tipoMovimientoId: 2,
        monedaId: 1,
        montoEstimado: 30000,
        cajaId: 1,
        frecuencia: 'mensual',
        diaDelMes: 20,
        fechaInicio: '2026-06-20',
      };

      const created = { id: 2, ...dto, propietarioId: 1 };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      await service.create(1, dto);

      const saved = mockRepo.save.mock.calls[0][0];
      expect(saved.fechaProxima).toBeDefined();
      expect(saved.fechaProxima).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('updates template fields and returns updated entity', async () => {
      const existing = { id: 1, tipo: 'INGRESO', propietarioId: 1, montoEstimado: 50000, diaDelMes: 15 };
      mockRepo.findOne.mockResolvedValue(existing);
      mockRepo.save.mockImplementation(async (entity) => entity);

      const dto: UpdateMovimientoRecurrenteDto = { montoEstimado: 60000 };
      const result = await service.update(1, 1, dto);

      expect(result.montoEstimado).toBe(60000);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when template not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update(1, 999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft deletes by setting activo=false', async () => {
      const existing = { id: 1, tipo: 'INGRESO', propietarioId: 1, activo: true };
      mockRepo.findOne.mockResolvedValue(existing);
      mockRepo.save.mockImplementation(async (entity) => entity);

      const result = await service.remove(1, 1);

      expect(result.activo).toBe(false);
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ activo: false }));
    });

    it('throws NotFoundException when template not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('pause', () => {
    it('sets pausado=true on the template', async () => {
      const existing = { id: 1, tipo: 'INGRESO', propietarioId: 1, pausado: false };
      mockRepo.findOne.mockResolvedValue(existing);
      mockRepo.save.mockImplementation(async (entity) => entity);

      const result = await service.pause(1, 1);

      expect(result.pausado).toBe(true);
    });
  });

  describe('resume', () => {
    it('sets pausado=false and recalculates fechaProxima', async () => {
      const existing = { id: 1, tipo: 'INGRESO', propietarioId: 1, pausado: true, diaDelMes: 15 };
      mockRepo.findOne.mockResolvedValue(existing);
      mockRepo.save.mockImplementation(async (entity) => entity);

      const result = await service.resume(1, 1);

      expect(result.pausado).toBe(false);
      expect(result.fechaProxima).toBeDefined();
    });
  });

  describe('calcularProximaFecha (pure function)', () => {
    it('returns correct date for day 15 in same month when day has not passed', () => {
      // April 10 + day 15 = April 15
      const result = service.calcularProximaFecha(15, new Date('2026-04-10'));
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(3); // April = 3
    });

    it('rolls to next month when day has passed', () => {
      // April 20 + day 15 = May 15
      const result = service.calcularProximaFecha(15, new Date('2026-04-20'));
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(4); // May = 4
    });

    it('clamps day 31 to last day of 30-day month', () => {
      // April has 30 days — day 31 → April 30
      const result = service.calcularProximaFecha(31, new Date('2026-04-01'));
      expect(result.getDate()).toBe(30);
      expect(result.getMonth()).toBe(3); // April
    });

    it('clamps day 31 to 28 in February (non-leap)', () => {
      // Jan 31 + day 31 → day not < 31, so next month → Feb 2027 has 28 days
      const result = service.calcularProximaFecha(31, new Date('2027-01-31'));
      expect(result.getDate()).toBe(28);
      expect(result.getMonth()).toBe(1); // February
    });

    it('clamps day 31 to 29 in February (leap year)', () => {
      // Jan 31 + day 31 → day not < 31, so next month → Feb 2028 has 29 days
      const result = service.calcularProximaFecha(31, new Date('2028-01-31'));
      expect(result.getDate()).toBe(29);
      expect(result.getMonth()).toBe(1); // February
    });
  });

  // ============================================
  // NEW TESTS: Task 3.2 — getPendientes
  // ============================================
  describe('getPendientes', () => {
    it('queries templates with correct filters: activo, pausado, fechaProxima, ocurrencias', async () => {
      const mockData = [
        { id: 1, tipo: 'INGRESO', activo: true, pausado: false, fechaProxima: new Date('2026-04-10') },
      ];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockData),
      };
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getPendientes(1);

      expect(result).toEqual(mockData);
      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('mr');
      expect(qb.where).toHaveBeenCalledWith('mr.propietarioId = :tenantId', { tenantId: 1 });
      expect(qb.andWhere).toHaveBeenCalledWith('mr.activo = :activo', { activo: true });
      expect(qb.andWhere).toHaveBeenCalledWith('mr.pausado = :pausado', { pausado: false });
      // Check that ocurrencias filter is applied
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(mr.ocurrenciasTotales IS NULL OR mr.ocurrenciasConfirmadas < mr.ocurrenciasTotales)',
      );
      expect(qb.orderBy).toHaveBeenCalledWith('mr.fechaProxima', 'ASC');
    });

    it('returns empty array when no pending items exist', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getPendientes(1);

      expect(result).toEqual([]);
    });

    it('includes caja and moneda relations', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getPendientes(1);

      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('mr.caja', 'caja');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('mr.moneda', 'moneda');
    });
  });

  // ============================================
  // NEW TESTS: Task 3.3 — confirmar (single)
  // ============================================
  describe('confirmar', () => {
    const baseTemplate = {
      id: 1,
      tipo: 'INGRESO',
      tipoMovimientoId: 10,
      propietarioId: 1,
      activo: true,
      pausado: false,
      diaDelMes: 15,
      monedaId: 1,
      cajaId: 1,
      clienteId: null,
      observacion: 'Test recurrente',
      ocurrenciasConfirmadas: 0,
      ocurrenciasTotales: null,
      fechaProxima: new Date('2026-04-15'),
      montoEstimado: 50000,
    };

    it('throws NotFoundException when template does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.confirmar(1, 999, { importe: 50000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when template is inactive', async () => {
      mockRepo.findOne.mockResolvedValue({ ...baseTemplate, activo: false });

      await expect(
        service.confirmar(1, 1, { importe: 50000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when template is paused', async () => {
      mockRepo.findOne.mockResolvedValue({ ...baseTemplate, pausado: true });

      await expect(
        service.confirmar(1, 1, { importe: 50000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when fechaProxima is in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      futureDate.setHours(0, 0, 0, 0);
      mockRepo.findOne.mockResolvedValue({ ...baseTemplate, fechaProxima: futureDate });

      await expect(
        service.confirmar(1, 1, { importe: 50000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when fechaProxima is null', async () => {
      mockRepo.findOne.mockResolvedValue({ ...baseTemplate, fechaProxima: null });

      await expect(
        service.confirmar(1, 1, { importe: 50000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('delegates to ingresosService.create for INGRESO tipo', async () => {
      const pastDate = new Date('2026-04-10');
      const template = { ...baseTemplate, fechaProxima: pastDate };
      mockRepo.findOne.mockResolvedValue(template);
      mockRepo.save.mockImplementation(async (e) => e);
      mockIngresosService.create.mockResolvedValue({ id: 100, importe: 50000 });

      const result = await service.confirmar(1, 1, { importe: 55000 });

      expect(mockIngresosService.create).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          tipoIngresoId: 10,
          importe: 55000,
          monedaId: 1,
          cajaId: 1,
          movimientoRecurrenteId: 1,
        }),
      );
      expect(result.movement).toEqual({ id: 100, importe: 50000 });
    });

    it('delegates to egresosService.create for EGRESO tipo', async () => {
      const pastDate = new Date('2026-04-10');
      const template = {
        ...baseTemplate,
        tipo: 'EGRESO',
        fechaProxima: pastDate,
      };
      mockRepo.findOne.mockResolvedValue(template);
      mockRepo.save.mockImplementation(async (e) => e);
      mockEgresosService.create.mockResolvedValue({ id: 200, importe: 30000 });

      const result = await service.confirmar(1, 1, { importe: 30000 });

      expect(mockEgresosService.create).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          tipoEgresoId: 10,
          importe: 30000,
          monedaId: 1,
          cajaId: 1,
          movimientoRecurrenteId: 1,
        }),
      );
      expect(result.movement).toEqual({ id: 200, importe: 30000 });
    });

    it('passes clienteId for INGRESO tipo when set on template', async () => {
      const pastDate = new Date('2026-04-10');
      const template = { ...baseTemplate, fechaProxima: pastDate, clienteId: 5 };
      mockRepo.findOne.mockResolvedValue(template);
      mockRepo.save.mockImplementation(async (e) => e);
      mockIngresosService.create.mockResolvedValue({ id: 100 });

      await service.confirmar(1, 1, { importe: 50000 });

      expect(mockIngresosService.create).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          clienteId: 5,
        }),
      );
    });

    it('increments ocurrenciasConfirmadas and recalculates fechaProxima', async () => {
      const pastDate = new Date('2026-04-10');
      const template = { ...baseTemplate, fechaProxima: pastDate, ocurrenciasConfirmadas: 2 };
      mockRepo.findOne.mockResolvedValue(template);
      mockRepo.save.mockImplementation(async (e) => e);
      mockIngresosService.create.mockResolvedValue({ id: 100 });

      const result = await service.confirmar(1, 1, { importe: 50000 });

      expect(result.template.ocurrenciasConfirmadas).toBe(3);
      expect(result.template.fechaProxima).toBeDefined();
      expect(result.template.activo).toBe(true);
    });

    it('sets activo=false and fechaProxima=null when occurrences are exhausted', async () => {
      const pastDate = new Date('2026-04-10');
      const template = {
        ...baseTemplate,
        fechaProxima: pastDate,
        ocurrenciasConfirmadas: 2,
        ocurrenciasTotales: 3,
      };
      mockRepo.findOne.mockResolvedValue(template);
      mockRepo.save.mockImplementation(async (e) => e);
      mockIngresosService.create.mockResolvedValue({ id: 100 });

      const result = await service.confirmar(1, 1, { importe: 50000 });

      expect(result.template.ocurrenciasConfirmadas).toBe(3);
      expect(result.template.activo).toBe(false);
      expect(result.template.fechaProxima).toBeNull();
    });

    it('uses dto.observacion when provided, falls back to template.observacion', async () => {
      const pastDate = new Date('2026-04-10');
      const template = { ...baseTemplate, fechaProxima: pastDate, observacion: 'Template obs' };
      mockRepo.findOne.mockResolvedValue(template);
      mockRepo.save.mockImplementation(async (e) => e);
      mockIngresosService.create.mockResolvedValue({ id: 100 });

      await service.confirmar(1, 1, { importe: 50000, observacion: 'Custom obs' });

      expect(mockIngresosService.create).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ observacion: 'Custom obs' }),
      );
    });

    it('uses dto.fecha when provided, defaults to today', async () => {
      const pastDate = new Date('2026-04-10');
      const template = { ...baseTemplate, fechaProxima: pastDate };
      mockRepo.findOne.mockResolvedValue(template);
      mockRepo.save.mockImplementation(async (e) => e);
      mockIngresosService.create.mockResolvedValue({ id: 100 });

      await service.confirmar(1, 1, { importe: 50000, fecha: '2026-04-15' });

      expect(mockIngresosService.create).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ fecha: '2026-04-15' }),
      );
    });
  });

  // ============================================
  // NEW TESTS: Task 3.4 — confirmarLote (batch)
  // ============================================
  describe('confirmarLote', () => {
    const makeTemplate = (overrides = {}) => ({
      id: 1,
      tipo: 'INGRESO',
      tipoMovimientoId: 10,
      propietarioId: 1,
      activo: true,
      pausado: false,
      diaDelMes: 15,
      monedaId: 1,
      cajaId: 1,
      clienteId: null,
      observacion: 'Test',
      ocurrenciasConfirmadas: 0,
      ocurrenciasTotales: null,
      fechaProxima: new Date('2026-04-10'),
      montoEstimado: 50000,
      ...overrides,
    });

    it('confirms multiple items and returns results', async () => {
      const t1 = makeTemplate({ id: 1 });
      const t2 = makeTemplate({ id: 2, tipo: 'EGRESO' });

      mockRepo.findOne
        .mockResolvedValueOnce(t1)
        .mockResolvedValueOnce(t2);
      mockRepo.save.mockImplementation(async (e) => e);
      mockIngresosService.create.mockResolvedValue({ id: 100 });
      mockEgresosService.create.mockResolvedValue({ id: 200 });

      const items = [
        { id: 1, importe: 50000 },
        { id: 2, importe: 30000 },
      ];

      const results = await service.confirmarLote(1, items);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].movement).toEqual({ id: 100 });
      expect(results[1].success).toBe(true);
      expect(results[1].movement).toEqual({ id: 200 });
    });

    it('continues with other items when one fails (partial success)', async () => {
      const t1 = makeTemplate({ id: 1 });
      const t2 = makeTemplate({ id: 2 });

      mockRepo.findOne
        .mockResolvedValueOnce(null) // First not found
        .mockResolvedValueOnce(t2);
      mockRepo.save.mockImplementation(async (e) => e);
      mockIngresosService.create.mockResolvedValue({ id: 200 });

      const items = [
        { id: 1, importe: 50000 },
        { id: 2, importe: 30000 },
      ];

      const results = await service.confirmarLote(1, items);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
      expect(results[1].success).toBe(true);
      expect(results[1].movement).toEqual({ id: 200 });
    });

    it('returns all failed when all items fail', async () => {
      mockRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const items = [
        { id: 1, importe: 50000 },
        { id: 2, importe: 30000 },
      ];

      const results = await service.confirmarLote(1, items);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success === false)).toBe(true);
    });

    it('returns empty array for empty items list', async () => {
      const results = await service.confirmarLote(1, []);
      expect(results).toEqual([]);
    });

    it('passes observacion and fecha from items through to confirmar', async () => {
      const t1 = makeTemplate({ id: 1 });
      mockRepo.findOne.mockResolvedValue(t1);
      mockRepo.save.mockImplementation(async (e) => e);
      mockIngresosService.create.mockResolvedValue({ id: 100 });

      const items = [
        { id: 1, importe: 50000, observacion: 'Batch obs', fecha: '2026-04-15' },
      ];

      await service.confirmarLote(1, items);

      expect(mockIngresosService.create).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          observacion: 'Batch obs',
          fecha: '2026-04-15',
        }),
      );
    });
  });
});

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SecUser } from '../../entities/secuser.entity';
import { SecUserPropietario } from '../../entities/secuserpropietario.entity';
import { Propietario } from '../../entities/propietario.entity';
import { Caja } from '../../entities/caja.entity';
import { TipoIngreso } from '../../entities/tipoingreso.entity';
import { TipoEgreso } from '../../entities/tipoegreso.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SelectAccountDto } from './dto/select-account.dto';
import { JwtPayload } from '../../common/types';
import { verifyEncrypt64 } from '../../common/utils/encrypt64';

const SEED_TIPOS_INGRESO = ['Sueldo', 'Venta', 'Otro'];
const SEED_TIPOS_EGRESO = ['Alquiler', 'Comida', 'Transporte', 'Otro'];
const SEED_TIPOS_ESPECIALES_INGRESO = [
  { nombre: 'Transferencia', esTransferencia: true },
  { nombre: 'Cambio', esCambio: true },
];
const SEED_TIPOS_ESPECIALES_EGRESO = [
  { nombre: 'Transferencia', esTransferencia: true },
  { nombre: 'Cambio', esCambio: true },
];

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SecUser)
    private userRepo: Repository<SecUser>,
    @InjectRepository(SecUserPropietario)
    private userPropRepo: Repository<SecUserPropietario>,
    @InjectRepository(Propietario)
    private propRepo: Repository<Propietario>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const { valid, isLegacy } = await this.validatePassword(
      dto.password,
      user.password,
      user.key ?? undefined,
    );
    if (!valid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (isLegacy) {
      await this.migratePasswordToBcrypt(user.id, dto.password);
    }

    const propietarios = await this.userPropRepo.find({
      where: { secUserId: user.id },
    });

    const propietarioIds = propietarios.map((p) => p.propietarioId);
    const cuentas = await this.propRepo.findBy({ id: In(propietarioIds) });

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    };

    return {
      token: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, isAdmin: user.isAdmin },
      cuentas,
    };
  }

  async selectAccount(userId: number, dto: SelectAccountDto) {
    const relation = await this.userPropRepo.findOne({
      where: { secUserId: userId, propietarioId: dto.propietarioId },
    });

    if (!relation) {
      throw new UnauthorizedException('No tiene acceso a esta cuenta');
    }

    const propietario = await this.propRepo.findOne({
      where: { id: dto.propietarioId },
    });

    const payload: JwtPayload = {
      sub: userId,
      username: '',
      propietarioId: dto.propietarioId,
    };

    return {
      token: this.jwtService.sign(payload),
      propietario,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('El nombre de usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const propietario = await this.dataSource.transaction(async (manager) => {
      // 1. SecUser
      const user = manager.create(SecUser, {
        username: dto.username,
        password: hashedPassword,
        isAdmin: false,
      });
      await manager.save(user);

      // 2. Propietario
      const prop = manager.create(Propietario, {
        nombre: dto.username,
      });
      await manager.save(prop);

      // 3. SecUserPropietario (vinculo)
      const link = manager.create(SecUserPropietario, {
        secUserId: user.id,
        propietarioId: prop.id,
      });
      await manager.save(link);

      // 4. Caja default
      const caja = manager.create(Caja, {
        nombre: 'Caja Principal',
        activo: true,
        propietarioId: prop.id,
        fecha: new Date(),
      });
      await manager.save(caja);

      // 5. TiposIngreso básicos
      for (const nombre of SEED_TIPOS_INGRESO) {
        const tipo = manager.create(TipoIngreso, {
          nombre,
          activo: true,
          propietarioId: prop.id,
          esTransferencia: false,
          esCambio: false,
        });
        await manager.save(tipo);
      }

      // 6. TiposEgreso básicos
      for (const nombre of SEED_TIPOS_EGRESO) {
        const tipo = manager.create(TipoEgreso, {
          nombre,
          activo: true,
          propietarioId: prop.id,
          esTransferencia: false,
          esCambio: false,
        });
        await manager.save(tipo);
      }

      // 7. TiposIngreso especiales (Transferencia, Cambio)
      for (const seed of SEED_TIPOS_ESPECIALES_INGRESO) {
        const tipo = manager.create(TipoIngreso, {
          nombre: seed.nombre,
          activo: true,
          propietarioId: prop.id,
          esTransferencia: seed.esTransferencia || false,
          esCambio: seed.esCambio || false,
        });
        await manager.save(tipo);
      }

      // 8. TiposEgreso especiales (Transferencia, Cambio)
      for (const seed of SEED_TIPOS_ESPECIALES_EGRESO) {
        const tipo = manager.create(TipoEgreso, {
          nombre: seed.nombre,
          activo: true,
          propietarioId: prop.id,
          esTransferencia: seed.esTransferencia || false,
          esCambio: seed.esCambio || false,
        });
        await manager.save(tipo);
      }

      return { user, prop };
    });

    // 7. Generar JWT y devolver formato login
    const payload: JwtPayload = {
      sub: propietario.user.id,
      username: propietario.user.username,
      isAdmin: false,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: propietario.user.id,
        username: propietario.user.username,
        isAdmin: false,
      },
      cuentas: [{ id: propietario.prop.id, nombre: propietario.prop.nombre }],
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const propietarios = await this.userPropRepo.find({
      where: { secUserId: user.id },
    });
    const propietarioIds = propietarios.map((p) => p.propietarioId);
    const cuentas = await this.propRepo.findBy({ id: In(propietarioIds) });

    return {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      cuentas,
    };
  }

  private async validatePassword(
    plain: string,
    hashed: string,
    key?: string,
  ): Promise<{ valid: boolean; isLegacy: boolean }> {
    if (await bcrypt.compare(plain, hashed)) {
      return { valid: true, isLegacy: false };
    }

    if (key) {
      if (verifyEncrypt64(plain, key, hashed)) {
        return { valid: true, isLegacy: true };
      }
    }

    try {
      const legacyDecoded = Buffer.from(hashed, 'base64').toString('utf8');
      if (legacyDecoded === plain) {
        return { valid: true, isLegacy: true };
      }
    } catch {
      // ignore
    }

    return { valid: false, isLegacy: false };
  }

  private async migratePasswordToBcrypt(
    userId: number,
    plainPassword: string,
  ): Promise<void> {
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    await this.userRepo.update(userId, {
      password: hashedPassword,
      key: undefined,
    });
  }
}

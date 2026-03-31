import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SecUser } from '../../entities/secuser.entity';
import { SecUserPropietario } from '../../entities/secuserpropietario.entity';
import { Propietario } from '../../entities/propietario.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SelectAccountDto } from './dto/select-account.dto';
import { JwtPayload } from '../../common/types';
import { verifyEncrypt64 } from '../../common/utils/encrypt64';

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
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      username: dto.username,
      password: hashedPassword,
      isAdmin: false,
    });
    await this.userRepo.save(user);
    return { id: user.id, username: user.username };
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

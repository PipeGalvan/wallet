import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecUser } from '../../entities/secuser.entity';
import { SecRole } from '../../entities/secrole.entity';
import { SecUserPropietario } from '../../entities/secuserpropietario.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(SecUser)
    private userRepo: Repository<SecUser>,
    @InjectRepository(SecRole)
    private roleRepo: Repository<SecRole>,
    @InjectRepository(SecUserPropietario)
    private userPropRepo: Repository<SecUserPropietario>,
  ) {}

  async findUsers() {
    return this.userRepo.find({ order: { id: 'ASC' } });
  }

  async createUser(username: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = this.userRepo.create({ username, password: hashedPassword, isAdmin: false });
    return this.userRepo.save(user);
  }

  async updateUser(id: number, username?: string, password?: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;
    if (username) user.username = username;
    if (password) user.password = await bcrypt.hash(password, 12);
    return this.userRepo.save(user);
  }

  async asociarTenant(userId: number, propietarioId: number) {
    const existing = await this.userPropRepo.findOne({
      where: { secUserId: userId, propietarioId },
    });
    if (existing) return existing;
    const relation = this.userPropRepo.create({ secUserId: userId, propietarioId });
    return this.userPropRepo.save(relation);
  }

  async findRoles() {
    return this.roleRepo.find({ order: { id: 'ASC' } });
  }
}

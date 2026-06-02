import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async updateProfile(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    await this.userRepo.update(id, data);
    return this.findById(id) as Promise<UserEntity>;
  }

  async setPasswordResetToken(id: string, token: string, expires: Date): Promise<void> {
    await this.userRepo.update(id, { passwordResetToken: token, passwordResetExpires: expires });
  }

  async findByResetToken(token: string): Promise<UserEntity | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .addSelect('user.passwordResetExpires')
      .where('user.passwordResetToken = :token', { token })
      .getOne();
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepo.update(id, { password: hashedPassword, passwordResetToken: null, passwordResetExpires: null });
  }
}

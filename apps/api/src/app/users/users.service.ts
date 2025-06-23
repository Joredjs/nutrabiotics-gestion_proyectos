import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { IUserRepository } from '../common/interfaces/user-repository.interface';
import { REPOSITORY_TOKENS } from '../repositories/repository.tokens';
import {
  CreateUserDto,
  UpdateUserDto,
  UserRole,
  PaginationQuery,
} from '@nutrabiotics-system/shared-types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @Inject(REPOSITORY_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository
  ) {
    console.log('UsersService inicializado');
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findByEmail(
      createUserDto.email
    );
    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario con este correo electrónico'
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    return this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  async findAll(
    query: PaginationQuery & { role?: UserRole; isActive?: boolean }
  ) {
    return this.userRepository.findAll(query);
  }

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findDevelopers(query: PaginationQuery) {
    return this.userRepository.findDevelopers(query);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findById(id);

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const userWithEmail = await this.userRepository.findByEmail(
        updateUserDto.email
      );
      if (userWithEmail) {
        throw new ConflictException(
          'Un usuario con este correo electrónico ya existe'
        );
      }
    }

    return this.userRepository.update(id, updateUserDto);
  }

  async updateLastLogin(id: string) {
    return this.userRepository.updateLastLogin(id);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.userRepository.delete(id);
  }

  async deactivate(id: string) {
    return this.userRepository.deactivate(id);
  }

  async activate(id: string) {
    return this.userRepository.activate(id);
  }

  async getUserStats(id: string) {
    const user = await this.findById(id);
    const stats = await this.userRepository.getUserStats(id);

    return {
      user,
      ...stats,
    };
  }
}

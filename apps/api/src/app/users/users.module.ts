import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from '../db/db.module';
import { UserRepository } from '../repositories/user.repository';
import { REPOSITORY_TOKENS } from '../repositories/repository.tokens';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [
    {
      provide: REPOSITORY_TOKENS.USER_REPOSITORY,
      useClass: UserRepository,
    },
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {
  constructor() {
    console.log('UsersModule inicializado');
  }
}

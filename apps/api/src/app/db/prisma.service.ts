import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conectado a la base de datos');
    this.logger.log(`DB URL: ${process.env.DATABASE_URL}`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Desconectado de la base de datos');
  }

  async cleanDb() {
    if (process.env.NODE_ENV === 'production') return;

    const models = Reflect.ownKeys(this)
      .filter((key) => typeof key === 'string' && key[0] !== '_');

    return Promise.all(
      models.map((modelKey) => (this as unknown)[modelKey].deleteMany())
    );
  }
}

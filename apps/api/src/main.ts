import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './app/common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Prefijo global para las rutas de la API
  const globalPrefix = 'api';
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:4200'),
    credentials: true,
  });

  // Filtro global de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  // Pipe de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false, 
      },
    })
  );

  // Se crea la documentación Swagger solo en desarrollo
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('API Gestión de Proyectos - Nutrabiotics')
      .setDescription('API para la gestión de proyectos, tareas y usuarios')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Autenticación', 'Endpoints de autenticación y autorización')
      .addTag('Users', 'Gestión de usuarios')
      .addTag('Proyectos', 'Gestión de proyectos')
      .addTag('Tasks', 'Gestión de tareas')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get('PORT', 3333);
  await app.listen(port);

  logger.log(
    `🚀 La aplicación se está ejecutando en: http://localhost:${port}/${globalPrefix}`
  );
  logger.log(
    `📚 La documentació está en: http://localhost:${port}/${globalPrefix}/docs`
  );
}

bootstrap().catch(error => {
  console.error('error al iniciar la aplicación:', error);
  process.exit(1);
});

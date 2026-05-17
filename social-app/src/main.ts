import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './exceptions/all-exceptions.filter';
import { CustomLoggerService } from './services/logging/custom-logger.service';
import { SocialAppModule } from './socialapp.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
  const exceptionsLogger = new CustomLoggerService('social-app-backend', AllExceptionsFilter.name);
  const customLogger = new CustomLoggerService('social-app-backend', 'console-log');
  const app = await NestFactory.create(SocialAppModule, {
    logger: customLogger
  });
  const configService: ConfigService = app.get<ConfigService>(ConfigService);

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter(exceptionsLogger, configService));
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  const allowedOrigins = configService.get<string>('CORS_ORIGIN_REGEXP')?.split(',') || [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) 
      // or check if the origin is in our whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true, // Crucial for JWT cookies or sessions
    exposedHeaders: ['Content-Disposition'], // For file downloads
    maxAge: 600, // Preflight caching (10 mins) to reduce OPTIONS requests
  });

  const globalPrefix = configService.get<string>('API_GLOBAL_PREFIX');
  if (globalPrefix) {
    app.setGlobalPrefix(globalPrefix);
  }

  const options = new DocumentBuilder()
    .setTitle('Social App')
    .setDescription('Micro service responsible for handling business logic for social-app.')
    .setVersion('1.0')
    .addTag('Social App Backend')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(8000);
}
bootstrap();

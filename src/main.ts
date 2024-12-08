import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

/**
 * Starts the application.
 */
async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global pipes
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    // Global interceptors
    app.useGlobalInterceptors(new TransformInterceptor(), new ErrorInterceptor());

    // Security
    app.use(helmet());
    app.use(compression());
    app.enableCors();

    // Swagger setup
    const config = new DocumentBuilder()
        .setTitle('Smart Home API')
        .setDescription('The Smart Home API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config,{
        
    });

    SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    const PORT = process.env.PORT || 3000;

    await app.listen(PORT, '0.0.0.0');
    console.log(`Application is running on: http://localhost:${PORT}`);
}

bootstrap();

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
    app.use(helmet({
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
        contentSecurityPolicy: false,
        hsts: false,
        xssFilter: false
    }));
    app.use(compression());
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: '*',
        credentials: true,
    });

    // Swagger setup
    const config = new DocumentBuilder()
        .setTitle('Smart Home API')
        .setDescription('The Smart Home API description')
        .setVersion('1.0')
        .addBearerAuth()
        .addServer(`http://localhost:${process.env.PORT || 3000}`)
        .build();

    const document = SwaggerModule.createDocument(app, config);

    // Get all network interfaces for adding to Swagger
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    // Add all network interface URLs to Swagger servers
    if (document.servers === undefined) {
        document.servers = [];
    }
    
    Object.keys(networkInterfaces).forEach((interfaceName) => {
        networkInterfaces[interfaceName]?.forEach((netInterface) => {
            if (netInterface.family === 'IPv4' && !netInterface.internal) {
                document.servers.push({
                    url: `http://${netInterface.address}:${process.env.PORT || 3000}`,
                    description: `Network Interface: ${interfaceName}`
                });
            }
        });
    });

    SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tryItOutEnabled: true,
            displayRequestDuration: true,
            filter: true,
            syntaxHighlight: {
                theme: 'monokai'
            }
        },
        customSiteTitle: 'Smart Home API Documentation'
    });

    const PORT = process.env.PORT || 3000;

    await app.listen(PORT, '0.0.0.0');
    
    console.log(`Application is running on:`);
    console.log(`- Local: http://localhost:${PORT}`);
    
    // Log all available network interfaces
    Object.keys(networkInterfaces).forEach((interfaceName) => {
        networkInterfaces[interfaceName]?.forEach((netInterface) => {
            if (netInterface.family === 'IPv4' && !netInterface.internal) {
                console.log(`- Network: http://${netInterface.address}:${PORT}`);
            }
        });
    });
}

bootstrap();

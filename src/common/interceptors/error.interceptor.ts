import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    InternalServerErrorException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError((err) => {
                if (err instanceof HttpException) {
                    return throwError(() => err);
                }

                // Log the error here if needed
                console.error('Unexpected error:', err);

                return throwError(
                    () =>
                        new InternalServerErrorException({
                            statusCode: 500,
                            message: 'Internal server error',
                            timestamp: new Date().toISOString(),
                            ...(process.env.NODE_ENV !== 'production' && {
                                stack: err.stack,
                            }),
                        }),
                );
            }),
        );
    }
}

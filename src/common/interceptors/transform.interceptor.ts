import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IResponseFormat<T> {
    statusCode: number;
    message: string;
    data: T;
    timestamp: string;
    path: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, IResponseFormat<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<IResponseFormat<T>> {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<ExpressResponse>();
        const request = ctx.getRequest();
        const statusCode = response.statusCode || HttpStatus.OK;

        return next.handle().pipe(
            map((data) => {
                return {
                    statusCode,
                    message: 'Success',
                    data,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                };
            }),
        );
    }
}

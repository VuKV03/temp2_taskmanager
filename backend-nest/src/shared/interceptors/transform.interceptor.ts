import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has success, meta, and message fields, it's already formatted
        if (data?.success !== undefined) {
          return data;
        }

        // Format paginated responses
        if (data?.meta && data?.meta?.page !== undefined) {
          return {
            success: true,
            data: data.data || [],
            meta: {
              page: data.meta.page,
              limit: data.meta.limit,
              total: data.meta.total,
              totalPages: data.meta.totalPages,
            },
          };
        }

        // Format single responses
        return {
          success: true,
          data: data || null,
        };
      }),
    );
  }
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from '../exceptions/app.exception.js';
import { ERROR_CODES } from '../constants/error-codes.constant.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error: any = {
      code: ERROR_CODES.SYS_001.code,
      message: ERROR_CODES.SYS_001.message,
      details: {},
    };

    if (exception instanceof AppException) {
      // Custom AppException
      status = exception.getStatus();
      const responseBody = exception.getResponse() as any;
      error = responseBody.error || error;
    } else if (exception instanceof HttpException) {
      // NestJS HttpException (validation, etc.)
      status = exception.getStatus();
      const responseBody = exception.getResponse() as any;

      if (status === HttpStatus.BAD_REQUEST && responseBody?.message?.length > 0) {
        // Validation error
        error = {
          code: ERROR_CODES.SYS_002.code,
          message: ERROR_CODES.SYS_002.message,
          details: this.parseValidationErrors(responseBody.message),
        };
      } else {
        error = {
          code: ERROR_CODES.SYS_001.code,
          message: responseBody?.message || ERROR_CODES.SYS_001.message,
          details: {},
        };
      }
    } else {
      // Unhandled exceptions
      this.logger.error('Unhandled exception:', exception);
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(status).json({
      success: false,
      error,
    });
  }

  private parseValidationErrors(messages: string | string[]): Record<string, string[]> {
    const details: Record<string, string[]> = {};

    if (Array.isArray(messages)) {
      messages.forEach((msg) => {
        const match = msg.match(/^(\w+)\s+(.+)$/);
        if (match) {
          const [, field, message] = match;
          if (!details[field]) {
            details[field] = [];
          }
          details[field].push(message);
        }
      });
    }

    return details;
  }
}

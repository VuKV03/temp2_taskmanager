import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  code: string;
  details?: Record<string, any>;

  constructor(
    errorInfo: { code: string; message: string; status: number },
    status?: HttpStatus,
    details?: Record<string, any>,
  ) {
    const httpStatus = status || errorInfo.status;
    super(
      {
        success: false,
        error: {
          code: errorInfo.code,
          message: errorInfo.message,
          details: details || {},
        },
      },
      httpStatus,
    );
    this.code = errorInfo.code;
    this.details = details;
  }
}

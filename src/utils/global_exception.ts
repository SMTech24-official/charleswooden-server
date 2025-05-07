import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { TokenExpiredError } from '@nestjs/jwt';
import { ValidationError } from 'class-validator';
import { ApiError } from './api_error';
import { IGenericErrorMessage } from 'src/error/error';
import { handleValidationError } from './validation_error';
import { handleClientError } from './client_error';
import { ConfigService } from '@nestjs/config';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong!';
    let errorMessages: IGenericErrorMessage[] = [];

    // Handle Prisma Validation Error
    if (exception instanceof Prisma.PrismaClientValidationError) {
      const simplifiedError = handleValidationError(exception);
      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
      errorMessages = simplifiedError.errorMessages;
    }

    // Handle DTO Validation Errors (class-validator)
    else if (exception instanceof BadRequestException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res['message']) {
        const validationErrors = res['message'];

        if (Array.isArray(validationErrors)) {
          errorMessages = validationErrors.map(
            (error: ValidationError | string) => {
              if (typeof error === 'string') {
                return { path: '', message: error };
              } else {
                return {
                  path: (error as ValidationError).property,
                  message: Object.values(
                    (error as ValidationError).constraints || {},
                  ).join(', '),
                };
              }
            },
          );
        } else {
          errorMessages = [
            {
              path: '',
              message: res['message'],
            },
          ];
        }
      }
      statusCode = exception.getStatus();
      message = 'Validation failed';
    }

    // Token Expired
    else if (exception instanceof TokenExpiredError) {
      statusCode = HttpStatus.UNAUTHORIZED;
      message = 'Your session has expired. Please log in again.';
      errorMessages = [
        {
          path: 'token',
          message: `Token expired at ${exception.expiredAt.toISOString()}`,
        },
      ];
    }

    // Prisma Known Errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const simplifiedError = handleClientError(exception);
      statusCode = simplifiedError.statusCode;
      message = simplifiedError.message;
      errorMessages = simplifiedError.errorMessages;
    }

    // Custom ApiError
    else if (exception instanceof ApiError) {
      statusCode = exception?.statusCode || HttpStatus.BAD_REQUEST;
      message = exception.message;
      errorMessages = [
        {
          path: '',
          message: exception.message,
        },
      ];
    }

    // Built-in HttpException
    else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res: any = exception.getResponse();
      message = res?.message || exception.message;
      errorMessages = res?.errorMessages || [
        {
          path: '',
          message: message,
        },
      ];
    }

    // Prisma Client Initialization Error
    else if (exception instanceof Prisma.PrismaClientInitializationError) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Failed to initialize Prisma Client.';
      errorMessages = [{ path: '', message: message }];
    }

    // Prisma Rust Panic
    else if (exception instanceof Prisma.PrismaClientRustPanicError) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Critical Prisma Engine error.';
      errorMessages = [{ path: '', message: message }];
    }

    // Prisma Unknown Error
    else if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown Prisma client error.';
      errorMessages = [{ path: '', message: message }];
    }

    // Other JS native errors
    else if (exception instanceof SyntaxError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Syntax error in the request.';
      errorMessages = [{ path: '', message: 'Syntax Error' }];
    } else if (exception instanceof TypeError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Type error in the application.';
      errorMessages = [{ path: '', message: 'Type Error' }];
    } else if (exception instanceof ReferenceError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Reference error in the application.';
      errorMessages = [{ path: '', message: 'Reference Error' }];
    }

    // Catch all fallback
    else {
      message = 'An unexpected error occurred!';
      errorMessages = [{ path: '', message: message }];
    }

    this.configService.get('NODE_ENV') !== 'production' &&
      console.log(errorMessages);
    response.status(statusCode).json({
      success: false,
      message,
      errorMessages,
      stack:
        this.configService.get('NODE_ENV') !== 'production'
          ? (exception as any)?.stack
          : undefined,
    });
  }
}

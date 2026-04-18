import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        code = (exceptionResponse as any).error || 'ERROR';
        if (Array.isArray(message)) {
          // Translate common class-validator English messages to Spanish
          message = (message as string[]).map((msg: string) => {
            if (msg.includes('must be a number')) return 'El campo debe ser un número válido';
            if (msg.includes('must be a string')) return 'El campo debe ser texto';
            if (msg.includes('must not be empty') || msg.includes('should not be empty')) return 'El campo es obligatorio';
            if (msg.includes('must be a valid date') || msg.includes('must be a Date instance')) return 'La fecha no es válida';
            if (msg.includes('must be an email')) return 'El email no es válido';
            if (msg.includes('must be longer than')) return 'El texto es demasiado corto';
            if (msg.includes('must be shorter than')) return 'El texto es demasiado largo';
            if (msg.includes('conforming to the specified constraints')) return 'El valor no es válido';
            if (msg.includes('should not be null')) return 'El campo es obligatorio';
            if (msg.includes('must be a positive number')) return 'Debe ser un número positivo';
            return msg;
          }).join('. ');
        }
      } else {
        message = exception.message;
      }
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    response.status(status).json({
      success: false,
      error: { code, message, details: [] },
    });
  }
}

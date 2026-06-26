import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';

const SENSITIVE_FIELDS = ['password', 'fcmToken', 'bankCode', 'bankAccountNumber', 'bankAccountName', 'emailVerificationToken', 'deletedAt'];

function stripSensitive(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripSensitive);

  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.includes(key)) continue;
    if (value && typeof value === 'object' && !Array.isArray(value) && value instanceof Date === false) {
      cleaned[key] = stripSensitive(value);
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(stripSensitive);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(data => stripSensitive(data)));
  }
}

import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Push subscription keys as delivered by the PushSubscription API.
 */
export class SubscriptionKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  auth: string;
}

/**
 * Body for POST /api/v1/push/subscribe.
 *
 * NOTE: propietarioId is intentionally absent. It is taken from the JWT via
 * @TenantId(). The global ValidationPipe (forbidNonWhitelisted: true) rejects
 * any propietarioId sent in the body.
 */
export class SubscribeDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @IsObject()
  @ValidateNested()
  @Type(() => SubscriptionKeysDto)
  keys: SubscriptionKeysDto;

  @IsOptional()
  @IsNumber()
  expirationTime?: number;
}

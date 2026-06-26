import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A Web Push subscription, keyed by propietarioId (tenant).
 *
 * UNIQUE(propietario_id, endpoint) enforces idempotent re-subscription: a
 * second subscribe with the same endpoint updates the keys instead of
 * duplicating the row. One propietario may own multiple subscriptions
 * (one per device).
 */
@Entity('push_subscription')
export class PushSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'propietario_id' })
  propietarioId: number;

  @Column({ length: 500 })
  endpoint: string;

  @Column({ name: 'keys_p256dh', length: 255 })
  keysP256dh: string;

  @Column({ name: 'keys_auth', length: 255 })
  keysAuth: string;

  @Column({ name: 'expiration_time', type: 'bigint', nullable: true })
  expirationTime: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

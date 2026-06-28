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
 * UNIQUE(PropietarioId, Endpoint) enforces idempotent re-subscription: a
 * second subscribe with the same endpoint updates the keys instead of
 * duplicating the row. One propietario may own multiple subscriptions
 * (one per device).
 *
 * Column names follow the project's PascalCase convention (legacy GeneXus
 * schema: PropietarioId, EgresoId, etc.). PropietarioId is typed smallint
 * to match the referenced PK in `propietario`.
 */
@Entity('push_subscription')
export class PushSubscription {
  @PrimaryGeneratedColumn({ name: 'PushSubscriptionId' })
  id: number;

  @Column({ name: 'PropietarioId', type: 'smallint' })
  propietarioId: number;

  @Column({ name: 'Endpoint', length: 500 })
  endpoint: string;

  @Column({ name: 'KeysP256dh', length: 255 })
  keysP256dh: string;

  @Column({ name: 'KeysAuth', length: 255 })
  keysAuth: string;

  @Column({ name: 'ExpirationTime', type: 'bigint', nullable: true })
  expirationTime: number | null;

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UpdatedAt' })
  updatedAt: Date;
}

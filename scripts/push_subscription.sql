-- Push subscriptions for Web Push notifications.
-- Run manually against the target database (no TypeORM migrations in this project).
--
-- Column naming follows the project's PascalCase convention (legacy GeneXus schema):
-- PropietarioId, EgresoId, SecUserId, etc. all use PascalCase. PropietarioId is
-- SMALLINT to match the referenced PK in `propietario` (MySQL rejects FKs with
-- mismatched types).
--
-- Usage:
--   mysql -u <user> -p <database> < scripts/push_subscription.sql
--
-- Rollback:
--   DROP TABLE IF EXISTS push_subscription;

CREATE TABLE IF NOT EXISTS push_subscription (
  PushSubscriptionId INT AUTO_INCREMENT PRIMARY KEY,
  PropietarioId      SMALLINT NOT NULL,
  Endpoint           VARCHAR(500) NOT NULL,
  KeysP256dh         VARCHAR(255) NOT NULL,
  KeysAuth           VARCHAR(255) NOT NULL,
  ExpirationTime     BIGINT NULL,
  CreatedAt          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_push_sub_owner_endpoint UNIQUE (PropietarioId, Endpoint),
  CONSTRAINT fk_push_sub_propietario FOREIGN KEY (PropietarioId)
    REFERENCES propietario (PropietarioId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_push_sub_propietario ON push_subscription(PropietarioId);

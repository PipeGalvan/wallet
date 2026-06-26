-- Push subscriptions for Web Push notifications.
-- Run manually against the target database (no TypeORM migrations in this project).
--
-- Usage:
--   mysql -u <user> -p <database> < scripts/push_subscription.sql
--
-- Rollback:
--   DROP TABLE IF EXISTS push_subscription;

CREATE TABLE IF NOT EXISTS push_subscription (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  propietario_id  INT NOT NULL,
  endpoint        VARCHAR(500) NOT NULL,
  keys_p256dh     VARCHAR(255) NOT NULL,
  keys_auth       VARCHAR(255) NOT NULL,
  expiration_time BIGINT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_push_sub_owner_endpoint UNIQUE (propietario_id, endpoint),
  CONSTRAINT fk_push_sub_propietario FOREIGN KEY (propietario_id)
    REFERENCES propietario (PropietarioId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_push_sub_propietario ON push_subscription(propietario_id);

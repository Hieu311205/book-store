UPDATE orders
SET status = 'delivered'
WHERE status = 'paid';

ALTER TABLE orders
  MODIFY status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending';

SET @shipping_provider_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'shipping_provider'
);
SET @shipping_provider_sql = IF(
  @shipping_provider_exists = 0,
  'ALTER TABLE orders ADD COLUMN shipping_provider VARCHAR(50) NULL AFTER shipping_method',
  'SELECT 1'
);
PREPARE shipping_provider_stmt FROM @shipping_provider_sql;
EXECUTE shipping_provider_stmt;
DEALLOCATE PREPARE shipping_provider_stmt;

CREATE TABLE IF NOT EXISTS return_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  type ENUM('return', 'exchange') NOT NULL DEFAULT 'return',
  reason VARCHAR(255) NOT NULL,
  note TEXT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  admin_note TEXT NULL,
  processed_by INT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_return_requests_order (order_id),
  INDEX idx_return_requests_user (user_id),
  INDEX idx_return_requests_status (status),
  CONSTRAINT fk_return_requests_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_return_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_return_requests_processed_by FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

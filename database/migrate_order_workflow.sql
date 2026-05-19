--1
UPDATE orders
SET status = 'delivered'
WHERE status = 'paid';

ALTER TABLE orders
  MODIFY status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending';

ALTER TABLE orders
  MODIFY payment_method ENUM('cod', 'bank_transfer', 'card', 'wallet') DEFAULT 'cod';

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

CREATE TABLE IF NOT EXISTS wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  balance DECIMAL(12,0) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wallet_user (user_id),
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_bank_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  bank_account_number VARCHAR(50) NOT NULL,
  bank_account_name VARCHAR(100) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_bank_accounts_user (user_id),
  CONSTRAINT fk_user_bank_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wallet_id INT NOT NULL,
  user_id INT NOT NULL,
  type ENUM('credit', 'debit') NOT NULL,
  amount DECIMAL(12,0) NOT NULL,
  status ENUM('pending', 'completed', 'rejected') NOT NULL DEFAULT 'completed',
  description VARCHAR(255) NULL,
  reference_type VARCHAR(50) NULL,
  reference_id INT NULL,
  bank_name VARCHAR(100) NULL,
  bank_account_number VARCHAR(50) NULL,
  bank_account_name VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wallet_transactions_wallet (wallet_id),
  INDEX idx_wallet_transactions_user (user_id),
  INDEX idx_wallet_transactions_reference (reference_type, reference_id),
  CONSTRAINT fk_wallet_transactions_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  CONSTRAINT fk_wallet_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

--2
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

  CONSTRAINT fk_return_requests_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,

  CONSTRAINT fk_return_requests_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT fk_return_requests_processed_by
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

--3
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

  CONSTRAINT fk_return_requests_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,

  CONSTRAINT fk_return_requests_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT fk_return_requests_processed_by
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

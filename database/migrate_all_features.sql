-- Migration tong hop cho cac tinh nang da bo sung
-- Chay file nay sau schema_mysql.sql. Co the chay lai nhieu lan.
-- Neu bang, cot, index hoac foreign key da ton tai thi se bo qua.

DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_missing$$
CREATE PROCEDURE add_column_if_missing(
  IN p_table_name VARCHAR(64),
  IN p_column_name VARCHAR(64),
  IN alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_column_name
  ) THEN
    SET @migration_sql = alter_sql;
    PREPARE migration_stmt FROM @migration_sql;
    EXECUTE migration_stmt;
    DEALLOCATE PREPARE migration_stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS add_index_if_missing$$
CREATE PROCEDURE add_index_if_missing(
  IN p_table_name VARCHAR(64),
  IN p_index_name VARCHAR(64),
  IN alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND INDEX_NAME = p_index_name
  ) THEN
    SET @migration_sql = alter_sql;
    PREPARE migration_stmt FROM @migration_sql;
    EXECUTE migration_stmt;
    DEALLOCATE PREPARE migration_stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS add_constraint_if_missing$$
CREATE PROCEDURE add_constraint_if_missing(
  IN p_table_name VARCHAR(64),
  IN p_constraint_name VARCHAR(64),
  IN alter_sql TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND CONSTRAINT_NAME = p_constraint_name
  ) THEN
    SET @migration_sql = alter_sql;
    PREPARE migration_stmt FROM @migration_sql;
    EXECUTE migration_stmt;
    DEALLOCATE PREPARE migration_stmt;
  END IF;
END$$

DELIMITER ;

-- 1. Role admin nghiep vu va danh muc 3 tang mau
ALTER TABLE users
  MODIFY role ENUM('customer', 'admin', 'super_admin', 'warehouse_staff', 'content_editor') DEFAULT 'customer';

CALL add_column_if_missing(
  'users',
  'locked_at',
  'ALTER TABLE users ADD COLUMN locked_at DATETIME NULL AFTER is_active'
);

UPDATE users
SET locked_at = COALESCE(locked_at, updated_at, created_at)
WHERE is_active = 0
  AND locked_at IS NULL;

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Văn học Việt Nam', 'Vietnamese Literature', 'van-hoc-viet-nam', 'Nhánh văn học Việt Nam trong Tiểu thuyết', 10, 1
FROM categories c
WHERE c.slug = 'tieu-thuyet'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'van-hoc-viet-nam');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Truyện dài', 'Long-form Fiction', 'truyen-dai', 'Danh mục cấp 3 cho truyện dài', 10, 1
FROM categories c
WHERE c.slug = 'van-hoc-viet-nam'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'truyen-dai');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Kỹ năng nghề nghiệp', 'Career Skills', 'ky-nang-nghe-nghiep', 'Nhánh kỹ năng nghề nghiệp', 10, 1
FROM categories c
WHERE c.slug = 'ky-nang-song'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'ky-nang-nghe-nghiep');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Giao tiếp', 'Communication', 'giao-tiep', 'Danh mục cấp 3 cho sách giao tiếp', 10, 1
FROM categories c
WHERE c.slug = 'ky-nang-nghe-nghiep'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'giao-tiep');

-- 2. Cau hinh ngan hang cua shop
INSERT INTO settings (key_name, value, type, group_name) VALUES
  ('bank_name',           'Vietcombank',  'string', 'payment'),
  ('bank_account_number', '1234567890',   'string', 'payment'),
  ('bank_account_name',   'NGUYEN VAN A', 'string', 'payment'),
  ('bank_qr_image',       '',             'string', 'payment')
ON DUPLICATE KEY UPDATE key_name = VALUES(key_name);

-- 2. Quy trinh don hang, doi tra va vi dien tu
UPDATE orders
SET status = 'delivered'
WHERE status = 'paid';

ALTER TABLE orders
  MODIFY status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  MODIFY payment_status ENUM('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded') DEFAULT 'pending',
  MODIFY payment_method ENUM('cod', 'bank_transfer', 'card', 'wallet') DEFAULT 'cod';

UPDATE orders
SET payment_status = 'cancelled'
WHERE status = 'cancelled'
  AND payment_status = 'pending';

CALL add_column_if_missing(
  'orders',
  'shipping_provider',
  'ALTER TABLE orders ADD COLUMN shipping_provider VARCHAR(50) NULL AFTER shipping_method'
);

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  balance DECIMAL(12,0) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wallet_user (user_id),
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Mo phong thanh toan va QR het han sau 15 phut
ALTER TABLE payments
  MODIFY gateway ENUM('cod', 'bank_transfer', 'card_test', 'wallet', 'zarinpal', 'stripe') NOT NULL,
  MODIFY currency VARCHAR(3) DEFAULT 'VND',
  MODIFY status ENUM('pending', 'success', 'paid', 'failed', 'expired', 'refunded') DEFAULT 'pending';

CALL add_column_if_missing(
  'payments',
  'expires_at',
  'ALTER TABLE payments ADD COLUMN expires_at DATETIME NULL AFTER status'
);
CALL add_column_if_missing(
  'payments',
  'updated_at',
  'ALTER TABLE payments ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER verified_at'
);
CALL add_index_if_missing(
  'payments',
  'idx_payments_status',
  'ALTER TABLE payments ADD INDEX idx_payments_status (status)'
);
CALL add_index_if_missing(
  'payments',
  'idx_payments_expires',
  'ALTER TABLE payments ADD INDEX idx_payments_expires (expires_at)'
);

UPDATE payments
SET status = 'paid'
WHERE status = 'success';

ALTER TABLE payments
  MODIFY status ENUM('pending', 'paid', 'failed', 'expired', 'refunded') DEFAULT 'pending';

UPDATE payments p
JOIN orders o ON o.id = p.order_id
SET p.expires_at = DATE_ADD(p.created_at, INTERVAL 15 MINUTE),
    p.status = 'pending',
    o.payment_status = 'pending'
WHERE p.gateway = 'bank_transfer'
  AND p.expires_at IS NOT NULL
  AND p.expires_at <= p.created_at
  AND p.status IN ('pending', 'expired')
  AND o.payment_status IN ('pending', 'expired');

UPDATE payments p
JOIN orders o ON o.id = p.order_id
SET p.status = CASE
      WHEN o.payment_status = 'cancelled' THEN 'failed'
      ELSE o.payment_status
    END,
    p.verified_at = CASE
      WHEN o.payment_status = 'paid' THEN COALESCE(p.verified_at, NOW())
      ELSE p.verified_at
    END
WHERE o.payment_status IN ('paid', 'failed', 'expired', 'cancelled', 'refunded');

UPDATE orders o
JOIN payments p ON p.order_id = o.id
SET o.status = 'cancelled',
    o.admin_note = CASE
      WHEN p.status = 'expired' THEN COALESCE(o.admin_note, 'Tu dong huy: QR thanh toan da het han')
      ELSE COALESCE(o.admin_note, 'Tu dong huy: thanh toan that bai')
    END,
    o.updated_at = NOW()
WHERE p.gateway = 'bank_transfer'
  AND p.status IN ('failed', 'expired')
  AND o.status NOT IN ('cancelled', 'refunded');

-- 4. Anh doc thu cua sach
CREATE TABLE IF NOT EXISTS product_preview_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  alt_text VARCHAR(255) NULL,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_preview_product (product_id),
  CONSTRAINT fk_product_preview_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Danh dau danh gia huu ich
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review_helpful_user (review_id, user_id),
  KEY idx_review_helpful_review (review_id),
  KEY idx_review_helpful_user (user_id),
  CONSTRAINT fk_review_helpful_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_helpful_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Moi lan mua hang duoc danh gia mot lan
CALL add_column_if_missing(
  'reviews',
  'order_id',
  'ALTER TABLE reviews ADD COLUMN order_id INT NULL AFTER product_id'
);
CALL add_index_if_missing(
  'reviews',
  'idx_reviews_order_product_user',
  'ALTER TABLE reviews ADD INDEX idx_reviews_order_product_user (order_id, product_id, user_id)'
);

UPDATE reviews r
SET order_id = (
  SELECT o.id
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.user_id = r.user_id
    AND oi.product_id = r.product_id
    AND o.status = 'delivered'
  ORDER BY COALESCE(o.delivered_at, o.updated_at, o.created_at) DESC, o.id DESC
  LIMIT 1
)
WHERE r.order_id IS NULL;

CALL add_constraint_if_missing(
  'reviews',
  'fk_reviews_order',
  'ALTER TABLE reviews ADD CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL'
);

-- 7. OTP xac nhan dang ky tai khoan
CREATE TABLE IF NOT EXISTS registration_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_registration_email (email),
  INDEX idx_registration_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. OTP dat lai mat khau
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(100) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_password_reset_user (user_id),
  INDEX idx_password_reset_email (email),
  INDEX idx_password_reset_expires (expires_at),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Quan ly tac gia, nha xuat ban va xuat/nhap kho
CALL add_column_if_missing(
  'authors',
  'country',
  'ALTER TABLE authors ADD COLUMN country VARCHAR(100) NULL AFTER image_url'
);
CALL add_column_if_missing(
  'authors',
  'is_active',
  'ALTER TABLE authors ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER country'
);
CALL add_column_if_missing(
  'authors',
  'updated_at',
  'ALTER TABLE authors ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
);

CALL add_column_if_missing(
  'publishers',
  'email',
  'ALTER TABLE publishers ADD COLUMN email VARCHAR(100) NULL AFTER website'
);
CALL add_column_if_missing(
  'publishers',
  'phone',
  'ALTER TABLE publishers ADD COLUMN phone VARCHAR(30) NULL AFTER email'
);
CALL add_column_if_missing(
  'publishers',
  'address',
  'ALTER TABLE publishers ADD COLUMN address VARCHAR(255) NULL AFTER phone'
);
CALL add_column_if_missing(
  'publishers',
  'contact_name',
  'ALTER TABLE publishers ADD COLUMN contact_name VARCHAR(100) NULL AFTER address'
);
CALL add_column_if_missing(
  'publishers',
  'is_active',
  'ALTER TABLE publishers ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER contact_name'
);
CALL add_column_if_missing(
  'publishers',
  'updated_at',
  'ALTER TABLE publishers ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type ENUM('import', 'export', 'adjustment') NOT NULL,
  quantity INT NOT NULL,
  before_stock INT NOT NULL DEFAULT 0,
  after_stock INT NOT NULL DEFAULT 0,
  unit_cost DECIMAL(12,0) NULL,
  reference_type VARCHAR(50) NULL,
  reference_id INT NULL,
  note VARCHAR(255) NULL,
  created_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_stock_movements_product (product_id),
  INDEX idx_stock_movements_type (type),
  INDEX idx_stock_movements_created_at (created_at),
  CONSTRAINT fk_stock_movements_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_movements_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS add_constraint_if_missing;
DROP PROCEDURE IF EXISTS add_index_if_missing;
DROP PROCEDURE IF EXISTS add_column_if_missing;

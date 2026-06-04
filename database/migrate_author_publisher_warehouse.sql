-- Them quan ly tac gia, nha xuat ban va xuat/nhap kho
-- Chay file nay mot lan. Co the chay lai, cot/bang da co se bo qua.

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

DELIMITER ;

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

DROP PROCEDURE IF EXISTS add_column_if_missing;

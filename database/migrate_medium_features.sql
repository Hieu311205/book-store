-- Migration: Tính năng mức trung bình
-- Chạy an toàn nhiều lần (idempotent)

-- ── 1. Wishlist: thêm cột notify_when_available nếu chưa có ─────────────────
-- MySQL 8.0 < 8.0.29 không hỗ trợ ADD COLUMN IF NOT EXISTS
-- Dùng stored procedure để kiểm tra trước
DROP PROCEDURE IF EXISTS add_notify_col;
DELIMITER //
CREATE PROCEDURE add_notify_col()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'wishlist'
      AND COLUMN_NAME  = 'notify_when_available'
  ) THEN
    ALTER TABLE `wishlist` ADD COLUMN `notify_when_available` tinyint(1) NOT NULL DEFAULT 0;
  END IF;
END //
DELIMITER ;
CALL add_notify_col();
DROP PROCEDURE IF EXISTS add_notify_col;

-- ── 2. Combo khuyến mãi ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `combos` (
  `id`             int unsigned  NOT NULL AUTO_INCREMENT,
  `name`           varchar(200)  NOT NULL,
  `description`    text,
  `discount_type`  enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` decimal(12,2)              NOT NULL DEFAULT 0,
  `is_active`      tinyint(1)                 NOT NULL DEFAULT 1,
  `created_at`     datetime                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `combo_items` (
  `id`         int unsigned NOT NULL AUTO_INCREMENT,
  `combo_id`   int unsigned NOT NULL,
  `product_id` int          NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_combo_item` (`combo_id`, `product_id`),
  KEY `fk_ci_combo`   (`combo_id`),
  KEY `fk_ci_product` (`product_id`),
  CONSTRAINT `fk_ci_combo`   FOREIGN KEY (`combo_id`)   REFERENCES `combos`   (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ci_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Lịch sử nhập hàng ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `stock_imports` (
  `id`          int          NOT NULL AUTO_INCREMENT,
  `product_id`  int          NOT NULL,
  `quantity`    int          NOT NULL,
  `note`        text,
  `imported_by` int          NOT NULL,
  `created_at`  datetime     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_si_product` (`product_id`),
  KEY `idx_si_user`    (`imported_by`),
  CONSTRAINT `fk_si_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_si_user`    FOREIGN KEY (`imported_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

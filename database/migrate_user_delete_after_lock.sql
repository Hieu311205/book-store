-- Them moc thoi gian khoa tai khoan de super admin chi xoa sau 90 ngay
-- Chay file nay mot lan. Neu cot da co thi se bo qua.

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
  'users',
  'locked_at',
  'ALTER TABLE users ADD COLUMN locked_at DATETIME NULL AFTER is_active'
);

UPDATE users
SET locked_at = COALESCE(locked_at, updated_at, created_at)
WHERE is_active = 0
  AND locked_at IS NULL;

DROP PROCEDURE IF EXISTS add_column_if_missing;

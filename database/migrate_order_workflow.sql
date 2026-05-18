UPDATE orders
SET status = 'delivered'
WHERE status = 'paid';

ALTER TABLE orders
  MODIFY status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_provider VARCHAR(50) NULL AFTER shipping_method;

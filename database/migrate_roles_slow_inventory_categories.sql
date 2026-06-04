-- Migration rieng cho:
-- 1. Role Nhan vien kho va Bien tap vien noi dung
-- 2. Danh muc 3 tang mau
-- 3. Canh bao slow-moving khong can them cot moi, duoc tinh bang truy van theo orders/order_items
--
-- Chay file nay mot lan sau schema_mysql.sql.
-- Co the chay lai nhieu lan: cac danh muc mau chi them neu slug chua ton tai.

ALTER TABLE users
  MODIFY role ENUM('customer', 'admin', 'super_admin', 'warehouse_staff', 'content_editor') DEFAULT 'customer';

-- Danh muc cap 2 nam duoi "tieu-thuyet"
INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Van hoc Viet Nam', 'Vietnamese Literature', 'van-hoc-viet-nam',
       'Nhanh van hoc Viet Nam trong Tieu thuyet', 10, 1
FROM categories c
WHERE c.slug = 'tieu-thuyet'
  AND NOT EXISTS (
    SELECT 1 FROM categories x WHERE x.slug = 'van-hoc-viet-nam'
  );

-- Danh muc cap 3 nam duoi "van-hoc-viet-nam"
INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Truyen dai', 'Long-form Fiction', 'truyen-dai',
       'Danh muc cap 3 cho truyen dai', 10, 1
FROM categories c
WHERE c.slug = 'van-hoc-viet-nam'
  AND NOT EXISTS (
    SELECT 1 FROM categories x WHERE x.slug = 'truyen-dai'
  );

-- Danh muc cap 2 nam duoi "ky-nang-song"
INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Ky nang nghe nghiep', 'Career Skills', 'ky-nang-nghe-nghiep',
       'Nhanh ky nang nghe nghiep', 10, 1
FROM categories c
WHERE c.slug = 'ky-nang-song'
  AND NOT EXISTS (
    SELECT 1 FROM categories x WHERE x.slug = 'ky-nang-nghe-nghiep'
  );

-- Danh muc cap 3 nam duoi "ky-nang-nghe-nghiep"
INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Giao tiep', 'Communication', 'giao-tiep',
       'Danh muc cap 3 cho sach giao tiep', 10, 1
FROM categories c
WHERE c.slug = 'ky-nang-nghe-nghiep'
  AND NOT EXISTS (
    SELECT 1 FROM categories x WHERE x.slug = 'giao-tiep'
  );

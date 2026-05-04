-- Test data for book management system
-- Run this after importing schema_mysql.sql

-- Test Authors
INSERT INTO authors (name, name_en, slug, bio, image_url) VALUES
('Nguyễn Nhật Ánh', 'Nhat Anh Nguyen', 'nguyen-nhat-anh', 'Tác giả nổi tiếng Việt Nam, viết nhiều tiểu thuyết thanh thiếu niên', NULL),
('Tạ Duy Anh', 'Duy Anh Ta', 'ta-duy-anh', 'Tiểu thuyết gia Việt Nam', NULL),
('Harper Lee', 'Harper Lee', 'harper-lee', 'Tác giả nổi tiếng người Mỹ', NULL),
('J.K. Rowling', 'J.K. Rowling', 'jk-rowling', 'Tác giả series Harry Potter', NULL),
('George R.R. Martin', 'George R.R. Martin', 'george-rr-martin', 'Tác giả series A Song of Ice and Fire', NULL);

-- Test Publishers
INSERT INTO publishers (name, name_en, slug, logo_url, website) VALUES
('NXB Trẻ', 'Young Publisher', 'nxb-tre', NULL, NULL),
('NXB Kim Đồng', 'Kim Dong Publisher', 'nxb-kim-dong', NULL, NULL),
('Penguin Books', 'Penguin Books', 'penguin-books', NULL, 'https://www.penguin.co.uk'),
('Scholastic', 'Scholastic', 'scholastic', NULL, 'https://www.scholastic.com'),
('HarperCollins', 'HarperCollins', 'harpercollins', NULL, 'https://www.harpercollins.com');

-- Test Categories
INSERT INTO categories (name, name_en, slug, description, sort_order, is_active) VALUES
('Văn học Việt Nam', 'Vietnamese Literature', 'van-hoc-viet-nam', 'Sách về văn học Việt Nam', 1, 1),
('Tiểu thuyết', 'Novel', 'tieu-thuyet', 'Sách tiểu thuyết', 2, 1),
('Trẻ em', 'Childrens', 'tre-em', 'Sách dành cho trẻ em', 3, 1),
('Khoa học', 'Science', 'khoa-hoc', 'Sách về khoa học', 4, 1),
('Tự giáo dục', 'Self Help', 'tu-giao-duc', 'Sách tự giáo dục', 5, 1),
('Tiểu thuyết nước ngoài', 'Foreign Novel', 'tieu-thuyet-nuoc-ngoai', 'Tiểu thuyết từ các tác giả nước ngoài', 6, 1);

-- Test Products (Books)
INSERT INTO products (ugid, category_id, author_id, publisher_id, title, title_en, slug, isbn, price, compare_price, discount_percent, stock, sku, is_active, is_featured) VALUES
('550e8400-e29b-41d4-a716-446655440000', 1, 1, 1, 'Chúc các bạn sẽ có một cuộc đời tươi đẹp', 'Beautiful Life', 'chuc-cac-ban-co-mot-cuoc-doi-tuoi-dep-001', '9786865911719', 89000, 129000, 31, 50, 'BOOK001', 1, 1),
('550e8400-e29b-41d4-a716-446655440001', 1, 1, 1, 'Khi bầu trời gặp gió', 'When Sky Meets Wind', 'khi-bau-troi-gap-gio-001', '9786865911682', 95000, 135000, 30, 45, 'BOOK002', 1, 0),
('550e8400-e29b-41d4-a716-446655440002', 3, 4, 4, 'Harry Potter và Hòn đá Phù thủy', 'Harry Potter and the Philosopher Stone', 'harry-potter-va-hon-da-phu-thuy-001', '9780747532699', 150000, 199000, 25, 100, 'BOOK003', 1, 1),
('550e8400-e29b-41d4-a716-446655440003', 2, 3, 3, 'To Kill a Mockingbird', 'To Kill a Mockingbird', 'to-kill-a-mockingbird-001', '9780061120084', 120000, 160000, 25, 30, 'BOOK004', 1, 0),
('550e8400-e29b-41d4-a716-446655440004', 2, 5, 5, 'A Game of Thrones', 'A Game of Thrones', 'a-game-of-thrones-001', '9780553103540', 200000, 280000, 29, 25, 'BOOK005', 1, 1);

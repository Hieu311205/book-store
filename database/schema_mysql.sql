CREATE DATABASE IF NOT EXISTS bookstore
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bookstore;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS sliders;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS coupon_usage;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS product_tags;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS publishers;
DROP TABLE IF EXISTS authors;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS user_addresses;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ugid VARCHAR(36) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  phone VARCHAR(20),
  avatar_url VARCHAR(255),
  role ENUM('customer', 'admin', 'super_admin') DEFAULT 'customer',
  is_active TINYINT(1) DEFAULT 1,
  email_verified TINYINT(1) DEFAULT 0,
  google_id VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(50),
  full_name VARCHAR(100),
  phone VARCHAR(20),
  province VARCHAR(50),
  city VARCHAR(50),
  postal_code VARCHAR(20),
  address TEXT,
  is_default TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NULL,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  image_url VARCHAR(255),
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE authors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  slug VARCHAR(100) UNIQUE,
  bio TEXT,
  image_url VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE publishers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  slug VARCHAR(100) UNIQUE,
  logo_url VARCHAR(255),
  website VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ugid VARCHAR(36) UNIQUE NOT NULL,
  category_id INT NULL,
  author_id INT NULL,
  publisher_id INT NULL,
  title VARCHAR(255) NOT NULL,
  title_en VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  isbn VARCHAR(20),
  pages INT,
  publish_year INT,
  language VARCHAR(20) DEFAULT 'English',
  translator VARCHAR(100),
  edition VARCHAR(20),
  format ENUM('hardcover', 'paperback', 'ebook') DEFAULT 'paperback',
  price DECIMAL(12, 0) NOT NULL,
  compare_price DECIMAL(12, 0),
  discount_percent INT DEFAULT 0,
  stock INT DEFAULT 0,
  sku VARCHAR(50) UNIQUE,
  weight INT,
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  is_featured TINYINT(1) DEFAULT 0,
  is_bestseller TINYINT(1) DEFAULT 0,
  views_count INT DEFAULT 0,
  sales_count INT DEFAULT 0,
  rating_avg DECIMAL(2,1) DEFAULT 0,
  rating_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_author FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_publisher FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  image_url VARCHAR(255),
  alt_text VARCHAR(100),
  sort_order INT DEFAULT 0,
  is_primary TINYINT(1) DEFAULT 0,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_tags (
  product_id INT NOT NULL,
  tag VARCHAR(50) NOT NULL,
  PRIMARY KEY (product_id, tag),
  CONSTRAINT fk_product_tags_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  session_id VARCHAR(100),
  product_id INT,
  quantity INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('percentage', 'fixed') NOT NULL,
  value DECIMAL(12, 2) NOT NULL,
  min_purchase DECIMAL(12, 0) DEFAULT 0,
  max_discount DECIMAL(12, 0),
  usage_limit INT,
  used_count INT DEFAULT 0,
  per_user_limit INT DEFAULT 1,
  start_date DATETIME NULL,
  end_date DATETIME NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO coupons (code, type, value, min_purchase, max_discount, usage_limit, used_count, per_user_limit, start_date, end_date, is_active) VALUES
('WELCOME10', 'percentage', 10, 100000, 30000, 200, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 1),
('BOOK15', 'percentage', 15, 200000, 50000, 150, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 1),
('NEWBOOK20', 'percentage', 20, 300000, 70000, 100, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 1),
('FREESHIP25', 'fixed', 25000, 150000, NULL, 300, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 120 DAY), 1),
('SAVE30K', 'fixed', 30000, 250000, NULL, 200, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 1),
('SAVE50K', 'fixed', 50000, 400000, NULL, 120, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 1),
('STUDENT12', 'percentage', 12, 120000, 40000, 180, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 120 DAY), 1),
('KIDBOOK10', 'percentage', 10, 100000, 35000, 160, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 1),
('COMBO18', 'percentage', 18, 350000, 80000, 100, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 75 DAY), 1),
('VIP100K', 'fixed', 100000, 800000, NULL, 50, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 1);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NULL,
  shipping_name VARCHAR(100),
  shipping_phone VARCHAR(20),
  shipping_province VARCHAR(50),
  shipping_city VARCHAR(50),
  shipping_postal_code VARCHAR(20),
  shipping_address TEXT,
  subtotal DECIMAL(12, 0) NOT NULL,
  shipping_cost DECIMAL(12, 0) DEFAULT 0,
  discount_amount DECIMAL(12, 0) DEFAULT 0,
  tax_amount DECIMAL(12, 0) DEFAULT 0,
  total_amount DECIMAL(12, 0) NOT NULL,
  coupon_id INT NULL,
  coupon_code VARCHAR(50),
  status ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  payment_method ENUM('cod', 'bank_transfer', 'card') DEFAULT 'cod',
  shipping_method VARCHAR(50),
  tracking_code VARCHAR(100),
  shipped_at DATETIME NULL,
  delivered_at DATETIME NULL,
  customer_note TEXT,
  admin_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT NULL,
  product_title VARCHAR(255),
  product_image VARCHAR(255),
  price DECIMAL(12, 0),
  quantity INT,
  total DECIMAL(12, 0),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  user_id INT NULL,
  gateway ENUM('zarinpal', 'stripe', 'bank_transfer') NOT NULL,
  amount DECIMAL(12, 0) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  authority VARCHAR(100),
  ref_id VARCHAR(100),
  transaction_id VARCHAR(100),
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  gateway_response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME NULL,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE coupon_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT,
  user_id INT NULL,
  order_id INT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_coupon_usage_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_usage_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_coupon_usage_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  user_id INT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(100),
  comment TEXT,
  pros TEXT,
  cons TEXT,
  is_verified_purchase TINYINT(1) DEFAULT 0,
  is_approved TINYINT(1) DEFAULT 0,
  helpful_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE,
  value TEXT,
  type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  group_name VARCHAR(50),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sliders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100),
  subtitle VARCHAR(200),
  image_url VARCHAR(255),
  link VARCHAR(255),
  button_text VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  start_date DATETIME NULL,
  end_date DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  subject VARCHAR(200),
  message TEXT,
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_author ON products(author_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_bestseller ON products(is_bestseller);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_session ON cart_items(session_id);

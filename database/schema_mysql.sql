-- --------------------------------------------------------
-- Máy chủ:                      127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Phiên bản:           12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for bookstore
CREATE DATABASE IF NOT EXISTS `bookstore` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `bookstore`;

-- Dumping structure for table bookstore.authors
CREATE TABLE IF NOT EXISTS `authors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.authors: ~3 rows (approximately)
INSERT INTO `authors` (`id`, `name`, `name_en`, `slug`, `bio`, `image_url`, `created_at`) VALUES
	(1, 'Nguyễn Nhật Ánh', NULL, 'nguyen-nhat-anh', NULL, NULL, '2026-04-29 21:32:23'),
	(2, 'Robert Kiyosaki', NULL, 'robert-kiyosaki', NULL, NULL, '2026-04-29 21:32:23'),
	(3, 'Dale Carnegie', NULL, 'dale-carnegie', NULL, NULL, '2026-04-29 21:32:23');

-- Dumping structure for table bookstore.cart_items
CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cart_items_product` (`product_id`),
  KEY `idx_cart_user` (`user_id`),
  KEY `idx_cart_session` (`session_id`),
  CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.cart_items: ~3 rows (approximately)
INSERT INTO `cart_items` (`id`, `user_id`, `session_id`, `product_id`, `quantity`, `created_at`) VALUES
	(5, 1, NULL, 38, 1, '2026-05-04 14:14:36');

-- Dumping structure for table bookstore.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `fk_categories_parent` (`parent_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.categories: ~5 rows (approximately)
INSERT INTO `categories` (`id`, `parent_id`, `name`, `name_en`, `slug`, `description`, `image_url`, `icon`, `sort_order`, `is_active`, `created_at`) VALUES
	(1, NULL, 'Tiểu thuyết', NULL, 'tieu-thuyet', NULL, NULL, NULL, 0, 1, '2026-04-29 21:32:03'),
	(2, NULL, 'Kinh tế', NULL, 'kinh-te', NULL, NULL, NULL, 0, 1, '2026-04-29 21:32:03'),
	(3, NULL, 'Kỹ năng sống', NULL, 'ky-nang-song', NULL, NULL, NULL, 0, 1, '2026-04-29 21:32:03'),
	(7, NULL, 'Khoa học', NULL, 'khoa-hoc', NULL, NULL, NULL, 0, 1, '2026-04-29 21:56:34'),
	(8, NULL, 'Thiếu nhi', NULL, 'thieu-nhi', NULL, NULL, NULL, 0, 1, '2026-04-29 21:56:34');

-- Dumping structure for table bookstore.contact_messages
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.contact_messages: ~0 rows (approximately)

-- Dumping structure for table bookstore.coupons
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('percentage','fixed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(12,2) NOT NULL,
  `min_purchase` decimal(12,0) DEFAULT '0',
  `max_discount` decimal(12,0) DEFAULT NULL,
  `usage_limit` int DEFAULT NULL,
  `used_count` int DEFAULT '0',
  `per_user_limit` int DEFAULT '1',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.coupons: ~11 rows (approximately)
INSERT INTO `coupons` (`id`, `code`, `type`, `value`, `min_purchase`, `max_discount`, `usage_limit`, `used_count`, `per_user_limit`, `start_date`, `end_date`, `is_active`, `created_at`) VALUES
	(1, '1234', 'percentage', 20.00, 0, 50000, 1, 1, 1, NULL, NULL, 1, '2026-05-11 14:14:05'),
	(2, 'WELCOME10', 'percentage', 10.00, 100000, 30000, 200, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 1, NOW()),
	(3, 'BOOK15', 'percentage', 15.00, 200000, 50000, 150, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 1, NOW()),
	(4, 'NEWBOOK20', 'percentage', 20.00, 300000, 70000, 100, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 1, NOW()),
	(5, 'FREESHIP25', 'fixed', 25000.00, 150000, NULL, 300, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 120 DAY), 1, NOW()),
	(6, 'SAVE30K', 'fixed', 30000.00, 250000, NULL, 200, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 1, NOW()),
	(7, 'SAVE50K', 'fixed', 50000.00, 400000, NULL, 120, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 1, NOW()),
	(8, 'STUDENT12', 'percentage', 12.00, 120000, 40000, 180, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 120 DAY), 1, NOW()),
	(9, 'KIDBOOK10', 'percentage', 10.00, 100000, 35000, 160, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 1, NOW()),
	(10, 'COMBO18', 'percentage', 18.00, 350000, 80000, 100, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 75 DAY), 1, NOW()),
	(11, 'VIP100K', 'fixed', 100000.00, 800000, NULL, 50, 0, 1, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 1, NOW());

-- Dumping structure for table bookstore.coupon_usage
CREATE TABLE IF NOT EXISTS `coupon_usage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `coupon_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `used_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_coupon_usage_coupon` (`coupon_id`),
  KEY `fk_coupon_usage_user` (`user_id`),
  KEY `fk_coupon_usage_order` (`order_id`),
  CONSTRAINT `fk_coupon_usage_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_coupon_usage_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `fk_coupon_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.coupon_usage: ~0 rows (approximately)
INSERT INTO `coupon_usage` (`id`, `coupon_id`, `user_id`, `order_id`, `used_at`) VALUES
	(1, 1, 2, 6, '2026-05-11 14:15:25');

-- Dumping structure for table bookstore.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `shipping_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_province` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` text COLLATE utf8mb4_unicode_ci,
  `subtotal` decimal(12,0) NOT NULL,
  `shipping_cost` decimal(12,0) DEFAULT '0',
  `discount_amount` decimal(12,0) DEFAULT '0',
  `tax_amount` decimal(12,0) DEFAULT '0',
  `total_amount` decimal(12,0) NOT NULL,
  `coupon_id` int DEFAULT NULL,
  `coupon_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','paid','processing','shipped','delivered','cancelled','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` enum('cod','bank_transfer','card') COLLATE utf8mb4_unicode_ci DEFAULT 'cod',
  `shipping_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tracking_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `customer_note` text COLLATE utf8mb4_unicode_ci,
  `admin_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `fk_orders_coupon` (`coupon_id`),
  KEY `idx_orders_user` (`user_id`),
  KEY `idx_orders_status` (`status`),
  CONSTRAINT `fk_orders_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.orders: ~2 rows (approximately)
INSERT INTO `orders` (`id`, `order_number`, `user_id`, `shipping_name`, `shipping_phone`, `shipping_province`, `shipping_city`, `shipping_postal_code`, `shipping_address`, `subtotal`, `shipping_cost`, `discount_amount`, `tax_amount`, `total_amount`, `coupon_id`, `coupon_code`, `status`, `payment_status`, `payment_method`, `shipping_method`, `tracking_code`, `shipped_at`, `delivered_at`, `customer_note`, `admin_note`, `created_at`, `updated_at`) VALUES
	(1, 'ORD001', 2, NULL, NULL, NULL, NULL, NULL, NULL, 210000, 0, 0, 0, 210000, NULL, NULL, 'paid', 'paid', 'cod', NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-29 21:33:01', '2026-05-11 02:25:50'),
	(2, 'ORD-77879862115', 2, 'Nguyen An', '0123456789', 'Ha Noi', 'Tu Liem', '046', 'MTA', 68985, 50000, 0, 0, 118985, NULL, NULL, 'paid', 'paid', 'cod', 'express', '', '2026-05-11 07:15:59', '2026-05-11 08:20:48', '', NULL, '2026-05-04 14:31:02', '2026-05-11 08:21:11'),
	(3, 'ORD-78472641597', 2, 'Nguyen An', '0123456789', 'Ha Noi', 'Tu Liem', '046', 'MTA', 90000, 25000, 0, 0, 115000, NULL, NULL, 'paid', 'paid', 'cod', 'standard', NULL, '2026-05-11 07:15:54', '2026-05-11 08:20:46', NULL, NULL, '2026-05-11 11:10:41', '2026-05-11 08:21:09'),
	(4, 'ORD-78473160414', 2, 'Nguyen An', '0123456789', 'Ha Noi', 'Tu Liem', '046', 'MTA', 120000, 25000, 0, 0, 145000, NULL, NULL, 'paid', 'paid', 'cod', 'standard', NULL, NULL, '2026-05-11 07:15:52', '', NULL, '2026-05-11 11:19:20', '2026-05-11 08:21:07'),
	(5, 'ORD-78483437136', 2, 'Nguyen An', '0123456789', 'Ha Noi', 'Tu Liem', '046', 'MTA', 110000, 25000, 0, 0, 135000, NULL, NULL, 'paid', 'paid', 'cod', 'standard', NULL, NULL, '2026-05-11 07:15:49', '', NULL, '2026-05-11 14:10:37', '2026-05-11 08:21:04'),
	(6, 'ORD-78483725261', 2, 'Nguyen An', '0123456789', 'Ha Noi', 'Tu Liem', '046', 'MTA', 210000, 25000, 42000, 0, 193000, 1, '1234', 'paid', 'paid', 'cod', 'standard', NULL, NULL, NULL, '', NULL, '2026-05-11 14:15:25', '2026-05-11 08:20:08'),
	(7, 'ORD-78484695406', 2, 'Nguyen An', '0123456789', 'Ha Noi', 'Tu Liem', '046', 'MTA', 120000, 25000, 0, 0, 145000, NULL, NULL, 'paid', 'paid', 'cod', 'standard', NULL, NULL, NULL, '', NULL, '2026-05-11 14:31:35', '2026-05-11 08:20:05');

-- Dumping structure for table bookstore.order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `product_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(12,0) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `total` decimal(12,0) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `fk_order_items_product` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.order_items: ~2 rows (approximately)
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_title`, `product_image`, `price`, `quantity`, `total`) VALUES
	(1, 1, 1, 'Cho tôi xin một vé đi tuổi thơ', NULL, 90000, 1, 90000),
	(2, 1, 2, 'Rich Dad Poor Dad', NULL, 120000, 1, 120000),
	(3, 2, 5, 'Kinh tế - Sách số 1', 'https://picsum.photos/200/300?random=5', 68985, 1, 68985),
	(4, 3, 1, 'Cho tôi xin một vé đi tuổi thơ', 'https://picsum.photos/200/300?1', 90000, 1, 90000),
	(5, 4, 41, 'Thiếu nhi - Cuốn 4', 'https://picsum.photos/200/300?random=41', 120000, 1, 120000),
	(6, 5, 40, 'Khoa học - Cuốn 3', 'https://picsum.photos/200/300?random=40', 110000, 1, 110000),
	(7, 6, 41, 'Thiếu nhi - Cuốn 4', 'https://picsum.photos/200/300?random=41', 120000, 1, 120000),
	(8, 6, 35, 'Thiếu nhi - Cuốn 1', 'https://picsum.photos/200/300?random=35', 90000, 1, 90000),
	(9, 7, 42, 'Khoa học - Cuốn 4', 'https://picsum.photos/200/300?random=42', 120000, 1, 120000);

-- Dumping structure for table bookstore.payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `gateway` enum('zarinpal','stripe','bank_transfer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,0) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `authority` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ref_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','success','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `gateway_response` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `verified_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_payments_order` (`order_id`),
  KEY `fk_payments_user` (`user_id`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.payments: ~0 rows (approximately)

-- Dumping structure for table bookstore.products
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ugid` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` int DEFAULT NULL,
  `author_id` int DEFAULT NULL,
  `publisher_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `short_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isbn` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pages` int DEFAULT NULL,
  `publish_year` int DEFAULT NULL,
  `language` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'English',
  `translator` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `edition` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `format` enum('hardcover','paperback','ebook') COLLATE utf8mb4_unicode_ci DEFAULT 'paperback',
  `price` decimal(12,0) NOT NULL,
  `compare_price` decimal(12,0) DEFAULT NULL,
  `discount_percent` int DEFAULT '0',
  `stock` int DEFAULT '0',
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weight` int DEFAULT NULL,
  `meta_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_bestseller` tinyint(1) DEFAULT '0',
  `views_count` int DEFAULT '0',
  `sales_count` int DEFAULT '0',
  `rating_avg` decimal(2,1) DEFAULT '0.0',
  `rating_count` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ugid` (`ugid`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `sku` (`sku`),
  KEY `fk_products_publisher` (`publisher_id`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_author` (`author_id`),
  KEY `idx_products_active` (`is_active`),
  KEY `idx_products_featured` (`is_featured`),
  KEY `idx_products_bestseller` (`is_bestseller`),
  CONSTRAINT `fk_products_author` FOREIGN KEY (`author_id`) REFERENCES `authors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_publisher` FOREIGN KEY (`publisher_id`) REFERENCES `publishers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.products: ~53 rows (approximately)
INSERT INTO `products` (`id`, `ugid`, `category_id`, `author_id`, `publisher_id`, `title`, `title_en`, `slug`, `description`, `short_description`, `isbn`, `pages`, `publish_year`, `language`, `translator`, `edition`, `format`, `price`, `compare_price`, `discount_percent`, `stock`, `sku`, `weight`, `meta_title`, `meta_description`, `is_active`, `is_featured`, `is_bestseller`, `views_count`, `sales_count`, `rating_avg`, `rating_count`, `created_at`, `updated_at`) VALUES
	(1, '49970fd2-43d8-11f1-bf47-0a0027000003', 1, 1, 1, 'Cho tôi xin một vé đi tuổi thơ', NULL, 've-di-tuoi-tho', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 90000, NULL, 0, 49, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 1, 0.0, 0, '2026-04-29 21:32:45', '2026-05-11 11:10:41'),
	(2, '49972d0b-43d8-11f1-bf47-0a0027000003', 2, 2, 3, 'Rich Dad Poor Dad', NULL, 'rich-dad-poor-dad', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 120000, NULL, 0, 40, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:32:45', '2026-04-29 21:32:45'),
	(3, '49973327-43d8-11f1-bf47-0a0027000003', 3, 3, 3, 'Đắc nhân tâm', NULL, 'dac-nhan-tam', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 100000, NULL, 0, 60, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:32:45', '2026-04-29 21:32:45'),
	(4, 'd6e89efa-43d9-11f1-bf47-0a0027000003', 3, 1, 3, 'Kỹ năng sống - Sách số 1', NULL, 'ky-nang-song-1', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 91930, NULL, 0, 72, NULL, NULL, NULL, NULL, 1, 0, 0, 1, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 23:09:19'),
	(5, 'd6e9570b-43d9-11f1-bf47-0a0027000003', 2, 2, 3, 'Kinh tế - Sách số 1', NULL, 'kinh-te-1', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 68985, NULL, 0, 57, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 1, 0.0, 0, '2026-04-29 21:43:51', '2026-05-04 14:31:02'),
	(6, 'd6e9652f-43d9-11f1-bf47-0a0027000003', 1, 3, 1, 'Tiểu thuyết - Sách số 1', NULL, 'tieu-thuyet-1', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 166475, NULL, 0, 29, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(7, 'd6e96d41-43d9-11f1-bf47-0a0027000003', 3, 2, 1, 'Kỹ năng sống - Sách số 2', NULL, 'ky-nang-song-2', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 183086, NULL, 0, 18, NULL, NULL, NULL, NULL, 1, 0, 1, 2, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 23:17:58'),
	(8, 'd6e9757b-43d9-11f1-bf47-0a0027000003', 2, 3, 2, 'Kinh tế - Sách số 2', NULL, 'kinh-te-2', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 52746, NULL, 0, 96, NULL, NULL, NULL, NULL, 1, 0, 1, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(9, 'd6e97eae-43d9-11f1-bf47-0a0027000003', 1, 2, 3, 'Tiểu thuyết - Sách số 2', NULL, 'tieu-thuyet-2', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 235948, NULL, 0, 38, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(10, 'd6e985a5-43d9-11f1-bf47-0a0027000003', 3, 2, 1, 'Kỹ năng sống - Sách số 3', NULL, 'ky-nang-song-3', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 83576, NULL, 0, 69, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(11, 'd6e98bf3-43d9-11f1-bf47-0a0027000003', 2, 1, 2, 'Kinh tế - Sách số 3', NULL, 'kinh-te-3', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 148368, NULL, 0, 104, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(12, 'd6e9933e-43d9-11f1-bf47-0a0027000003', 1, 1, 2, 'Tiểu thuyết - Sách số 3', NULL, 'tieu-thuyet-3', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 191219, NULL, 0, 84, NULL, NULL, NULL, NULL, 1, 0, 1, 1, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-05-07 07:58:34'),
	(13, 'd6e99ad6-43d9-11f1-bf47-0a0027000003', 3, 3, 1, 'Kỹ năng sống - Sách số 4', NULL, 'ky-nang-song-4', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 51200, NULL, 0, 62, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(14, 'd6e9a177-43d9-11f1-bf47-0a0027000003', 2, 1, 2, 'Kinh tế - Sách số 4', NULL, 'kinh-te-4', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 140076, NULL, 0, 25, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(15, 'd6e9a804-43d9-11f1-bf47-0a0027000003', 1, 2, 3, 'Tiểu thuyết - Sách số 4', NULL, 'tieu-thuyet-4', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 225217, NULL, 0, 91, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(16, 'd6e9ae44-43d9-11f1-bf47-0a0027000003', 3, 2, 2, 'Kỹ năng sống - Sách số 5', NULL, 'ky-nang-song-5', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 93167, NULL, 0, 80, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(17, 'd6e9b4ba-43d9-11f1-bf47-0a0027000003', 2, 1, 1, 'Kinh tế - Sách số 5', NULL, 'kinh-te-5', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 215926, NULL, 0, 12, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(18, 'd6e9bca7-43d9-11f1-bf47-0a0027000003', 1, 3, 2, 'Tiểu thuyết - Sách số 5', NULL, 'tieu-thuyet-5', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 109906, NULL, 0, 20, NULL, NULL, NULL, NULL, 1, 0, 1, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(19, 'd6e9c374-43d9-11f1-bf47-0a0027000003', 3, 3, 3, 'Kỹ năng sống - Sách số 6', NULL, 'ky-nang-song-6', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 192521, NULL, 0, 79, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(20, 'd6e9c9dd-43d9-11f1-bf47-0a0027000003', 2, 1, 3, 'Kinh tế - Sách số 6', NULL, 'kinh-te-6', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 241489, NULL, 0, 98, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(21, 'd6e9d198-43d9-11f1-bf47-0a0027000003', 1, 1, 2, 'Tiểu thuyết - Sách số 6', NULL, 'tieu-thuyet-6', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 67247, NULL, 0, 29, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(22, 'd6e9d8a4-43d9-11f1-bf47-0a0027000003', 3, 1, 1, 'Kỹ năng sống - Sách số 7', NULL, 'ky-nang-song-7', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 127972, NULL, 0, 42, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(23, 'd6e9df4d-43d9-11f1-bf47-0a0027000003', 2, 1, 2, 'Kinh tế - Sách số 7', NULL, 'kinh-te-7', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 142475, NULL, 0, 99, NULL, NULL, NULL, NULL, 1, 0, 1, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(24, 'd6e9e5ae-43d9-11f1-bf47-0a0027000003', 1, 1, 1, 'Tiểu thuyết - Sách số 7', NULL, 'tieu-thuyet-7', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 215965, NULL, 0, 85, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(25, 'd6e9f07d-43d9-11f1-bf47-0a0027000003', 3, 2, 2, 'Kỹ năng sống - Sách số 8', NULL, 'ky-nang-song-8', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 204428, NULL, 0, 66, NULL, NULL, NULL, NULL, 1, 0, 1, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(26, 'd6e9f7bd-43d9-11f1-bf47-0a0027000003', 2, 1, 2, 'Kinh tế - Sách số 8', NULL, 'kinh-te-8', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 52856, NULL, 0, 20, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(27, 'd6e9fef9-43d9-11f1-bf47-0a0027000003', 1, 3, 3, 'Tiểu thuyết - Sách số 8', NULL, 'tieu-thuyet-8', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 114836, NULL, 0, 23, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(28, 'd6ea06db-43d9-11f1-bf47-0a0027000003', 3, 3, 3, 'Kỹ năng sống - Sách số 9', NULL, 'ky-nang-song-9', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 169302, NULL, 0, 97, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(29, 'd6ea0fbf-43d9-11f1-bf47-0a0027000003', 2, 1, 3, 'Kinh tế - Sách số 9', NULL, 'kinh-te-9', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 124121, NULL, 0, 29, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(30, 'd6ea181d-43d9-11f1-bf47-0a0027000003', 1, 2, 1, 'Tiểu thuyết - Sách số 9', NULL, 'tieu-thuyet-9', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 97436, NULL, 0, 66, NULL, NULL, NULL, NULL, 1, 0, 1, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(31, 'd6ea21ab-43d9-11f1-bf47-0a0027000003', 3, 1, 3, 'Kỹ năng sống - Sách số 10', NULL, 'ky-nang-song-10', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 163245, NULL, 0, 101, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(32, 'd6ea29be-43d9-11f1-bf47-0a0027000003', 2, 3, 2, 'Kinh tế - Sách số 10', NULL, 'kinh-te-10', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 216650, NULL, 0, 80, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(33, 'd6ea31c2-43d9-11f1-bf47-0a0027000003', 1, 2, 2, 'Tiểu thuyết - Sách số 10', NULL, 'tieu-thuyet-10', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 129665, NULL, 0, 87, NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0.0, 0, '2026-04-29 21:43:51', '2026-04-29 21:43:51'),
	(35, 'a693f23d-43db-11f1-bf47-0a0027000003', 8, 3, 2, 'Thiếu nhi - Cuốn 1', NULL, 'thieu-nhi-cuon-1', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 90000, NULL, 0, 30, NULL, NULL, NULL, NULL, 1, 1, 1, 2, 1, 0.0, 0, '2026-04-29 21:56:49', '2026-05-11 14:15:25'),
	(36, 'a6940720-43db-11f1-bf47-0a0027000003', 7, 3, 2, 'Khoa học - Cuốn 1', NULL, 'khoa-hoc-cuon-1', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 90000, NULL, 0, 31, NULL, NULL, NULL, NULL, 1, 1, 1, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49'),
	(37, 'a69783c4-43db-11f1-bf47-0a0027000003', 8, 3, 2, 'Thiếu nhi - Cuốn 2', NULL, 'thieu-nhi-cuon-2', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 100000, NULL, 0, 32, NULL, NULL, NULL, NULL, 1, 1, 1, 1, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-05-04 15:05:04'),
	(38, 'a6978ad3-43db-11f1-bf47-0a0027000003', 7, 3, 2, 'Khoa học - Cuốn 2', NULL, 'khoa-hoc-cuon-2', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 100000, NULL, 0, 32, NULL, NULL, NULL, NULL, 1, 1, 1, 3, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 23:33:55'),
	(39, 'a6979118-43db-11f1-bf47-0a0027000003', 8, 3, 2, 'Thiếu nhi - Cuốn 3', NULL, 'thieu-nhi-cuon-3', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 110000, NULL, 0, 33, NULL, NULL, NULL, NULL, 1, 1, 1, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49'),
	(40, 'a69798f3-43db-11f1-bf47-0a0027000003', 7, 3, 2, 'Khoa học - Cuốn 3', NULL, 'khoa-hoc-cuon-3', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 110000, NULL, 0, 32, NULL, NULL, NULL, NULL, 1, 1, 1, 0, 1, 0.0, 0, '2026-04-29 21:56:49', '2026-05-11 14:10:37'),
	(41, 'a6979f20-43db-11f1-bf47-0a0027000003', 8, 3, 2, 'Thiếu nhi - Cuốn 4', NULL, 'thieu-nhi-cuon-4', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 120000, NULL, 0, 32, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 2, 0.0, 0, '2026-04-29 21:56:49', '2026-05-11 14:15:25'),
	(42, 'a697a53a-43db-11f1-bf47-0a0027000003', 7, 3, 2, 'Khoa học - Cuốn 4', NULL, 'khoa-hoc-cuon-4', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 120000, NULL, 0, 33, NULL, NULL, NULL, NULL, 1, 1, 0, 6, 1, 0.0, 0, '2026-04-29 21:56:49', '2026-05-11 14:31:35'),
	(43, 'a697adfb-43db-11f1-bf47-0a0027000003', 8, 3, 2, 'Thiếu nhi - Cuốn 5', NULL, 'thieu-nhi-cuon-5', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 130000, NULL, 0, 35, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49'),
	(44, 'a697b42f-43db-11f1-bf47-0a0027000003', 7, 3, 2, 'Khoa học - Cuốn 5', NULL, 'khoa-hoc-cuon-5', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 130000, NULL, 0, 35, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49'),
	(45, 'a697b9fc-43db-11f1-bf47-0a0027000003', 8, 3, 2, 'Thiếu nhi - Cuốn 6', NULL, 'thieu-nhi-cuon-6', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 140000, NULL, 0, 36, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49'),
	(46, 'a697bfbf-43db-11f1-bf47-0a0027000003', 7, 3, 2, 'Khoa học - Cuốn 6', NULL, 'khoa-hoc-cuon-6', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 140000, NULL, 0, 36, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49'),
	(47, 'a697c5b7-43db-11f1-bf47-0a0027000003', 8, 3, 2, 'Thiếu nhi - Cuốn 7', NULL, 'thieu-nhi-cuon-7', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 150000, NULL, 0, 37, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49'),
	(48, 'a697e262-43db-11f1-bf47-0a0027000003', 7, 3, 2, 'Khoa học - Cuốn 7', NULL, 'khoa-hoc-cuon-7', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 150000, NULL, 0, 37, NULL, NULL, NULL, NULL, 1, 1, 0, 2, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 23:18:14'),
	(49, 'a698264f-43db-11f1-bf47-0a0027000003', 8, 3, 2, 'Thiếu nhi - Cuốn 8', NULL, 'thieu-nhi-cuon-8', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 160000, NULL, 0, 38, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49'),
	(50, 'a6982dce-43db-11f1-bf47-0a0027000003', 7, 3, 2, 'Khoa học - Cuốn 8', NULL, 'khoa-hoc-cuon-8', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 160000, NULL, 0, 38, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49'),
	(51, 'a698349d-43db-11f1-bf47-0a0027000003', 8, 3, 2, 'Thiếu nhi - Cuốn 9', NULL, 'thieu-nhi-cuon-9', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 170000, NULL, 0, 39, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49'),
	(52, 'a6983aa1-43db-11f1-bf47-0a0027000003', 7, 3, 2, 'Khoa học - Cuốn 9', NULL, 'khoa-hoc-cuon-9', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 170000, NULL, 0, 39, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49'),
	(53, 'a698405e-43db-11f1-bf47-0a0027000003', 8, 3, 2, 'Thiếu nhi - Cuốn 10', NULL, 'thieu-nhi-cuon-10', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 180000, NULL, 0, 40, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49'),
	(54, 'a6984980-43db-11f1-bf47-0a0027000003', 7, 3, 2, 'Khoa học - Cuốn 10', NULL, 'khoa-hoc-cuon-10', NULL, NULL, NULL, NULL, NULL, 'English', NULL, NULL, 'paperback', 180000, NULL, 0, 40, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0.0, 0, '2026-04-29 21:56:49', '2026-04-29 21:56:49');

-- Dumping structure for table bookstore.product_images
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alt_text` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_primary` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_product_images_product` (`product_id`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.product_images: ~56 rows (approximately)
INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`) VALUES
	(1, 1, 'https://picsum.photos/200/300?1', NULL, 0, 1),
	(2, 2, 'https://picsum.photos/200/300?2', NULL, 0, 1),
	(3, 3, 'https://picsum.photos/200/300?3', NULL, 0, 1),
	(4, 1, 'https://picsum.photos/200/300?random=1', NULL, 0, 1),
	(5, 2, 'https://picsum.photos/200/300?random=2', NULL, 0, 1),
	(6, 3, 'https://picsum.photos/200/300?random=3', NULL, 0, 1),
	(7, 4, 'https://picsum.photos/200/300?random=4', NULL, 0, 1),
	(8, 5, 'https://picsum.photos/200/300?random=5', NULL, 0, 1),
	(9, 6, 'https://picsum.photos/200/300?random=6', NULL, 0, 1),
	(10, 7, 'https://picsum.photos/200/300?random=7', NULL, 0, 1),
	(11, 8, 'https://picsum.photos/200/300?random=8', NULL, 0, 1),
	(12, 9, 'https://picsum.photos/200/300?random=9', NULL, 0, 1),
	(13, 10, 'https://picsum.photos/200/300?random=10', NULL, 0, 1),
	(14, 11, 'https://picsum.photos/200/300?random=11', NULL, 0, 1),
	(15, 12, 'https://picsum.photos/200/300?random=12', NULL, 0, 1),
	(16, 13, 'https://picsum.photos/200/300?random=13', NULL, 0, 1),
	(17, 14, 'https://picsum.photos/200/300?random=14', NULL, 0, 1),
	(18, 15, 'https://picsum.photos/200/300?random=15', NULL, 0, 1),
	(19, 16, 'https://picsum.photos/200/300?random=16', NULL, 0, 1),
	(20, 17, 'https://picsum.photos/200/300?random=17', NULL, 0, 1),
	(21, 18, 'https://picsum.photos/200/300?random=18', NULL, 0, 1),
	(22, 19, 'https://picsum.photos/200/300?random=19', NULL, 0, 1),
	(23, 20, 'https://picsum.photos/200/300?random=20', NULL, 0, 1),
	(24, 21, 'https://picsum.photos/200/300?random=21', NULL, 0, 1),
	(25, 22, 'https://picsum.photos/200/300?random=22', NULL, 0, 1),
	(26, 23, 'https://picsum.photos/200/300?random=23', NULL, 0, 1),
	(27, 24, 'https://picsum.photos/200/300?random=24', NULL, 0, 1),
	(28, 25, 'https://picsum.photos/200/300?random=25', NULL, 0, 1),
	(29, 26, 'https://picsum.photos/200/300?random=26', NULL, 0, 1),
	(30, 27, 'https://picsum.photos/200/300?random=27', NULL, 0, 1),
	(31, 28, 'https://picsum.photos/200/300?random=28', NULL, 0, 1),
	(32, 29, 'https://picsum.photos/200/300?random=29', NULL, 0, 1),
	(33, 30, 'https://picsum.photos/200/300?random=30', NULL, 0, 1),
	(34, 31, 'https://picsum.photos/200/300?random=31', NULL, 0, 1),
	(35, 32, 'https://picsum.photos/200/300?random=32', NULL, 0, 1),
	(36, 33, 'https://picsum.photos/200/300?random=33', NULL, 0, 1),
	(67, 35, 'https://picsum.photos/200/300?random=35', NULL, 0, 1),
	(68, 36, 'https://picsum.photos/200/300?random=36', NULL, 0, 1),
	(69, 37, 'https://picsum.photos/200/300?random=37', NULL, 0, 1),
	(70, 38, 'https://picsum.photos/200/300?random=38', NULL, 0, 1),
	(71, 39, 'https://picsum.photos/200/300?random=39', NULL, 0, 1),
	(72, 40, 'https://picsum.photos/200/300?random=40', NULL, 0, 1),
	(73, 41, 'https://picsum.photos/200/300?random=41', NULL, 0, 1),
	(74, 42, 'https://picsum.photos/200/300?random=42', NULL, 0, 1),
	(75, 43, 'https://picsum.photos/200/300?random=43', NULL, 0, 1),
	(76, 44, 'https://picsum.photos/200/300?random=44', NULL, 0, 1),
	(77, 45, 'https://picsum.photos/200/300?random=45', NULL, 0, 1),
	(78, 46, 'https://picsum.photos/200/300?random=46', NULL, 0, 1),
	(79, 47, 'https://picsum.photos/200/300?random=47', NULL, 0, 1),
	(80, 48, 'https://picsum.photos/200/300?random=48', NULL, 0, 1),
	(81, 49, 'https://picsum.photos/200/300?random=49', NULL, 0, 1),
	(82, 50, 'https://picsum.photos/200/300?random=50', NULL, 0, 1),
	(83, 51, 'https://picsum.photos/200/300?random=51', NULL, 0, 1),
	(84, 52, 'https://picsum.photos/200/300?random=52', NULL, 0, 1),
	(85, 53, 'https://picsum.photos/200/300?random=53', NULL, 0, 1),
	(86, 54, 'https://picsum.photos/200/300?random=54', NULL, 0, 1);

-- Dumping structure for table bookstore.product_tags
CREATE TABLE IF NOT EXISTS `product_tags` (
  `product_id` int NOT NULL,
  `tag` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`product_id`,`tag`),
  CONSTRAINT `fk_product_tags_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.product_tags: ~0 rows (approximately)

-- Dumping structure for table bookstore.publishers
CREATE TABLE IF NOT EXISTS `publishers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.publishers: ~3 rows (approximately)
INSERT INTO `publishers` (`id`, `name`, `name_en`, `slug`, `logo_url`, `website`, `created_at`) VALUES
	(1, 'NXB Trẻ', NULL, 'nxb-tre', NULL, NULL, '2026-04-29 21:32:36'),
	(2, 'NXB Kim Đồng', NULL, 'kim-dong', NULL, NULL, '2026-04-29 21:32:36'),
	(3, 'NXB Lao Động', NULL, 'lao-dong', NULL, NULL, '2026-04-29 21:32:36');

-- Dumping structure for table bookstore.reviews
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `rating` int DEFAULT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `pros` text COLLATE utf8mb4_unicode_ci,
  `cons` text COLLATE utf8mb4_unicode_ci,
  `is_verified_purchase` tinyint(1) DEFAULT '0',
  `is_approved` tinyint(1) DEFAULT '0',
  `helpful_count` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_reviews_product` (`product_id`),
  KEY `fk_reviews_user` (`user_id`),
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.reviews: ~0 rows (approximately)

-- Dumping structure for table bookstore.settings
CREATE TABLE IF NOT EXISTS `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `group_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_name` (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.settings: ~0 rows (approximately)

-- Dumping structure for table bookstore.sliders
CREATE TABLE IF NOT EXISTS `sliders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtitle` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `button_text` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.sliders: ~0 rows (approximately)

-- Dumping structure for table bookstore.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ugid` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('customer','admin','super_admin') COLLATE utf8mb4_unicode_ci DEFAULT 'customer',
  `is_active` tinyint(1) DEFAULT '1',
  `email_verified` tinyint(1) DEFAULT '0',
  `google_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ugid` (`ugid`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.users: ~5 rows (approximately)
INSERT INTO `users` (`id`, `ugid`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `avatar_url`, `role`, `is_active`, `email_verified`, `google_id`, `created_at`, `updated_at`) VALUES
	(1, '2955f64d-43d8-11f1-bf47-0a0027000003', 'admin@gmail.com', '$2y$10$AgTYou/9zaXeWUc4onNnPeih.utP7Pzcc7sFM1hqmsVhbivCQs9Cu', 'Admin', 'System', NULL, NULL, 'admin', 1, 0, NULL, '2026-04-29 21:31:51', '2026-04-29 22:19:36'),
	(2, '295739b3-43d8-11f1-bf47-0a0027000003', 'user1@gmail.com', '$2y$10$PetLzHds.72chBSwSipc0OWLOK17EQRQNd6abDe96LntglYD8.P9y', 'Nguyen', 'An', NULL, NULL, 'customer', 1, 0, NULL, '2026-04-29 21:31:51', '2026-04-29 22:19:36'),
	(3, '2957433f-43d8-11f1-bf47-0a0027000003', 'user2@gmail.com', '123456', 'Tran', 'Binh', NULL, NULL, 'customer', 1, 0, NULL, '2026-04-29 21:31:51', '2026-04-29 21:31:51'),
	(4, 'admin-seed-user-000000000000000000', 'admin@bookstore.com', '$2y$10$Q0A/T.dHK9RAe27poTA.l.R8hZ6kCaJ1MzLdCwzR5VjzU3ZAsWuHK', 'Admin', 'Bookstore', NULL, NULL, 'super_admin', 1, 1, NULL, '2026-04-29 21:37:16', '2026-04-29 22:14:56'),
	(6, 'customer-seed-user-00000000000000', 'ali@example.com', '$2y$10$kvEJqB2.IlaXkmJK7oMkee0C6ZiPxw6EUoiP8vZLsVqzkiomY/IgW', 'Ali', 'Nguyen', NULL, NULL, 'customer', 1, 1, NULL, '2026-04-29 22:14:56', '2026-04-29 22:14:56');

-- Dumping structure for table bookstore.user_addresses
CREATE TABLE IF NOT EXISTS `user_addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `title` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_user_addresses_user` (`user_id`),
  CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.user_addresses: ~0 rows (approximately)
INSERT INTO `user_addresses` (`id`, `user_id`, `title`, `full_name`, `phone`, `province`, `city`, `postal_code`, `address`, `is_default`, `created_at`) VALUES
	(1, 2, 'AN', 'Nguyen An', '0123456789', 'Ha Noi', 'Tu Liem', '046', 'MTA', 1, '2026-05-04 14:30:29');

-- Dumping structure for table bookstore.wishlist
CREATE TABLE IF NOT EXISTS `wishlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wishlist_user_product` (`user_id`,`product_id`),
  KEY `fk_wishlist_product` (`product_id`),
  CONSTRAINT `fk_wishlist_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bookstore.wishlist: ~3 rows (approximately)
INSERT INTO `wishlist` (`id`, `user_id`, `product_id`, `created_at`) VALUES
	(2, 2, 38, '2026-04-29 23:33:55'),
	(3, 2, 48, '2026-05-04 14:27:56'),
	(4, 2, 37, '2026-05-04 14:27:57'),
	(5, 2, 42, '2026-05-11 08:55:12');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

# Hướng Dẫn Quản Lý Sách - Admin Panel

## 📋 Tổng Quan

Hệ thống quản lý sách đã được tích hợp hoàn chỉnh vào admin panel. Bạn có thể:
- ✅ **Thêm sách** mới với đầy đủ thông tin
- ✅ **Chỉnh sửa sách** hiện có
- ✅ **Xóa sách** khỏi hệ thống
- ✅ **Quản lý** giá, tồn kho, danh mục, tác giả, nhà xuất bản

---

## 🚀 Bước 1: Chuẩn Bị Dữ Liệu Test

### Nhập seed data vào database:

```bash
# Mở MySQL CLI hoặc phpMyAdmin
# Chạy file seed_data.sql:

mysql -h localhost -u root bookstore < database/seed_data.sql
```

**Hoặc sử dụng phpMyAdmin:**
1. Mở phpMyAdmin (http://localhost/phpmyadmin)
2. Chọn database `bookstore`
3. Chọn tab **Import**
4. Upload file `database/seed_data.sql`
5. Nhấn **Import**

Seed data sẽ tạo:
- **5 tác giả** (Nguyễn Nhật Ánh, Harper Lee, J.K. Rowling, v.v)
- **5 nhà xuất bản** (NXB Trẻ, Penguin, Scholastic, HarperCollins, v.v)
- **6 danh mục** (Văn học Việt Nam, Tiểu thuyết, Trẻ em, Khoa học, v.v)
- **5 sách mẫu** (Chúc các bạn sẽ có một cuộc đời tươi đẹp, Harry Potter, To Kill a Mockingbird, v.v)

---

## 🔧 Bước 2: Khởi Động Admin Panel

### Cửa sổ Terminal 1 - Backend API:

```bash
cd backend
php -S localhost:5000 index.php
```

Kiểm tra health:
```
http://localhost:5000/api/v1/health
```

Phải trả về:
```json
{
  "success": true,
  "database": "connected"
}
```

### Cửa sổ Terminal 2 - Admin Panel:

```bash
cd admin-panel
npm run dev
```

Truy cập: `http://localhost:5173`

---

## 📚 Bước 3: Sử Dụng Chức Năng Quản Lý Sách

### **Đăng Nhập**

1. Truy cập http://localhost:5173/login
2. Email: (Tạo tài khoản admin trước - xem dưới)
3. Password: Của bạn

**Tạo tài khoản admin (nếu chưa có):**

```php
// Chạy trong MySQL CLI
INSERT INTO users (ugid, email, password_hash, first_name, role, is_active) 
VALUES (
  UUID(),
  'admin@example.com',
  '$2y$10$...',  // password hash của "password"
  'Admin',
  'admin',
  1
);

// Hoặc sử dụng register page và sau đó update role
```

### **Danh Sách Sách (Products)**

1. Sau khi đăng nhập, nhấp vào **"Quản lý sách"** trong sidebar
2. Bạn sẽ thấy:
   - 📖 Danh sách tất cả sách
   - 🔍 Tìm kiếm theo tên hoặc SKU
   - ➕ Nút **"Thêm sách"** (góc trên phải)

### **Thêm Sách Mới**

1. Nhấp **"Thêm sách"** 
2. Điền các thông tin:

#### **Phần 1: Thông tin cơ bản**
- **Tiêu đề** * (bắt buộc): "Cuộc chiến thế chân thực"
- **Tiêu đề (Anh)**: "The Real War"
- **ISBN**: "978-3-16-148410" (độc nhất)
- **SKU**: "BOOK-2024-001"
- **Mô tả ngắn**: (tối đa 500 ký tự)
- **Mô tả chi tiết**: (chi tiết đầy đủ về sách)

#### **Phần 2: Chi tiết sách**
- **Danh mục** * (bắt buộc): Chọn từ dropdown (ví dụ: "Tiểu thuyết")
- **Tác giả**: Chọn từ dropdown hoặc bỏ trống
- **Nhà xuất bản**: Chọn từ dropdown hoặc bỏ trống
- **Số trang**: 450
- **Năm xuất bản**: 2024
- **Ngôn ngữ**: Tiếng Việt / English / 中文 / ...
- **Dịch giả**: (nếu có)
- **Phiên bản**: "Lần thứ 1"
- **Định dạng**: Bìa mềm / Bìa cứng / E-book
- **Cân nặng**: 350 (gram)

#### **Phần 3: Giá & Kho**
- **Giá gốc (VND)** * (bắt buộc): 99000
- **Giá so sánh (VND)**: 129000 (giá gạch chéo)
- **Chiết khấu (%)**: 23 (tự động tính từ giá)
- **Số lượng kho** * (bắt buộc): 150

#### **Phần 4: SEO & Trạng thái**
- **Meta Title**: Tiêu đề cho SEO
- **Meta Description**: Mô tả cho công cụ tìm kiếm
- ✅ **Hiển thị sách**: Bật (checked)
- ✅ **Sách nổi bật**: Bật (checked)
- ⬜ **Bestseller**: Không bắt buộc

3. Nhấp **"Thêm sách"** để lưu

**Kết quả:** Sách được thêm vào database, sẽ xuất hiện trong danh sách

---

### **Chỉnh Sửa Sách**

1. Ở danh sách sách, tìm sách cần sửa
2. Nhấp biểu tượng **Chỉnh sửa** (bút chì)
3. Sửa các thông tin cần thiết
4. Nhấp **"Cập nhật sách"** để lưu

---

### **Xóa Sách**

1. Ở danh sách sách, tìm sách cần xóa
2. Nhấp biểu tượng **Xóa** (thùng rác) màu đỏ
3. Xác nhận: **"Bạn có chắc muốn xóa sách này?"**
4. Sách sẽ bị xóa khỏi database

⚠️ **Cảnh báo**: Không thể phục hồi sau khi xóa!

---

## 🔌 API Endpoints - Tham Khảo

### **Danh Sách Sách**
```
GET /api/v1/admin/products?page=1&limit=20&search=Harry
```

Response:
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 50,
      "totalPages": 3
    }
  }
}
```

### **Lấy Chi Tiết 1 Sách**
```
GET /api/v1/admin/products/3
```

### **Thêm Sách**
```
POST /api/v1/admin/products
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Sách mới",
  "isbn": "978-...",
  "price": 99000,
  "stock": 100,
  "category_id": 2,
  "author_id": 1,
  "is_active": 1
}
```

### **Cập Nhật Sách**
```
PUT /api/v1/admin/products/3
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Tiêu đề mới",
  "price": 110000,
  "stock": 95
}
```

### **Xóa Sách**
```
DELETE /api/v1/admin/products/3
Authorization: Bearer {token}
```

### **Danh Sách Tác Giả**
```
GET /api/v1/authors
```

### **Danh Sách Nhà Xuất Bản**
```
GET /api/v1/publishers
```

### **Danh Sách Danh Mục**
```
GET /api/v1/categories
```

---

## 🗄️ Database Schema - Tham Khảo

### **Bảng products**
```sql
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ugid VARCHAR(36) UNIQUE,           -- ID duy nhất
  category_id INT,                    -- Danh mục
  author_id INT,                      -- Tác giả
  publisher_id INT,                   -- Nhà xuất bản
  title VARCHAR(255) NOT NULL,        -- Tiêu đề
  isbn VARCHAR(20),                   -- ISBN
  price DECIMAL(12, 0),               -- Giá
  compare_price DECIMAL(12, 0),       -- Giá so sánh
  discount_percent INT,               -- % chiết khấu
  stock INT,                          -- Tồn kho
  format ENUM('hardcover', 'paperback', 'ebook'),
  language VARCHAR(20),               -- Ngôn ngữ
  pages INT,                          -- Số trang
  publish_year INT,                   -- Năm xuất bản
  is_active TINYINT(1),              -- Hiển thị (1/0)
  is_featured TINYINT(1),            -- Nổi bật (1/0)
  is_bestseller TINYINT(1),          -- Bestseller (1/0)
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME ON UPDATE NOW()
);
```

### **Bảng authors**
```sql
CREATE TABLE authors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  slug VARCHAR(100) UNIQUE,
  bio TEXT,
  image_url VARCHAR(255)
);
```

### **Bảng publishers**
```sql
CREATE TABLE publishers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  slug VARCHAR(100) UNIQUE,
  logo_url VARCHAR(255),
  website VARCHAR(255)
);
```

---

## 🐛 Troubleshooting

### **"Không thể kết nối API"**
- Kiểm tra backend chạy: `php -S localhost:5000`
- Kiểm tra CORS config trong `backend/config.php`
- Check console browser (F12) để xem error

### **"Sách không lưu"**
- Kiểm tra các trường bắt buộc: title, price, stock, category_id
- Kiểm tra ISBN không bị trùng lặp
- Xem response error message

### **"Danh mục/Tác giả không hiển thị"**
- Kiểm tra database có dữ liệu không: `SELECT * FROM categories;`
- Kiểm tra API endpoint: `curl http://localhost:5000/api/v1/categories`
- Kiểm tra browser console cho JavaScript errors

### **"Đăng nhập không được"**
- Kiểm tra tài khoản admin tồn tại
- Kiểm tra role = 'admin' hoặc 'super_admin'
- Clear localStorage và retry

---

## 📝 Ghi Chú

- Tất cả trường text tự động escape XSS
- ISBN phải unique (không được trùng)
- Slug tự động generate từ tiêu đề + timestamp
- Giá phải là số nguyên (VND)
- Tồn kho không được âm
- Admin có thể quản lý products, categories
- Super admin có quyền quản lý toàn bộ hệ thống

---

## 📞 Liên Hệ & Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra logs: `php -S localhost:5000` (terminal)
2. Kiểm tra browser console (F12)
3. Check database trực tiếp
4. Review `backend/helpers.php` và `admin-panel/src/services/admin.service.js`

---

**Ngày cập nhật:** May 4, 2026  
**Phiên bản:** 1.0

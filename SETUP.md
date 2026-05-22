# Hướng dẫn cài đặt dự án BookStore

## Yêu cầu phần mềm

| Phần mềm | Phiên bản | Tải về |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| PHP | 8.0+ (có extension `pdo_mysql`) | Cài qua Laragon |
| MySQL | 8.0 | Cài qua Laragon |
| Laragon *(hoặc XAMPP/WAMP)* | bất kỳ | https://laragon.org |
| Git | bất kỳ | https://git-scm.com |

---

## Bước 1 — Clone repo về máy

```bash
git clone https://github.com/<tên-repo>/book-store-main.git
cd book-store-main
```

---

## Bước 2 — Cài Node.js dependencies

```bash
npm run install:all
```

Lệnh này tự động chạy `npm install` cho cả `frontend/` và `admin-panel/`.

---

## Bước 3 — Tạo database MySQL

1. Mở **Laragon** → bấm **Start All** để bật MySQL
2. Mở **HeidiSQL** hoặc **phpMyAdmin** (nút Database trong Laragon)
3. Import file SQL:

```
database/schema_mysql.sql
```

File này tự tạo database `bookstore` và toàn bộ các bảng.

> **Nếu dùng XAMPP:** Mở phpMyAdmin tại `http://localhost/phpmyadmin`, tạo database `bookstore`, rồi import file trên.

---

## Bước 4 — Tạo file cấu hình backend

File `.env` bị gitignore nên **không có trong repo**. Bạn phải tạo thủ công:

```bash
copy backend\development.env.example backend\development.env
```

*(macOS/Linux: `cp backend/development.env.example backend/development.env`)*

Mở file `backend/development.env` vừa tạo và kiểm tra:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=bookstore
DB_USER=root
DB_PASSWORD=          # Nếu MySQL của bạn có mật khẩu root thì điền vào đây
```

> **Laragon mặc định:** user=`root`, password để trống.  
> **XAMPP mặc định:** user=`root`, password để trống.  
> **WAMP mặc định:** user=`root`, password để trống.

---

## Bước 5 — Kiểm tra PHP extension

PHP cần có extension `pdo_mysql`. Mở terminal và chạy:

```bash
php -m | grep pdo
```

Phải thấy `pdo_mysql` trong kết quả. Laragon đã bật sẵn. Nếu dùng XAMPP thì mở `php.ini`, bỏ dấu `;` ở dòng `extension=pdo_mysql`.

---

## Bước 6 — Chạy dự án

### Cách 1 — Chạy tất cả cùng lúc (Windows)

```bash
start-all.bat
```

Script này tự mở 3 cửa sổ terminal cho Backend, Frontend và Admin Panel.

### Cách 2 — Chạy từng phần riêng

Mở **3 terminal riêng biệt**:

**Terminal 1 — Backend PHP:**
```bash
php -S 127.0.0.1:5000 -t backend backend/index.php
```

**Terminal 2 — Frontend (storefront):**
```bash
npm --prefix frontend run dev
```

**Terminal 3 — Admin Panel:**
```bash
npm --prefix admin-panel run dev
```

---

## Địa chỉ truy cập

| Dịch vụ | URL |
|---|---|
| Trang mua hàng (khách) | http://localhost:3000 |
| Trang quản trị (admin) | http://localhost:3001 |
| Backend API | http://localhost:5000 |
| Kiểm tra API | http://localhost:5000/api/v1/health |

---

## Tạo tài khoản admin

Sau khi chạy xong, mở **HeidiSQL / phpMyAdmin** và chạy lệnh SQL sau để tạo tài khoản super_admin:

```sql
INSERT INTO users (ugid, email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
  UUID(),
  'admin@bookstore.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Admin',
  'BookStore',
  'super_admin',
  1,
  1
);
```

> Mật khẩu mặc định là `password`. Đổi mật khẩu ngay sau khi đăng nhập.

Đăng nhập tại: http://localhost:3001 với `admin@bookstore.com` / `password`

---

## Xử lý lỗi thường gặp

### Lỗi "ECONNREFUSED 127.0.0.1:5000"
→ Backend PHP chưa chạy. Chạy terminal 1 ở Bước 6.

### Lỗi "Cannot connect to database"
→ MySQL chưa bật. Mở Laragon → Start All.  
→ Hoặc `DB_PASSWORD` trong `development.env` sai.

### Lỗi "Unknown column 'payment_method'"
→ Chạy lại `database/schema_mysql.sql` để cập nhật schema.

### Lỗi "node_modules not found"
→ Chạy lại `npm run install:all`.

### Frontend không load (trang trắng)
→ Kiểm tra xem Backend có đang chạy không (truy cập `/api/v1/health`).
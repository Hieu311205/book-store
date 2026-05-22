# Ket noi MySQL Laragon voi PHP API

## 1. Bat MySQL trong Laragon

Mo Laragon va bam `Start All`, hoac bat rieng MySQL.

Thong tin mac dinh cua Laragon:

```text
Host: 127.0.0.1
Port: 3306
User: root
Password: de trong
Database: bookstore
```

## 2. Tao database va bang

Mo phpMyAdmin hoac HeidiSQL trong Laragon, import file:

```text
database/schema_mysql.sql
```

File nay se tao database `bookstore` va cac bang can thiet.

## 3. Cau hinh backend

File `backend/development.env` dang cau hinh theo Laragon:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=bookstore
DB_USER=root
DB_PASSWORD=
DB_CHARSET=utf8mb4
```

Neu MySQL cua ban co mat khau root, dien vao `DB_PASSWORD`.

## 4. Kiem tra PHP extension

PHP can extension `pdo_mysql`. Laragon cua ban da co san extension nay. Kiem tra:

```bash
php -m
```

Can thay:

```text
PDO
pdo_mysql
```

## 5. Chay API

```bash
cd C:\Users\ASUS\Downloads\book_store-main\book_store-main\backend
php -S localhost:5000 index.php
```

Kiem tra:

```text
http://localhost:5000/api/v1/health
```

Neu thanh cong, response co:

```json
{
  "success": true,
  "database": "connected"
}
```


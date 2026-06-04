-- Them bang OTP xac nhan dang ky tai khoan
-- Chay file nay mot lan. Neu bang da co thi se bo qua.

CREATE TABLE IF NOT EXISTS registration_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_registration_email (email),
  INDEX idx_registration_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm cấu hình tài khoản ngân hàng shop để hiển thị QR chuyển khoản
-- Chạy file này một lần, sau đó chỉnh sửa giá trị trong Admin > Cài đặt

INSERT INTO settings (key_name, value, type, group_name) VALUES
  ('bank_name',           'Vietcombank',           'string',  'payment'),
  ('bank_account_number', '1234567890',             'string',  'payment'),
  ('bank_account_name',   'NGUYEN VAN A',           'string',  'payment'),
  ('bank_qr_image',       '',                       'string',  'payment')
ON DUPLICATE KEY UPDATE key_name = key_name;

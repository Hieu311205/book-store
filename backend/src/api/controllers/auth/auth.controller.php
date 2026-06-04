<?php
/**
 * CONTROLLER XÁC THỰC — src/api/controllers/auth/auth.controller.php
 *
 * Vị trí trong kiến trúc:
 *   auth.php (route)  →  auth.controller.php  →  helpers.php/DB  →  MySQL bảng users, cart_items
 *
 * Chức năng:
 *   - Đăng ký tài khoản thường (email + password)
 *   - Đăng nhập tài khoản thường
 *   - Đăng nhập Google OAuth (credential JWT từ Google → xác thực → tạo/cập nhật user nội bộ)
 *   - Đăng xuất (stateless — chỉ trả 200, client tự xoá token)
 *   - Quên/đặt lại mật khẩu (stub chưa triển khai)
 *   - Lấy thông tin user hiện tại (GET /auth/me)
 *   - Cập nhật hồ sơ (PUT /auth/me)
 *   - Đổi mật khẩu (PUT /auth/password)
 *
 * Luồng JWT nội bộ:
 *   generateToken($userId) → tạo JWT HS256 với secret trong config.php
 *     → trả token về frontend → frontend lưu localStorage/cookie
 *       → mọi request sau gửi kèm header: Authorization: Bearer <token>
 *         → currentUser() (helpers.php) xác minh chữ ký + exp + is_active
 *
 * Luồng Google OAuth:
 *   Frontend nhận Google credential (JWT từ Google Sign-In SDK)
 *     → POST /auth/google {credential}
 *       → verifyGoogleCredential() gọi Google tokeninfo API
 *         → Google xác nhận chữ ký → trả payload {sub, email, name, picture, ...}
 *           → tìm user theo google_id hoặc email
 *             → tồn tại: cập nhật google_id + avatar
 *             → không tồn tại: INSERT user mới (password_hash = NULL)
 *               → mergeSessionCartIntoUser() merge giỏ hàng session vào user
 *                 → generateToken() tạo JWT nội bộ → trả về frontend
 */
$config = include __DIR__ . '/../../../../config.php';
require_once __DIR__ . '/../../../lib/GmailSmtp.php';

// Simple JWT functions (in production, use a library)
/**
 * Encode chuỗi sang Base64 URL-safe (thay +/= thành -_).
 * Input:  $data (string) — dữ liệu binary hoặc JSON.
 * Output: string — Base64 URL-safe string, dùng trong JWT.
 * Gọi từ: generateToken().
 */
function base64UrlEncode($data) {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}

/**
 * Tạo JWT HS256 cho user — hết hạn sau 7 ngày.
 * Luồng: tạo header JSON → tạo payload JSON (userId, iat, exp)
 *        → ký HMAC-SHA256 bằng config['jwt']['secret']
 *        → ghép header.payload.signature (base64url).
 * Input:  $userId (int).
 * Output: string — JWT token.
 * Gọi từ: register(), login(), googleLogin() sau khi xác thực thành công.
 */
function generateToken($userId) {
    global $config;
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode(['userId' => $userId, 'iat' => time(), 'exp' => time() + (7 * 24 * 60 * 60)]); // 7 days
    $headerEncoded = base64UrlEncode($header);
    $payloadEncoded = base64UrlEncode($payload);
    $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, $config['jwt']['secret'], true);
    $signatureEncoded = base64UrlEncode($signature);
    return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
}

function ensureRegistrationOtpTable() {
    executeSql("CREATE TABLE IF NOT EXISTS registration_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_registration_email (email),
        INDEX idx_registration_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function sendRegistrationOtp($email, $firstName = '', $lastName = '') {
    global $config;
    ensureRegistrationOtpTable();

    executeSql("DELETE FROM registration_otps WHERE expires_at <= NOW() OR used_at IS NOT NULL");

    $recent = queryOne(
        "SELECT COUNT(*) AS cnt FROM registration_otps
         WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)",
        [$email]
    );
    if ((int)($recent['cnt'] ?? 0) >= 3) {
        jsonResponse(['success' => false, 'message' => 'Ban da gui OTP qua nhieu lan. Vui long thu lai sau 10 phut.'], 429);
    }

    executeSql("DELETE FROM registration_otps WHERE email = ? AND used_at IS NULL", [$email]);

    $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    executeSql(
        "INSERT INTO registration_otps (email, otp_code, expires_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))",
        [$email, $otp]
    );

    $toName = trim($firstName . ' ' . $lastName);
    if (!$toName) {
        $toName = $email;
    }

    $subject = 'Ma OTP xac nhan dang ky - Book Store';
    $body = "Xin chao {$toName},\r\n\r\n"
          . "Ma OTP xac nhan dang ky tai khoan Book Store cua ban la:\r\n\r\n"
          . "    {$otp}\r\n\r\n"
          . "Ma co hieu luc trong 5 phut. Vui long khong chia se ma nay voi bat ky ai.\r\n\r\n"
          . "Tran trong,\r\nBook Store";

    $mailUser = getenv('MAIL_USER');
    $mailPass = str_replace(' ', '', getenv('MAIL_PASS') ?: '');
    $emailSent = false;
    $errorMsg = null;

    if ($mailUser && $mailPass && $mailUser !== 'your-gmail@gmail.com') {
        try {
            $mailer = new GmailSmtp($mailUser, $mailPass);
            $mailer->send($email, $toName, $subject, $body);
            $emailSent = true;
        } catch (\Throwable $e) {
            $errorMsg = $e->getMessage();
            error_log("[REGISTER_OTP][SMTP Error] " . $errorMsg);
        }
    } else {
        $errorMsg = 'MAIL_USER / MAIL_PASS chua duoc cau hinh trong development.env';
    }

    error_log("[REGISTER_OTP] email={$email} otp={$otp} sent=" . ($emailSent ? 'yes' : 'no'));
    $isDevelopment = ($config['appEnv'] ?? getenv('APP_ENV') ?: 'development') === 'development';

    if (!$emailSent && !$isDevelopment) {
        jsonResponse([
            'success' => false,
            'message' => 'Khong the gui OTP xac nhan dang ky. Vui long thu lai sau.',
        ], 500);
    }

    $remaining = queryOne(
        "SELECT GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), expires_at)) AS secs
         FROM registration_otps WHERE email = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1",
        [$email]
    );

    jsonResponse([
        'success' => true,
        'message' => $emailSent
            ? "Ma OTP da duoc gui den {$email}"
            : 'Gui email that bai - xem ma OTP thu nghiem',
        'data' => [
            'requires_otp' => true,
            'email_sent' => $emailSent,
            'expires_in' => (int)($remaining['secs'] ?? 300),
            'dev_otp' => (!$emailSent && $isDevelopment ? $otp : null),
            'dev_error' => (!$emailSent && $isDevelopment ? $errorMsg : null),
        ],
    ]);
}

function verifyRegistrationOtp($email, $otpCode) {
    ensureRegistrationOtpTable();
    if (!$otpCode) {
        jsonResponse(['success' => false, 'message' => 'Vui long nhap ma OTP xac nhan dang ky'], 400);
    }

    $record = queryOne(
        "SELECT * FROM registration_otps
         WHERE email = ?
           AND otp_code = ?
           AND used_at IS NULL
           AND expires_at > NOW()
         ORDER BY id DESC LIMIT 1",
        [$email, $otpCode]
    );

    if (!$record) {
        jsonResponse(['success' => false, 'message' => 'Ma OTP khong dung hoac da het han'], 400);
    }

    executeSql("DELETE FROM registration_otps WHERE id = ?", [$record['id']]);
}

function ensurePasswordResetOtpTable() {
    executeSql("CREATE TABLE IF NOT EXISTS password_reset_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(100) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_password_reset_user (user_id),
        INDEX idx_password_reset_email (email),
        INDEX idx_password_reset_expires (expires_at),
        CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function sendPasswordResetOtp($user) {
    global $config;
    ensurePasswordResetOtpTable();

    executeSql("DELETE FROM password_reset_otps WHERE expires_at <= NOW() OR used_at IS NOT NULL");

    $recent = queryOne(
        "SELECT COUNT(*) AS cnt FROM password_reset_otps
         WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)",
        [$user['id']]
    );
    if ((int)($recent['cnt'] ?? 0) >= 3) {
        jsonResponse(['success' => false, 'message' => 'Ban da gui OTP qua nhieu lan. Vui long thu lai sau 10 phut.'], 429);
    }

    executeSql("DELETE FROM password_reset_otps WHERE user_id = ? AND used_at IS NULL", [$user['id']]);

    $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    executeSql(
        "INSERT INTO password_reset_otps (user_id, email, otp_code, expires_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))",
        [$user['id'], $user['email'], $otp]
    );

    $toName = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
    if (!$toName) {
        $toName = $user['email'];
    }

    $subject = 'Ma OTP dat lai mat khau - Book Store';
    $body = "Xin chao {$toName},\r\n\r\n"
          . "Ma OTP dat lai mat khau tai khoan Book Store cua ban la:\r\n\r\n"
          . "    {$otp}\r\n\r\n"
          . "Ma co hieu luc trong 5 phut. Neu ban khong yeu cau dat lai mat khau, hay bo qua email nay.\r\n\r\n"
          . "Tran trong,\r\nBook Store";

    $mailUser = getenv('MAIL_USER');
    $mailPass = str_replace(' ', '', getenv('MAIL_PASS') ?: '');
    $emailSent = false;
    $errorMsg = null;

    if ($mailUser && $mailPass && $mailUser !== 'your-gmail@gmail.com') {
        try {
            $mailer = new GmailSmtp($mailUser, $mailPass);
            $mailer->send($user['email'], $toName, $subject, $body);
            $emailSent = true;
        } catch (\Throwable $e) {
            $errorMsg = $e->getMessage();
            error_log("[RESET_OTP][SMTP Error] " . $errorMsg);
        }
    } else {
        $errorMsg = 'MAIL_USER / MAIL_PASS chua duoc cau hinh trong development.env';
    }

    error_log("[RESET_OTP] user={$user['id']} email={$user['email']} otp={$otp} sent=" . ($emailSent ? 'yes' : 'no'));
    $isDevelopment = ($config['appEnv'] ?? getenv('APP_ENV') ?: 'development') === 'development';

    if (!$emailSent && !$isDevelopment) {
        jsonResponse([
            'success' => false,
            'message' => 'Khong the gui OTP dat lai mat khau. Vui long thu lai sau.',
        ], 500);
    }

    $remaining = queryOne(
        "SELECT GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), expires_at)) AS secs
         FROM password_reset_otps WHERE user_id = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1",
        [$user['id']]
    );

    jsonResponse([
        'success' => true,
        'message' => $emailSent
            ? "Ma OTP da duoc gui den {$user['email']}"
            : 'Gui email that bai - xem ma OTP thu nghiem',
        'data' => [
            'requires_otp' => true,
            'email_sent' => $emailSent,
            'expires_in' => (int)($remaining['secs'] ?? 300),
            'dev_otp' => (!$emailSent && $isDevelopment ? $otp : null),
            'dev_error' => (!$emailSent && $isDevelopment ? $errorMsg : null),
        ],
    ]);
}

/**
 * Đăng ký tài khoản mới bằng email và mật khẩu.
 * Luồng: validate email+password → kiểm tra email chưa tồn tại → hash password
 *        → INSERT user mới → generateToken() → trả user + token.
 * Input:  JSON body {email, password, first_name, last_name, phone}.
 * Output: jsonResponse 201 {user, token} hoặc 400/409 nếu lỗi.
 * Gọi từ: auth.php handleAuth() (POST /auth/register).
 */
function register() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = strtolower(trim((string)($input['email'] ?? '')));
    $password = $input['password'] ?? '';
    $first_name = $input['first_name'] ?? '';
    $last_name = $input['last_name'] ?? '';
    $phone = $input['phone'] ?? '';
    $otpCode = trim((string)($input['otp_code'] ?? ''));

    if (!$email || !$password) {
        jsonResponse(['success' => false, 'message' => 'Vui lòng nhập email và mật khẩu'], 400);
    }

    // Kiểm tra email đã tồn tại trước để trả lỗi 409 rõ ràng thay vì lỗi duplicate key MySQL
    if (queryOne("SELECT id FROM users WHERE email = ?", [$email])) {
        jsonResponse(['success' => false, 'message' => 'Email đã được đăng ký'], 409);
    }

    // Dùng PASSWORD_DEFAULT (hiện là bcrypt) — tự động thêm salt, an toàn chống rainbow table
    if (!$otpCode) {
        sendRegistrationOtp($email, $first_name, $last_name);
    }

    verifyRegistrationOtp($email, $otpCode);

    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    $ugid = uniqid();

    $userId = insertRow('users', [
        'ugid' => $ugid,
        'email' => $email,
        'password_hash' => $password_hash,
        'first_name' => $first_name,
        'last_name' => $last_name,
        'phone' => $phone,
        'role' => 'customer',
        'is_active' => 1,
        'email_verified' => 1,
    ]);

    $user = queryOne("SELECT id, ugid, email, first_name, last_name, phone, role FROM users WHERE id = ?", [$userId]);

    $token = generateToken($userId);

    jsonResponse(['success' => true, 'message' => 'Đăng ký thành công', 'data' => ['user' => $user, 'token' => $token]], 201);
}

/**
 * Đăng nhập bằng email và mật khẩu.
 * Luồng: query user theo email → verifyPassword() → kiểm tra is_active
 *        → merge session cart vào user cart → generateToken() → trả user + token.
 * Input:  JSON body {email, password}; header X-Session-Id (tùy chọn, để merge giỏ hàng).
 * Output: jsonResponse {user, token} hoặc 401/403.
 * Gọi từ: auth.php handleAuth() (POST /auth/login).
 */
function login() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    $user = queryOne("SELECT * FROM users WHERE email = ?", [$email]);

    if (!$user || !verifyPassword($password, $user)) {
        // Trả cùng một thông báo lỗi cho cả "không tìm thấy user" và "sai mật khẩu"
        // để tránh tiết lộ email có tồn tại hay không (user enumeration attack)
        jsonResponse(['success' => false, 'message' => 'Email hoặc mật khẩu không đúng'], 401);
    }

    if (!$user['is_active']) {
        jsonResponse(['success' => false, 'message' => 'Tài khoản đã bị khóa'], 403);
    }

    // Merge session cart into user cart
    // Khi login, giỏ hàng ẩn danh (theo session_id) được gộp vào giỏ hàng của user
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
    if ($sessionId) {
        $sessionItems = queryAll("SELECT * FROM cart_items WHERE session_id = ?", [$sessionId]);
        foreach ($sessionItems as $item) {
            $existing = queryOne(
                "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
                [$user['id'], $item['product_id']]
            );
            if ($existing) {
                // Sản phẩm đã có trong giỏ user → cộng thêm số lượng từ session cart
                executeSql(
                    "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
                    [$item['quantity'], $existing['id']]
                );
                // Xoá hàng session cũ sau khi merge để tránh trùng lặp
                executeSql("DELETE FROM cart_items WHERE id = ?", [$item['id']]);
            } else {
                // Sản phẩm chưa có trong giỏ user → chuyển quyền sở hữu từ session_id sang user_id
                executeSql(
                    "UPDATE cart_items SET user_id = ?, session_id = NULL WHERE id = ?",
                    [$user['id'], $item['id']]
                );
            }
        }
    }

    $token = generateToken($user['id']);

    // Chỉ trả những trường cần thiết, không trả password_hash hay trường nhạy cảm
    $userData = [
        'id' => $user['id'],
        'ugid' => $user['ugid'],
        'email' => $user['email'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'phone' => $user['phone'],
        'role' => $user['role'],
        'avatar_url' => $user['avatar_url'],
    ];

    jsonResponse(['success' => true, 'data' => ['user' => $userData, 'token' => $token]]);
}

/**
 * Đăng xuất — stateless, server không cần làm gì thêm.
 * JWT không bị revoke ở server (không có blacklist) — client tự xoá token khỏi storage.
 * Input:  không cần gì.
 * Output: jsonResponse 200 {success: true}.
 * Gọi từ: auth.php handleAuth() (POST /auth/logout).
 */
function logout() {
    jsonResponse(['success' => true, 'message' => 'Đã đăng xuất']);
}

/**
 * Xác minh mật khẩu — hỗ trợ cả bcrypt hash và plain text (để migrate dữ liệu cũ).
 * Luồng: thử password_verify (bcrypt) trước
 *        → nếu thất bại, thử so sánh plain text (hash_equals để chống timing attack)
 *          → nếu match plain text: tự động nâng cấp lên bcrypt hash.
 * Input:  $password (string) — mật khẩu raw từ request; $user (array) — hàng từ DB.
 * Output: bool.
 * Gọi từ: login(), changePassword().
 * Lý do hỗ trợ plain text: dữ liệu cũ có thể lưu plain text, cần migration path an toàn.
 */
function verifyPassword($password, $user) {
    $stored = $user['password_hash'] ?? '';

    if (password_verify($password, $stored)) {
        return true;
    }

    // Fallback: so sánh plain text an toàn → nếu đúng thì nâng cấp hash ngay lập tức
    if (hash_equals((string)$stored, (string)$password)) {
        updateRow('users', $user['id'], [
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ]);
        return true;
    }

    return false;
}

/**
 * Stub: tính năng quên mật khẩu chưa triển khai.
 * Gọi từ: auth.php handleAuth() (POST /auth/forgot-password).
 */
function forgotPassword() {
    $input = requestJson();
    $email = strtolower(trim((string)($input['email'] ?? '')));

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'Vui long nhap email hop le'], 400);
    }

    $user = queryOne("SELECT id, email, first_name, last_name, is_active FROM users WHERE email = ? LIMIT 1", [$email]);
    if (!$user || !(int)$user['is_active']) {
        jsonResponse([
            'success' => true,
            'message' => 'Neu email ton tai, ma OTP dat lai mat khau se duoc gui den email nay',
            'data' => ['requires_otp' => true, 'email_sent' => false],
        ]);
    }

    sendPasswordResetOtp($user);
}

function forgotPasswordLegacy() {
    jsonResponse(['success' => true, 'message' => 'Chức năng quên mật khẩu chưa được triển khai']);
}

/**
 * Stub: tính năng đặt lại mật khẩu chưa triển khai.
 * Gọi từ: auth.php handleAuth() (POST /auth/reset-password).
 */
function resetPassword() {
    ensurePasswordResetOtpTable();
    $input = requestJson();
    $email = strtolower(trim((string)($input['email'] ?? '')));
    $otpCode = trim((string)($input['otp_code'] ?? ''));
    $newPassword = (string)($input['new_password'] ?? '');
    $confirmPassword = (string)($input['confirm_password'] ?? '');

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'Vui long nhap email hop le'], 400);
    }

    if (!preg_match('/^\d{6}$/', $otpCode)) {
        jsonResponse(['success' => false, 'message' => 'Vui long nhap ma OTP gom 6 chu so'], 400);
    }

    if (!$newPassword || !$confirmPassword) {
        jsonResponse(['success' => false, 'message' => 'Vui long nhap mat khau moi'], 400);
    }

    if ($newPassword !== $confirmPassword) {
        jsonResponse(['success' => false, 'message' => 'Mat khau xac nhan khong khop'], 400);
    }

    if (strlen($newPassword) < 6) {
        jsonResponse(['success' => false, 'message' => 'Mat khau moi phai co it nhat 6 ky tu'], 400);
    }

    $user = queryOne("SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1", [$email]);
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Ma OTP khong dung hoac da het han'], 400);
    }

    $record = queryOne(
        "SELECT * FROM password_reset_otps
         WHERE user_id = ?
           AND email = ?
           AND otp_code = ?
           AND used_at IS NULL
           AND expires_at > NOW()
         ORDER BY id DESC LIMIT 1",
        [$user['id'], $email, $otpCode]
    );

    if (!$record) {
        jsonResponse(['success' => false, 'message' => 'Ma OTP khong dung hoac da het han'], 400);
    }

    updateRow('users', $user['id'], [
        'password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        'email_verified' => 1,
    ]);
    executeSql("DELETE FROM password_reset_otps WHERE user_id = ?", [$user['id']]);

    jsonResponse(['success' => true, 'message' => 'Da dat lai mat khau. Vui long dang nhap lai.']);
}

function resetPasswordLegacy() {
    jsonResponse(['success' => true, 'message' => 'Chức năng đặt lại mật khẩu chưa được triển khai']);
}

/**
 * Lấy thông tin user đang đăng nhập.
 * Input:  Authorization header (JWT).
 * Output: jsonResponse {user} hoặc 401 nếu chưa đăng nhập.
 * Gọi từ: auth.php handleAuth() (GET /auth/me).
 */
function getMe() {
    $user = requireUser();
    jsonResponse(['success' => true, 'data' => ['user' => $user]]);
}

/**
 * Cập nhật hồ sơ cá nhân của user đang đăng nhập.
 * Luồng: requireUser() → filterInput() lọc chỉ cho phép cập nhật các trường an toàn
 *        → updateRow() → query lại từ DB → trả user đã cập nhật.
 * Input:  Authorization header; JSON body {first_name?, last_name?, phone?, avatar_url?}.
 * Output: jsonResponse {user} đã cập nhật.
 * Gọi từ: auth.php handleAuth() (PUT /auth/me).
 * Lý do filterInput: ngăn mass assignment — user không được tự đổi role, email, is_active, ...
 */
function updateMe() {
    $user = requireUser();
    $input = requestJson();
    // filterInput đảm bảo chỉ các trường được liệt kê mới được cập nhật
    $data = filterInput($input, ['first_name', 'last_name', 'phone', 'avatar_url']);
    updateRow('users', $user['id'], $data);
    $updated = queryOne("SELECT id, ugid, email, first_name, last_name, phone, role, avatar_url FROM users WHERE id = ?", [$user['id']]);
    jsonResponse(['success' => true, 'message' => 'Đã cập nhật hồ sơ', 'data' => ['user' => $updated]]);
}

/**
 * Đổi mật khẩu cho user đang đăng nhập.
 * Luồng: requireUser() → validate new_password + confirm → kiểm tra độ dài
 *        → query user đầy đủ từ DB → nếu đã có password: xác minh current_password
 *          → kiểm tra new_password khác old → hash và lưu.
 * Input:  Authorization header; JSON body {current_password, new_password, confirm_password}.
 * Output: jsonResponse {success} hoặc lỗi 400.
 * Gọi từ: auth.php handleAuth() (PUT /auth/password).
 * Lý do cho phép không cần current_password khi hasPassword = false:
 *   User đăng nhập qua Google lần đầu chưa có password_hash → cho phép đặt mật khẩu mới.
 */
function uploadAvatar() {
    $user = requireUser();

    if (empty($_FILES['avatar']) || !is_uploaded_file($_FILES['avatar']['tmp_name'])) {
        jsonResponse(['success' => false, 'message' => 'Vui lòng chọn ảnh đại diện'], 400);
    }

    $file = $_FILES['avatar'];
    $maxSize = 5 * 1024 * 1024;
    if (($file['size'] ?? 0) > $maxSize) {
        jsonResponse(['success' => false, 'message' => 'Ảnh đại diện không được vượt quá 5MB'], 400);
    }

    $extension = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
        jsonResponse(['success' => false, 'message' => 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP'], 400);
    }

    $imageInfo = @getimagesize($file['tmp_name']);
    if (!$imageInfo || !str_starts_with((string)$imageInfo['mime'], 'image/')) {
        jsonResponse(['success' => false, 'message' => 'File tải lên không phải ảnh hợp lệ'], 400);
    }

    $root = dirname(__DIR__, 5);
    $relativeDir = 'images/avatars';
    $targets = [
        $root . DIRECTORY_SEPARATOR . 'admin-panel' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . $relativeDir,
        $root . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . $relativeDir,
    ];

    foreach ($targets as $targetDir) {
        if (!is_dir($targetDir) && !@mkdir($targetDir, 0775, true)) {
            jsonResponse(['success' => false, 'message' => 'Không thể tạo thư mục lưu avatar'], 500);
        }
        $keepFile = $targetDir . DIRECTORY_SEPARATOR . '.gitkeep';
        if (!file_exists($keepFile)) {
            @file_put_contents($keepFile, '');
        }
    }

    $baseName = strtolower(pathinfo($file['name'] ?? 'avatar', PATHINFO_FILENAME));
    $baseName = preg_replace('/[^a-z0-9]+/i', '-', $baseName);
    $baseName = trim($baseName, '-');
    if ($baseName === '') {
        $baseName = 'avatar';
    }
    $fileName = 'avatar-' . (int)$user['id'] . '-' . $baseName . '-' . date('YmdHis') . '.' . $extension;
    $adminTarget = $targets[0] . DIRECTORY_SEPARATOR . $fileName;
    $frontendTarget = $targets[1] . DIRECTORY_SEPARATOR . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $adminTarget)) {
        jsonResponse(['success' => false, 'message' => 'Không thể lưu ảnh đại diện'], 500);
    }

    if (!@copy($adminTarget, $frontendTarget)) {
        @unlink($adminTarget);
        jsonResponse(['success' => false, 'message' => 'Không thể đồng bộ ảnh đại diện'], 500);
    }

    $avatarUrl = '/' . str_replace('\\', '/', $relativeDir . '/' . $fileName);
    updateRow('users', $user['id'], ['avatar_url' => $avatarUrl]);
    $updated = queryOne("SELECT id, ugid, email, first_name, last_name, phone, role, avatar_url FROM users WHERE id = ?", [$user['id']]);

    jsonResponse([
        'success' => true,
        'message' => 'Đã tải ảnh đại diện',
        'data' => [
            'image_url' => $avatarUrl,
            'user' => $updated,
        ],
    ]);
}

function changePassword() {
    $user = requireUser();
    $input = requestJson();
    $currentPassword = $input['current_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    $confirmPassword = $input['confirm_password'] ?? '';

    if (!$newPassword || !$confirmPassword) {
        jsonResponse(['success' => false, 'message' => 'Vui lòng nhập mật khẩu mới'], 400);
    }

    if ($newPassword !== $confirmPassword) {
        jsonResponse(['success' => false, 'message' => 'Mật khẩu xác nhận không khớp'], 400);
    }

    if (strlen($newPassword) < 6) {
        jsonResponse(['success' => false, 'message' => 'Mật khẩu mới phải có ít nhất 6 ký tự'], 400);
    }

    // Query lại để có password_hash đầy đủ — currentUser() không lấy trường này vì lý do bảo mật
    $fullUser = queryOne("SELECT * FROM users WHERE id = ?", [$user['id']]);
    if (!$fullUser) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy tài khoản'], 404);
    }

    $hasPassword = !empty($fullUser['password_hash']);
    // Chỉ yêu cầu current_password nếu user đã từng đặt password (không áp dụng với Google-only user)
    if ($hasPassword && (!$currentPassword || !verifyPassword($currentPassword, $fullUser))) {
        jsonResponse(['success' => false, 'message' => 'Mật khẩu hiện cũ không đúng'], 400);
    }

    // Ngăn đặt mật khẩu mới trùng với mật khẩu cũ
    if ($hasPassword && verifyPassword($newPassword, $fullUser)) {
        jsonResponse(['success' => false, 'message' => 'Mật khẩu mới không được trùng mật khẩu hiện cũ'], 400);
    }

    updateRow('users', $user['id'], [
        'password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
    ]);

    jsonResponse(['success' => true, 'message' => 'Đã đổi mật khẩu']);
}

/**
 * Xử lý đăng nhập Google OAuth.
 * Luồng Google credential → JWT nội bộ:
 *   1. Frontend nhận credential (JWT) từ Google Sign-In SDK
 *   2. POST /auth/google {credential}
 *   3. verifyGoogleCredential() gọi https://oauth2.googleapis.com/tokeninfo?id_token=...
 *      → Google xác thực chữ ký và trả payload {sub, email, name, picture, email_verified, aud}
 *   4. Kiểm tra aud khớp GOOGLE_CLIENT_ID (nếu có cấu hình)
 *   5. Tìm user theo google_id hoặc email:
 *      - Đã có → cập nhật google_id và avatar nếu thiếu
 *      - Chưa có → tạo mới với password_hash = NULL (Google-only account)
 *   6. mergeSessionCartIntoUser() — merge giỏ hàng ẩn danh
 *   7. generateToken() → trả JWT nội bộ về frontend
 * Input:  JSON body {credential (string — Google JWT)}.
 * Output: jsonResponse {user, token} hoặc 400/401/403.
 * Gọi từ: auth.php handleAuth() (POST /auth/google).
 */
function googleLogin() {
    $input = requestJson();
    $credential = $input['credential'] ?? '';

    if (!$credential) {
        jsonResponse(['success' => false, 'message' => 'Thiếu thông tin đăng nhập Google'], 400);
    }

    $googleUser = verifyGoogleCredential($credential);
    if (!$googleUser) {
        jsonResponse(['success' => false, 'message' => 'Không thể xác thực tài khoản Google'], 401);
    }

    $email = strtolower(trim($googleUser['email'] ?? ''));
    $googleId = $googleUser['sub'] ?? '';
    if (!$email || !$googleId) {
        jsonResponse(['success' => false, 'message' => 'Tài khoản Google không có email hợp lệ'], 400);
    }

    // Tìm user theo google_id trước (chính xác hơn), fallback sang email (cho user đã đăng ký trước)
    $user = queryOne("SELECT * FROM users WHERE google_id = ? OR email = ? LIMIT 1", [$googleId, $email]);

    if ($user && !(int)$user['is_active']) {
        jsonResponse(['success' => false, 'message' => 'Tài khoản đã bị khóa'], 403);
    }

    if ($user) {
        // Cập nhật google_id (trường hợp user đã đăng ký bằng email, giờ dùng Google lần đầu)
        $updateData = [
            'google_id' => $googleId,
            'email_verified' => 1,
        ];
        // Chỉ cập nhật avatar nếu user chưa có — không ghi đè avatar người dùng tự đặt
        if (empty($user['avatar_url']) && !empty($googleUser['picture'])) {
            $updateData['avatar_url'] = $googleUser['picture'];
        }
        updateRow('users', $user['id'], $updateData);
        $userId = (int)$user['id'];
    } else {
        // Tạo user mới từ thông tin Google — password_hash = NULL vì không có mật khẩu thường
        $nameParts = splitGoogleName($googleUser['name'] ?? '');
        $userId = insertRow('users', [
            'ugid' => uniqid('google-', true),
            'email' => $email,
            'password_hash' => null,
            'first_name' => $googleUser['given_name'] ?? $nameParts['first_name'],
            'last_name' => $googleUser['family_name'] ?? $nameParts['last_name'],
            'avatar_url' => $googleUser['picture'] ?? null,
            'role' => 'customer',
            'is_active' => 1,
            'email_verified' => 1,
            'google_id' => $googleId,
        ]);
    }

    // Merge giỏ hàng ẩn danh (session) vào tài khoản user vừa đăng nhập
    mergeSessionCartIntoUser($userId);

    $userData = queryOne("SELECT id, ugid, email, first_name, last_name, phone, role, avatar_url FROM users WHERE id = ?", [$userId]);
    $token = generateToken($userId);

    jsonResponse(['success' => true, 'message' => 'Đăng nhập Google thành công', 'data' => ['user' => $userData, 'token' => $token]]);
}

/**
 * Xác thực Google credential JWT bằng cách gọi Google tokeninfo API.
 * Luồng: gọi HTTPS GET oauth2.googleapis.com/tokeninfo?id_token=<credential>
 *        → parse JSON response → kiểm tra sub + email + email_verified + aud.
 * Input:  $credential (string) — Google ID token JWT.
 * Output: array payload Google (sub, email, name, picture, ...) hoặc null nếu không hợp lệ.
 * Gọi từ: googleLogin().
 * Lý do dùng tokeninfo API thay vì verify locally: đơn giản hơn, không cần Google public key.
 *   Nhược điểm: thêm 1 HTTP call → latency tăng khoảng 200-500ms mỗi lần đăng nhập Google.
 */
function verifyGoogleCredential($credential) {
    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential);
    $body = null;

    if (function_exists('curl_init')) {
        // Dùng cURL nếu có — kiểm soát timeout tốt hơn, tránh hang request
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $body = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        if ($status !== 200) {
            return null;
        }
    } else {
        // Fallback sang file_get_contents nếu cURL không có (ít phổ biến trong production)
        $body = @file_get_contents($url);
    }

    $payload = $body ? json_decode($body, true) : null;
    if (!$payload || empty($payload['sub']) || empty($payload['email'])) {
        return null;
    }

    // Xác minh aud (audience) để đảm bảo token được tạo cho đúng ứng dụng này
    // Nếu không có GOOGLE_CLIENT_ID cấu hình → bỏ qua kiểm tra (kém bảo mật hơn nhưng vẫn chạy)
    $configuredClientId = getenv('GOOGLE_CLIENT_ID') ?: getenv('VITE_GOOGLE_CLIENT_ID') ?: '';
    if ($configuredClientId && ($payload['aud'] ?? '') !== $configuredClientId) {
        return null;
    }

    // Chỉ chấp nhận tài khoản đã xác minh email — tránh tạo user từ tài khoản Google chưa verify
    if (($payload['email_verified'] ?? 'false') !== 'true' && ($payload['email_verified'] ?? false) !== true) {
        return null;
    }

    return $payload;
}

/**
 * Tách họ tên từ displayName của Google (không luôn có given_name/family_name riêng).
 * Input:  $name (string) — vd: "Nguyen Van An".
 * Output: array {first_name, last_name} — first_name là từ đầu tiên, last_name là phần còn lại.
 * Gọi từ: googleLogin() khi Google không trả given_name/family_name riêng.
 */
function splitGoogleName($name) {
    $name = trim($name);
    if (!$name) {
        return ['first_name' => 'Google', 'last_name' => 'User'];
    }
    $parts = preg_split('/\s+/', $name);
    $firstName = array_shift($parts) ?: 'Google';
    return [
        'first_name' => $firstName,
        'last_name' => $parts ? implode(' ', $parts) : '',
    ];
}

/**
 * Merge giỏ hàng ẩn danh (session_id) vào tài khoản user sau khi đăng nhập/đăng ký Google.
 * Luồng: đọc X-Session-Id header → query cart_items theo session_id
 *        → với mỗi item: nếu user đã có sản phẩm đó → cộng số lượng + xoá session item
 *                        nếu chưa có → gán user_id + xoá session_id.
 * Input:  $userId (int); X-Session-Id header.
 * Output: void.
 * Gọi từ: googleLogin(). Login thường có logic tương tự inline trong login().
 */
function mergeSessionCartIntoUser($userId) {
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
    if (!$sessionId) {
        return;
    }

    $sessionItems = queryAll("SELECT * FROM cart_items WHERE session_id = ?", [$sessionId]);
    foreach ($sessionItems as $item) {
        $existing = queryOne(
            "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
            [$userId, $item['product_id']]
        );
        if ($existing) {
            // Cộng số lượng từ session cart vào user cart, rồi xoá hàng session
            executeSql(
                "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
                [$item['quantity'], $existing['id']]
            );
            executeSql("DELETE FROM cart_items WHERE id = ?", [$item['id']]);
        } else {
            // Chuyển quyền sở hữu từ session sang user — đặt session_id = NULL
            executeSql(
                "UPDATE cart_items SET user_id = ?, session_id = NULL WHERE id = ?",
                [$userId, $item['id']]
            );
        }
    }
}
?>

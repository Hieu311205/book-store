<?php
/**
 * OTP API — xác nhận thanh toán chuyển khoản / thẻ ngân hàng
 *
 * LUỒNG TỔNG QUÁT:
 *   [1] Người dùng chọn "Chuyển khoản" → nhấn "Đặt hàng"
 *   [2] Frontend gọi  POST /api/v1/otp/send          → sendOtpEmail()
 *   [3] Backend tạo mã 6 số, lưu vào bảng order_otps, gửi email
 *   [4] Frontend hiển thị modal nhập mã
 *   [5] Người dùng nhập mã → nhấn "Xác nhận & Đặt hàng"
 *   [6] Frontend gọi  POST /api/v1/orders  (kèm otp_code)
 *   [7] orders.php gọi verifyOrderOtp() trong file này để kiểm tra mã
 *   [8] Nếu mã đúng + còn hạn → đánh dấu đã dùng → tạo đơn hàng
 */

require_once __DIR__ . '/../../lib/GmailSmtp.php';

// ─── Router ──────────────────────────────────────────────────────────────────
// Điểm vào từ index.php: case 'otp' → handleOtp()
function handleOtp(string $method, array $pathParts): void {
    // Yêu cầu đăng nhập — trả 401 nếu không có JWT hợp lệ
    $user = requireUser();

    $action = $pathParts[1] ?? ''; // lấy phần sau /otp/...

    if ($method === 'POST' && $action === 'send') {
        // BƯỚC 2: frontend gọi endpoint này để yêu cầu gửi OTP
        sendOtpEmail($user);
    } else {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy thao tác'], 404);
    }
}

// ─── Tạo bảng nếu chưa tồn tại ───────────────────────────────────────────────
// Được gọi mỗi lần sendOtpEmail() chạy; MySQL bỏ qua nếu bảng đã có
function ensureOtpTable(): void {
    executeSql("CREATE TABLE IF NOT EXISTS order_otps (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        otp_code   VARCHAR(6)  NOT NULL,          -- mã 6 chữ số, có thể có số 0 đầu
        purpose    VARCHAR(50) DEFAULT 'bank_transfer',
        expires_at DATETIME    NOT NULL,           -- thời điểm hết hạn (dùng NOW() của MySQL)
        used_at    DATETIME    NULL,               -- NULL = chưa dùng; NOT NULL = đã dùng/vô hiệu
        created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

// ─── BƯỚC 2-3: Tạo và gửi OTP ────────────────────────────────────────────────
function sendOtpEmail(array $user): void {
    ensureOtpTable();
    $input = requestJson();
    $purpose = $input['purpose'] ?? 'card';
    if (!in_array($purpose, ['card', 'wallet', 'wallet_deposit', 'wallet_withdraw'], true)) {
        jsonResponse(['success' => false, 'message' => 'Muc dich OTP khong hop le'], 400);
    }

    executeSql("DELETE FROM order_otps WHERE expires_at <= NOW() OR used_at IS NOT NULL");

    // Giới hạn tốc độ: tối đa 3 lần gửi trong 10 phút
    // Ngăn người dùng spam endpoint để brute-force mã
    $recent = queryOne(
        "SELECT COUNT(*) AS cnt FROM order_otps
         WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)",
        [$user['id']]
    );
    if ((int)($recent['cnt'] ?? 0) >= 3) {
        jsonResponse(['success' => false, 'message' => 'Bạn đã gửi OTP quá nhiều lần. Vui lòng thử lại sau 10 phút.'], 429);
    }

    // Xóa các OTP cũ chưa dùng của user này trước khi tạo mới
    // Đảm bảo chỉ có 1 mã hợp lệ tại một thời điểm
    executeSql("DELETE FROM order_otps WHERE user_id = ? AND used_at IS NULL", [$user['id']]);

    // Tạo mã ngẫu nhiên 6 chữ số (000000 – 999999), giữ số 0 đầu bằng str_pad
    $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    // Lưu OTP vào DB.
    // QUAN TRỌNG: expires_at dùng DATE_ADD(NOW()...) của MySQL, KHÔNG dùng date() của PHP
    // vì PHP chạy UTC còn MySQL chạy UTC+7 → lệch 7 tiếng → OTP bị coi là hết hạn ngay.
    executeSql(
        "INSERT INTO order_otps (user_id, otp_code, purpose, expires_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))",
        [$user['id'], $otp, $purpose]
    );

    // Chuẩn bị nội dung email
    $toEmail = $user['email'];
    $toName  = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
    if (!$toName) $toName = $toEmail;

    $purposeLabels = [
        'card' => 'thanh toan bang the',
        'wallet' => 'thanh toan bang vi',
        'wallet_deposit' => 'nap tien vao vi',
        'wallet_withdraw' => 'rut tien tu vi',
    ];
    $purposeLabel = $purposeLabels[$purpose] ?? 'giao dich';
    $subject = 'Ma OTP xac nhan ' . $purposeLabel . ' - Book Store';
    $body    = "Xin chào {$toName},\r\n\r\n"
             . "Ma OTP xac nhan {$purposeLabel} cua ban la:\r\n\r\n"
             . "    {$otp}\r\n\r\n"
             . "Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.\r\n\r\n"
             . "Nếu bạn không thực hiện giao dịch này, hãy bỏ qua email này.\r\n\r\n"
             . "Trân trọng,\r\nBook Store";

    // Đọc thông tin SMTP từ development.env (đã được config.php load vào putenv)
    $mailUser = getenv('MAIL_USER');
    $mailPass = str_replace(' ', '', getenv('MAIL_PASS') ?: ''); // App Password không có khoảng trắng

    $emailSent = false;
    $errorMsg  = null;

    if ($mailUser && $mailPass && $mailUser !== 'your-gmail@gmail.com') {
        // Gửi qua Gmail SMTP (TLS port 587) — xem src/lib/GmailSmtp.php
        try {
            $mailer = new GmailSmtp($mailUser, $mailPass);
            $mailer->send($toEmail, $toName, $subject, $body);
            $emailSent = true;
        } catch (\Throwable $e) {
            $errorMsg = $e->getMessage();
            error_log("[OTP][SMTP Error] " . $errorMsg);
        }
    } else {
        $errorMsg = 'MAIL_USER / MAIL_PASS chưa được cấu hình trong development.env';
    }

    // Luôn ghi log để dev có thể kiểm tra OTP qua error_log khi email chưa cấu hình
    error_log("[OTP] user={$user['id']} email={$toEmail} otp={$otp} sent=" . ($emailSent ? 'yes' : 'no'));

    // Trả về kết quả cho frontend (BƯỚC 3 → 4)
    // dev_otp chỉ trả về khi email gửi thất bại để tester có thể nhập thủ công
    jsonResponse([
        'success'    => true,
        'message'    => $emailSent
            ? "Mã OTP đã được gửi đến {$toEmail}"
            : "Gửi email thất bại — xem mã trong hộp màu vàng (dev mode)",
        'email_sent' => $emailSent,
        'dev_otp'    => (!$emailSent ? $otp : null),
        'dev_error'  => (!$emailSent ? $errorMsg : null),
    ]);
}

// ─── BƯỚC 7: Xác minh OTP khi tạo đơn hàng ───────────────────────────────────
// Được gọi BỞI orders.php (không phải từ router), ngay trước khi INSERT đơn hàng.
// Nếu mã sai hoặc hết hạn → jsonResponse 400 → dừng luồng, đơn hàng KHÔNG được tạo.
function verifyOrderOtp(int $userId, string $otpCode, string $purpose): void {
    // Không có mã trong request → từ chối ngay
    if (!$otpCode) {
        jsonResponse(['success' => false, 'message' => 'Vui lòng nhập mã OTP xác nhận thanh toán'], 400);
    }

    // Bảng chưa tồn tại = OTP chưa được gửi lần nào → từ chối
    if (!tableExists('order_otps')) {
        jsonResponse(['success' => false, 'message' => 'Mã OTP không hợp lệ hoặc đã hết hạn'], 400);
    }

    // Tìm bản ghi khớp: đúng user, đúng mã, chưa dùng, còn trong hạn
    // expires_at > NOW() — cả hai đều dùng đồng hồ MySQL nên không bị lệch múi giờ
    $record = queryOne(
        "SELECT * FROM order_otps
         WHERE user_id  = ?
           AND otp_code = ?
           AND purpose  = ?
           AND used_at  IS NULL
           AND expires_at > NOW()
         ORDER BY id DESC LIMIT 1",
        [$userId, $otpCode, $purpose]
    );

    if (!$record) {
        // Sai mã hoặc đã hết hạn — dùng cùng một thông báo để tránh lộ lý do cụ thể
        jsonResponse(['success' => false, 'message' => 'Mã OTP không đúng hoặc đã hết hạn'], 400);
    }

    // Xoa ma ngay sau khi xac minh thanh cong de khong luu OTP sau giao dich.
    executeSql("DELETE FROM order_otps WHERE id = ?", [$record['id']]);

    // Hàm kết thúc bình thường (không trả gì) → orders.php tiếp tục tạo đơn hàng (BƯỚC 8b)
}
?>

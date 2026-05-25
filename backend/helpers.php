<?php
/**
 * THƯ VIỆN HÀM DÙNG CHUNG — helpers.php
 *
 * Vị trí trong kiến trúc:
 *   database.php  →  helpers.php  →  mọi route/controller
 *
 * Luồng dữ liệu tổng thể:
 *   helpers.php require_once database.php → có biến $pdo global.
 *   Tất cả route (cart, wallet, auth, ...) đều require helpers.php (qua index.php).
 *   Các hàm ở đây là lớp trừu tượng mỏng giữa controller logic và PDO/MySQL.
 *
 * Nhóm chức năng:
 *   - HTTP I/O:       jsonResponse, requestJson
 *   - Auth/JWT:       base64UrlDecode, getBearerToken, currentUser, requireUser
 *   - CRUD chung:     insertRow, updateRow, queryOne, queryAll, executeSql
 *   - Schema check:   tableExists, tableHasColumn
 *   - Ví điện tử:     getOrCreateWallet, creditWallet, debitWallet,
 *                     addWalletTransaction, getUserBankAccount, getDefaultBankAccount
 *   - Tiện ích:       filterInput, slugifyText, normalizeBool
 */
require_once __DIR__ . '/database.php';

/**
 * Trả về JSON response và kết thúc script ngay lập tức.
 * Input:  $payload (array) — dữ liệu cần trả về; $status (int) — HTTP status code (mặc định 200).
 * Output: JSON string ra stdout, exit.
 * Gọi từ: mọi route/controller sau khi xử lý xong.
 */
function jsonResponse($payload, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Đọc body của HTTP request và giải mã JSON thành mảng PHP.
 * Input:  php://input (raw request body).
 * Output: array — dữ liệu đã decode; [] nếu body trống hoặc không hợp lệ.
 * Gọi từ: mọi handler cần đọc dữ liệu POST/PUT (cartAdd, login, register, ...).
 */
function requestJson() {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Giải mã chuỗi Base64 URL-safe (dùng trong JWT).
 * Input:  $data (string) — chuỗi base64url.
 * Output: string — dữ liệu binary đã decode.
 * Gọi từ: currentUser() khi giải mã JWT payload.
 */
function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Lấy Bearer token từ header Authorization.
 * Input:  HTTP_AUTHORIZATION header.
 * Output: string|null — token nếu có, null nếu không có hoặc sai định dạng.
 * Gọi từ: currentUser().
 */
function getBearerToken() {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (stripos($header, 'Bearer ') === 0) {
        return trim(substr($header, 7));
    }
    return null;
}

/**
 * Xác thực JWT và trả về thông tin user hiện tại.
 * Luồng: Authorization header → tách JWT → xác minh chữ ký HMAC-SHA256
 *        → giải mã payload → kiểm tra exp → query DB lấy user → kiểm tra is_active.
 * Input:  không trực tiếp — đọc Authorization header và $config['jwt']['secret'].
 * Output: array user (id, ugid, email, ...) nếu hợp lệ; null nếu không có/hết hạn/bị khoá.
 * Gọi từ: requireUser(), và trực tiếp từ các handler không bắt buộc đăng nhập (vd: cart).
 */
function currentUser() {
    global $pdo, $config;

    $token = getBearerToken();
    if (!$token) {
        return null;
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$header, $payload, $signature] = $parts;
    // Tái tạo chữ ký từ header.payload + secret → so sánh với chữ ký trong token
    // Dùng hash_equals để chống timing attack
    $expected = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(
        hash_hmac('sha256', "$header.$payload", $config['jwt']['secret'], true)
    ));

    if (!hash_equals($expected, $signature)) {
        return null;
    }

    $decoded = json_decode(base64UrlDecode($payload), true);
    // Kiểm tra exp (expiry) — token hết hạn sau 7 ngày (xem generateToken)
    if (!$decoded || (($decoded['exp'] ?? 0) < time())) {
        return null;
    }

    // Query lại DB để đảm bảo user vẫn tồn tại và chưa bị khoá (is_active = 1)
    // Không chỉ tin vào payload JWT vì user có thể bị admin vô hiệu hoá
    $stmt = $pdo->prepare("SELECT id, ugid, email, first_name, last_name, phone, role, avatar_url, is_active FROM users WHERE id = ?");
    $stmt->execute([$decoded['userId']]);
    $user = $stmt->fetch();
    return $user && (int)$user['is_active'] === 1 ? $user : null;
}

/**
 * Yêu cầu user đã đăng nhập — dừng request nếu chưa xác thực.
 * Input:  không trực tiếp — gọi currentUser() bên trong.
 * Output: array user nếu hợp lệ; gọi jsonResponse 401 và exit nếu không.
 * Gọi từ: mọi handler cần bảo vệ (wallet, orders, updateMe, changePassword, ...).
 */
function requireUser() {
    $user = currentUser();
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Bạn cần đăng nhập'], 401);
    }
    return $user;
}

/**
 * Thực thi truy vấn SELECT và trả về tất cả hàng.
 * Input:  $sql (string) — câu SQL với placeholders '?'; $params (array) — giá trị bind.
 * Output: array of arrays — mảng các hàng kết quả (FETCH_ASSOC).
 * Gọi từ: khắp nơi — cart, wallet, admin, orders, ...
 */
function queryAll($sql, $params = []) {
    global $pdo;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/**
 * Thực thi truy vấn SELECT và trả về đúng một hàng đầu tiên.
 * Input:  $sql (string); $params (array).
 * Output: array (một hàng) hoặc null nếu không tìm thấy.
 * Gọi từ: kiểm tra tồn tại (user, product, cart_item, ...) và lấy single record.
 */
function queryOne($sql, $params = []) {
    global $pdo;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * Thực thi câu SQL không trả dữ liệu (INSERT/UPDATE/DELETE).
 * Input:  $sql (string); $params (array).
 * Output: bool — true nếu thành công.
 * Gọi từ: updateRow, creditWallet, debitWallet, cartUpdate, cartRemove, ...
 */
function executeSql($sql, $params = []) {
    global $pdo;
    $stmt = $pdo->prepare($sql);
    return $stmt->execute($params);
}

/**
 * Chèn một hàng mới vào bảng và trả về ID vừa tạo.
 * Input:  $table (string) — tên bảng; $data (array) — ['cột' => 'giá trị', ...].
 * Output: int — lastInsertId.
 * Gọi từ: register (users), cartAdd (cart_items), depositWallet (wallet_transactions), ...
 * Lưu ý: tên bảng không được escape — chỉ dùng với tên bảng tin cậy (không từ user input).
 */
function insertRow($table, $data) {
    global $pdo;
    $columns = array_keys($data);
    $names = implode(', ', $columns);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $sql = "INSERT INTO {$table} ({$names}) VALUES ({$placeholders})";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_values($data));
    return (int)$pdo->lastInsertId();
}

/**
 * Cập nhật một hàng trong bảng dựa theo id.
 * Input:  $table (string); $id (int) — giá trị cột id; $data (array) — ['cột' => giá_trị].
 * Output: void. Nếu $data rỗng → không làm gì (tránh SQL lỗi).
 * Gọi từ: updateMe, changePassword, googleLogin (cập nhật google_id), ...
 */
function updateRow($table, $id, $data) {
    if (!$data) {
        return;
    }
    $sets = implode(', ', array_map(fn($column) => "$column = ?", array_keys($data)));
    $params = array_values($data);
    $params[] = $id;
    executeSql("UPDATE {$table} SET {$sets} WHERE id = ?", $params);
}

/**
 * Kiểm tra xem bảng có tồn tại cột hay không — kết quả được cache trong memory.
 * Input:  $table (string); $column (string).
 * Output: bool.
 * Gọi từ: các hàm cần tương thích backward khi schema DB có thể chưa migrate đầy đủ.
 * Lý do cache: tránh query information_schema nhiều lần trong cùng một request.
 */
function tableHasColumn($table, $column) {
    static $cache = [];
    $key = "{$table}.{$column}";
    if (!array_key_exists($key, $cache)) {
        $cache[$key] = (bool)queryOne(
            "SELECT 1 FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
            [$table, $column]
        );
    }
    return $cache[$key];
}

/**
 * Kiểm tra xem bảng có tồn tại trong DB hay không — kết quả được cache.
 * Input:  $table (string).
 * Output: bool.
 * Gọi từ: wallet.php, helpers.php — kiểm tra trước khi thao tác với bảng wallet/wallet_transactions/user_bank_accounts.
 * Lý do: tính năng ví điện tử được thêm sau, bảng có thể chưa được migrate.
 */
function tableExists($table) {
    static $cache = [];
    if (!array_key_exists($table, $cache)) {
        $cache[$table] = (bool)queryOne(
            "SELECT 1 FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
            [$table]
        );
    }
    return $cache[$table];
}

/**
 * Lấy ví của user, tự động tạo mới nếu chưa có.
 * Input:  $userId (int).
 * Output: array wallet row hoặc null nếu bảng wallets chưa tồn tại.
 * Gọi từ: creditWallet, debitWallet, getWalletSummary, depositWallet.
 */
function getOrCreateWallet($userId) {
    if (!tableExists('wallets')) {
        return null;
    }
    $wallet = queryOne("SELECT * FROM wallets WHERE user_id = ?", [$userId]);
    if ($wallet) {
        return $wallet;
    }
    // Tạo ví mới với số dư 0 — chỉ xảy ra lần đầu tiên user dùng tính năng ví
    $walletId = insertRow('wallets', [
        'user_id' => $userId,
        'balance' => 0,
    ]);
    return queryOne("SELECT * FROM wallets WHERE id = ?", [$walletId]);
}

/**
 * Ghi nhận một giao dịch ví (không thay đổi số dư trực tiếp).
 * Input:  $userId, $amount, $type ('credit'|'debit'), $description, $referenceType, $referenceId,
 *         $status ('pending'|'completed'), $bankData (array thông tin ngân hàng tùy chọn).
 * Output: int|null — ID giao dịch vừa tạo, hoặc null nếu bảng chưa tồn tại.
 * Gọi từ: không dùng trực tiếp trong luồng chính — creditWallet/debitWallet có transaction riêng.
 * Lưu ý: hàm này KHÔNG cập nhật balance wallet — chỉ insert lịch sử giao dịch.
 */
function addWalletTransaction($userId, $amount, $type, $description, $referenceType = null, $referenceId = null, $status = 'completed', $bankData = []) {
    if (!tableExists('wallets') || !tableExists('wallet_transactions')) {
        return null;
    }
    $wallet = getOrCreateWallet($userId);
    if (!$wallet) {
        return null;
    }
    return insertRow('wallet_transactions', [
        'wallet_id' => $wallet['id'],
        'user_id' => $userId,
        'type' => $type,
        'amount' => $amount,
        'status' => $status,
        'description' => $description,
        'reference_type' => $referenceType,
        'reference_id' => $referenceId,
        'bank_name' => $bankData['bank_name'] ?? null,
        'bank_account_number' => $bankData['bank_account_number'] ?? null,
        'bank_account_name' => $bankData['bank_account_name'] ?? null,
    ]);
}

/**
 * Cộng tiền vào ví user (credit) trong một transaction nguyên tử.
 * Luồng: BEGIN → SELECT FOR UPDATE (khoá hàng) → UPDATE balance + amount → INSERT transaction → COMMIT.
 * Input:  $userId (int); $amount (float > 0); $description (string); $referenceType, $referenceId (tùy chọn);
 *         $bankData (array thông tin ngân hàng tùy chọn).
 * Output: bool — true nếu thành công, ném exception nếu lỗi.
 * Gọi từ: admin khi duyệt yêu cầu nạp tiền (admin.php).
 * Lý do SELECT FOR UPDATE: ngăn race condition khi nhiều request cùng cộng tiền cho 1 user.
 */
function creditWallet($userId, $amount, $description, $referenceType = null, $referenceId = null, $bankData = []) {
    global $pdo;
    if ($amount <= 0 || !tableExists('wallets') || !tableExists('wallet_transactions')) {
        return false;
    }
    $startedTransaction = !$pdo->inTransaction();
    if ($startedTransaction) {
        $pdo->beginTransaction();
    }
    try {
        // SELECT FOR UPDATE — khoá hàng, chặn race condition khi nhiều request cùng lúc
        $wallet = queryOne("SELECT * FROM wallets WHERE user_id = ? FOR UPDATE", [$userId]);
        if (!$wallet) {
            executeSql("INSERT INTO wallets (user_id, balance) VALUES (?, 0)", [$userId]);
            $wallet = queryOne("SELECT * FROM wallets WHERE user_id = ?", [$userId]);
        }
        executeSql(
            "UPDATE wallets SET balance = balance + ?, updated_at = NOW() WHERE id = ?",
            [$amount, $wallet['id']]
        );
        executeSql(
            "INSERT INTO wallet_transactions
             (wallet_id, user_id, type, amount, status, description,
              reference_type, reference_id, bank_name, bank_account_number, bank_account_name)
             VALUES (?, ?, 'credit', ?, 'completed', ?, ?, ?, ?, ?, ?)",
            [
                $wallet['id'], $userId, $amount, $description,
                $referenceType, $referenceId,
                $bankData['bank_name'] ?? null,
                $bankData['bank_account_number'] ?? null,
                $bankData['bank_account_name'] ?? null,
            ]
        );
        if ($startedTransaction) {
            $pdo->commit();
        }
        return true;
    } catch (\Throwable $e) {
        if ($startedTransaction && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Trừ tiền từ ví user (debit) trong một transaction nguyên tử — có kiểm tra số dư.
 * Luồng: BEGIN → SELECT FOR UPDATE → kiểm tra balance >= amount → UPDATE balance - amount
 *        → INSERT transaction → COMMIT.
 * Input:  $userId (int); $amount (float > 0); $description (string); $referenceType, $referenceId;
 *         $status ('pending'|'completed') — pending khi rút tiền chờ admin duyệt;
 *         $bankData (array thông tin ngân hàng đích).
 * Output: bool — true nếu đủ tiền và thành công, false nếu không đủ số dư.
 * Gọi từ: withdrawWallet() trong wallet.php; orders khi thanh toán bằng ví.
 * Lý do SELECT FOR UPDATE: ngăn double-spending — nếu 2 request rút tiền cùng lúc,
 *   chỉ request đầu tiên lấy được lock, request sau sẽ thấy balance đã giảm.
 */
function debitWallet($userId, $amount, $description, $referenceType = null, $referenceId = null, $status = 'completed', $bankData = []) {
    global $pdo;
    if ($amount <= 0 || !tableExists('wallets') || !tableExists('wallet_transactions')) {
        return false;
    }
    $startedTransaction = !$pdo->inTransaction();
    if ($startedTransaction) {
        $pdo->beginTransaction();
    }
    try {
        // SELECT FOR UPDATE — khoá hàng, ngăn double-spending khi nhiều request cùng lúc
        $wallet = queryOne("SELECT * FROM wallets WHERE user_id = ? FOR UPDATE", [$userId]);
        if (!$wallet || (float)$wallet['balance'] < $amount) {
            if ($startedTransaction && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            return false;
        }
        executeSql(
            "UPDATE wallets SET balance = balance - ?, updated_at = NOW() WHERE id = ?",
            [$amount, $wallet['id']]
        );
        executeSql(
            "INSERT INTO wallet_transactions
             (wallet_id, user_id, type, amount, status, description,
              reference_type, reference_id, bank_name, bank_account_number, bank_account_name)
             VALUES (?, ?, 'debit', ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $wallet['id'], $userId, $amount, $status, $description,
                $referenceType, $referenceId,
                $bankData['bank_name'] ?? null,
                $bankData['bank_account_number'] ?? null,
                $bankData['bank_account_name'] ?? null,
            ]
        );
        if ($startedTransaction) {
            $pdo->commit();
        }
        return true;
    } catch (\Throwable $e) {
        if ($startedTransaction && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Lấy tài khoản ngân hàng mặc định (is_default = 1) của user.
 * Input:  $userId (int).
 * Output: array bank_account row hoặc null.
 * Gọi từ: getUserBankAccount() khi không truyền $bankAccountId cụ thể.
 */
function getDefaultBankAccount($userId) {
    if (!tableExists('user_bank_accounts')) {
        return null;
    }
    return queryOne(
        "SELECT * FROM user_bank_accounts
         WHERE user_id = ? AND is_active = 1
         ORDER BY is_default DESC, id DESC
         LIMIT 1",
        [$userId]
    );
}

/**
 * Lấy tài khoản ngân hàng của user theo ID cụ thể hoặc tài khoản mặc định.
 * Input:  $userId (int); $bankAccountId (int|null) — nếu null thì lấy default.
 * Output: array bank_account row hoặc null.
 * Gọi từ: depositWallet, withdrawWallet trong wallet.php.
 */
function getUserBankAccount($userId, $bankAccountId = null) {
    if (!tableExists('user_bank_accounts')) {
        return null;
    }
    if ($bankAccountId) {
        return queryOne(
            "SELECT * FROM user_bank_accounts WHERE id = ? AND user_id = ? AND is_active = 1",
            [$bankAccountId, $userId]
        );
    }
    return getDefaultBankAccount($userId);
}

/**
 * Lọc mảng input — chỉ giữ các key nằm trong $allowed và có giá trị không null.
 * Input:  $input (array) — dữ liệu từ request; $allowed (array) — danh sách key được phép.
 * Output: array — tập con an toàn của $input.
 * Gọi từ: updateMe() để chỉ cho phép cập nhật các trường nhất định, tránh mass assignment.
 */
function filterInput($input, $allowed) {
    return array_filter(
        array_intersect_key($input, array_flip($allowed)),
        fn($value) => $value !== null,
    );
}

/**
 * Chuyển đổi chuỗi văn bản thành slug URL-friendly.
 * Input:  $text (string) — vd: "Lập Trình PHP".
 * Output: string — vd: "lập-trình-php" (giữ ký tự Unicode, bỏ ký tự đặc biệt).
 * Gọi từ: tạo slug cho sản phẩm, danh mục trong products.php, categories.php.
 * Lưu ý: dùng /u flag trong regex để xử lý đúng ký tự đa byte (UTF-8/tiếng Việt).
 */
function slugifyText($text) {
    $slug = strtolower(trim($text));
    $slug = preg_replace('/\s+/', '-', $slug);
    $slug = preg_replace('/[^\p{L}\p{N}\-]+/u', '', $slug);
    return trim(preg_replace('/\-+/', '-', $slug), '-');
}

/**
 * Chuẩn hoá giá trị boolean từ nhiều định dạng khác nhau (string "true"/"false", int 0/1).
 * Input:  $value (mixed) — vd: "true", 1, "yes", false.
 * Output: int|null — 1 (true), 0 (false), hoặc null nếu $value là null.
 * Gọi từ: xử lý các trường boolean trong request body (is_active, is_featured, ...).
 */
function normalizeBool($value) {
    if ($value === null) {
        return null;
    }
    return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
}
?>

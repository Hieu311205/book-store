<?php
require_once __DIR__ . '/otp.php';
/**
 * VÍ ĐIỆN TỬ & NGÂN HÀNG LIÊN KẾT — src/api/routes/wallet.php
 *
 * Vị trí trong kiến trúc:
 *   index.php  →  handleWallet()  →  helpers.php (creditWallet/debitWallet)  →  DB (wallets, wallet_transactions, user_bank_accounts)
 *
 * Luồng dữ liệu - Nạp tiền (deposit):
 *   User gửi POST /wallet/deposit {amount, bank_account_id}
 *     → depositWallet() tạo giao dịch trạng thái 'pending' (chưa cộng số dư)
 *       → Admin thấy giao dịch pending trong bảng điều khiển
 *         → Admin duyệt → creditWallet() cộng tiền thực sự vào balance
 *           → Giao dịch chuyển sang trạng thái 'completed'
 *   Lý do: tránh user tự credit ví mà không có tiền thực vào ngân hàng admin.
 *
 * Luồng dữ liệu - Rút tiền (withdraw):
 *   User gửi POST /wallet/withdraw {amount, bank_account_id}
 *     → withdrawWallet() gọi debitWallet() (trong transaction với SELECT FOR UPDATE)
 *       → Số dư bị trừ ngay, giao dịch tạo với status = 'pending'
 *         → Admin xem xét → chuyển tiền thực → cập nhật status = 'completed'
 *   Lý do trừ ngay: đảm bảo user không thể rút quá số dư hiện có (race condition safe).
 *
 * Bảng liên quan: wallets, wallet_transactions, user_bank_accounts
 *
 * Ánh xạ endpoint → hàm:
 *   GET    /wallet                         → getWalletSummary($user)
 *   POST   /wallet/bank-accounts           → linkBankAccount($user)
 *   DELETE /wallet/bank-accounts/:id       → deleteBankAccount($user, $id)
 *   POST   /wallet/deposit                 → depositWallet($user)
 *   POST   /wallet/withdraw                → withdrawWallet($user)
 */

/**
 * Entry point cho /api/v1/wallet/*.
 * Yêu cầu đăng nhập (requireUser) cho mọi thao tác với ví.
 * Kiểm tra bảng tồn tại trước — tính năng ví có thể chưa được migrate.
 * Input:  $method (string); $pathParts (array).
 * Output: gọi hàm xử lý → jsonResponse (exit).
 * Gọi từ: index.php khi $endpoint === 'wallet'.
 */
function handleWallet($method, $pathParts) {
    // requireUser() dừng request với 401 nếu chưa đăng nhập
    $user = requireUser();
    // Kiểm tra schema trước mọi thao tác để tránh SQL error nếu chưa chạy migration
    if (!tableExists('wallets') || !tableExists('wallet_transactions')) {
        jsonResponse(['success' => false, 'message' => 'Chua tao bang vi dien tu. Vui long chay migrate_all_features.sql'], 500);
    }

    $action = $pathParts[1] ?? '';
    if ($method === 'GET' && !$action) {
        getWalletSummary($user);
    } elseif ($method === 'POST' && $action === 'bank-accounts') {
        linkBankAccount($user);
    } elseif ($method === 'DELETE' && $action === 'bank-accounts') {
        deleteBankAccount($user, $pathParts[2] ?? null);
    } elseif ($method === 'POST' && $action === 'deposit') {
        depositWallet($user);
    } elseif ($method === 'POST' && $action === 'withdraw') {
        withdrawWallet($user);
    } else {
        jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac vi'], 404);
    }
}

/**
 * Lấy thông tin ví, lịch sử giao dịch (có phân trang + lọc), và danh sách tài khoản ngân hàng.
 * Luồng: getOrCreateWallet() → build câu WHERE động theo filter → query transactions → query bank_accounts → trả JSON.
 * Input:  $user (array); query params: page, limit, search, type (credit|debit), status (pending|completed|rejected), month (YYYY-MM).
 * Output: jsonResponse {wallet, transactions[], pagination, bank_accounts[]}.
 * Gọi từ: handleWallet() (GET /wallet); cũng gọi lại sau linkBankAccount/deleteBankAccount/depositWallet/withdrawWallet để refresh UI.
 */
function getWalletSummary($user) {
    $wallet = getOrCreateWallet($user['id']);
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;
    $where = "user_id = ?";
    $params = [$user['id']];

    // Tìm kiếm full-text trên nhiều cột: description, reference_type, thông tin ngân hàng
    $search = trim((string)($_GET['search'] ?? ''));
    if ($search !== '') {
        $where .= " AND (description LIKE ? OR reference_type LIKE ? OR bank_name LIKE ? OR bank_account_number LIKE ? OR bank_account_name LIKE ?)";
        $like = '%' . $search . '%';
        array_push($params, $like, $like, $like, $like, $like);
    }

    // Lọc theo loại giao dịch: credit (nạp tiền/nhận) hoặc debit (rút tiền/chi)
    $type = $_GET['type'] ?? '';
    if (in_array($type, ['credit', 'debit'], true)) {
        $where .= " AND type = ?";
        $params[] = $type;
    }

    // Lọc theo trạng thái: pending (chờ duyệt), completed (hoàn thành), rejected (bị từ chối)
    $status = $_GET['status'] ?? '';
    if (in_array($status, ['pending', 'completed', 'rejected'], true)) {
        $where .= " AND status = ?";
        $params[] = $status;
    }

    // Lọc theo tháng — format YYYY-MM để dễ chọn từ month-picker trên frontend
    $month = trim((string)($_GET['month'] ?? ''));
    if (preg_match('/^\d{4}-\d{2}$/', $month)) {
        $startDate = $month . '-01 00:00:00';
        $endDate = date('Y-m-d H:i:s', strtotime($startDate . ' +1 month'));
        $where .= " AND created_at >= ? AND created_at < ?";
        array_push($params, $startDate, $endDate);
    }

    // Đếm tổng số giao dịch để phục vụ phân trang
    $count = (int)(queryOne("SELECT COUNT(*) AS count FROM wallet_transactions WHERE {$where}", $params)['count'] ?? 0);
    $transactions = queryAll(
        "SELECT * FROM wallet_transactions WHERE {$where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        array_merge($params, [$limit, $offset])
    );
    $bankAccounts = tableExists('user_bank_accounts')
        ? queryAll("SELECT * FROM user_bank_accounts WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC, id DESC", [$user['id']])
        : [];
    jsonResponse(['success' => true, 'data' => [
        'wallet' => $wallet,
        'transactions' => $transactions,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'totalItems' => $count,
            'totalPages' => (int)ceil($count / $limit),
        ],
        'bank_accounts' => $bankAccounts,
    ]]);
}

/**
 * Liên kết tài khoản ngân hàng mới cho user.
 * Luồng: validate input → kiểm tra đã có tài khoản active chưa
 *        → INSERT vào user_bank_accounts (is_default = 1 nếu chưa có tài khoản nào) → refresh wallet summary.
 * Input:  $user (array); JSON body {bank_name, bank_account_number, bank_account_name}.
 * Output: jsonResponse wallet summary đầy đủ (qua getWalletSummary()).
 * Gọi từ: handleWallet() (POST /wallet/bank-accounts).
 * Lý do is_default logic: tài khoản đầu tiên của user tự động là mặc định.
 */
function linkBankAccount($user) {
    if (!tableExists('user_bank_accounts')) {
        jsonResponse(['success' => false, 'message' => 'Chua tao bang tai khoan ngan hang. Vui long chay migrate_all_features.sql'], 500);
    }

    $input = requestJson();
    $bankName = trim((string)($input['bank_name'] ?? ''));
    $bankAccountNumber = trim((string)($input['bank_account_number'] ?? ''));
    $bankAccountName = trim((string)($input['bank_account_name'] ?? ''));

    if ($bankName === '' || $bankAccountNumber === '' || $bankAccountName === '') {
        jsonResponse(['success' => false, 'message' => 'Vui long nhap day du thong tin ngan hang'], 400);
    }

    // Nếu user chưa có tài khoản nào đang active → tài khoản mới này sẽ là mặc định (is_default = 1)
    $hasActiveAccount = queryOne(
        "SELECT id FROM user_bank_accounts WHERE user_id = ? AND is_active = 1 LIMIT 1",
        [$user['id']]
    );
    insertRow('user_bank_accounts', [
        'user_id' => $user['id'],
        'bank_name' => $bankName,
        'bank_account_number' => $bankAccountNumber,
        'bank_account_name' => $bankAccountName,
        'is_default' => $hasActiveAccount ? 0 : 1,
        'is_active' => 1,
    ]);
    getWalletSummary($user);
}

/**
 * Xoá mềm (soft delete) tài khoản ngân hàng của user.
 * Luồng: set is_active = 0 và is_default = 0 thay vì DELETE thật — giữ lịch sử giao dịch.
 * Input:  $user (array); $id (int|null) — ID tài khoản ngân hàng từ URL path.
 * Output: jsonResponse wallet summary đầy đủ.
 * Gọi từ: handleWallet() (DELETE /wallet/bank-accounts/:id).
 */
function deleteBankAccount($user, $id) {
    if (!$id || !tableExists('user_bank_accounts')) {
        jsonResponse(['success' => false, 'message' => 'Khong tim thay tai khoan ngan hang'], 404);
    }
    // Soft delete: không xoá hàng, chỉ đánh dấu is_active = 0 để giữ lịch sử tham chiếu
    executeSql("UPDATE user_bank_accounts SET is_active = 0, is_default = 0 WHERE id = ? AND user_id = ?", [$id, $user['id']]);
    getWalletSummary($user);
}

/**
 * Tạo yêu cầu nạp tiền vào ví — trạng thái pending, chờ admin duyệt.
 * Luồng: validate amount > 0 → lấy bank account → getOrCreateWallet()
 *        → INSERT wallet_transactions với status = 'pending'
 *        → số dư KHÔNG thay đổi ngay (phải đợi admin creditWallet()).
 * Input:  $user (array); JSON body {amount, bank_account_id}.
 * Output: jsonResponse wallet summary.
 * Gọi từ: handleWallet() (POST /wallet/deposit).
 * Lý do pending: tránh user credit ví giả — admin phải xác nhận tiền đã chuyển khoản thật.
 */
function depositWallet($user) {
    $input = requestJson();
    $amount = (float)($input['amount'] ?? 0);
    $bankAccountId = (int)($input['bank_account_id'] ?? 0);

    if ($amount <= 0) {
        jsonResponse(['success' => false, 'message' => 'So tien nap khong hop le'], 400);
    }
    $bankAccount = getUserBankAccount($user['id'], $bankAccountId);
    if (!$bankAccount) {
        jsonResponse(['success' => false, 'message' => 'Vui long lien ket tai khoan ngan hang truoc khi nap tien'], 400);
    }
    verifyOrderOtp((int)$user['id'], trim((string)($input['otp_code'] ?? '')), 'wallet_deposit');

    // Tạo yêu cầu nạp tiền ở trạng thái pending
    // Số dư chỉ được cộng sau khi admin duyệt — tránh user tự credit tuỳ ý
    $wallet = getOrCreateWallet($user['id']);
    executeSql(
        "INSERT INTO wallet_transactions
         (wallet_id, user_id, type, amount, status, description, reference_type,
          bank_name, bank_account_number, bank_account_name)
         VALUES (?, ?, 'credit', ?, 'pending', 'Yêu cầu nạp tiền vào ví', 'wallet_deposit', ?, ?, ?)",
        [
            $wallet['id'], $user['id'], $amount,
            $bankAccount['bank_name'],
            $bankAccount['bank_account_number'],
            $bankAccount['bank_account_name'],
        ]
    );
    getWalletSummary($user);
}

/**
 * Yêu cầu rút tiền từ ví về tài khoản ngân hàng.
 * Luồng: validate amount > 0 → lấy bank account → gọi debitWallet()
 *        → debitWallet() dùng SELECT FOR UPDATE để khoá hàng wallet
 *          → kiểm tra balance >= amount → trừ balance ngay, tạo giao dịch status = 'pending'
 *        → trả lỗi nếu không đủ số dư.
 * Input:  $user (array); JSON body {amount, bank_account_id}.
 * Output: jsonResponse wallet summary hoặc lỗi 400 nếu không đủ số dư.
 * Gọi từ: handleWallet() (POST /wallet/withdraw).
 * Lý do trừ ngay (debit ngay): ngăn double-withdraw — nếu 2 request rút cùng lúc,
 *   SELECT FOR UPDATE đảm bảo chỉ 1 request thấy đủ số dư.
 */
function withdrawWallet($user) {
    $input = requestJson();
    $amount = (float)($input['amount'] ?? 0);
    $bankAccountId = (int)($input['bank_account_id'] ?? 0);

    if ($amount <= 0) {
        jsonResponse(['success' => false, 'message' => 'So tien rut khong hop le'], 400);
    }
    $bankAccount = getUserBankAccount($user['id'], $bankAccountId);
    if (!$bankAccount) {
        jsonResponse(['success' => false, 'message' => 'Vui long lien ket tai khoan ngan hang truoc khi rut tien'], 400);
    }
    verifyOrderOtp((int)$user['id'], trim((string)($input['otp_code'] ?? '')), 'wallet_withdraw');

    // debitWallet() xử lý race condition bên trong bằng transaction + SELECT FOR UPDATE
    // status = 'pending' vì admin vẫn cần xử lý chuyển tiền thực ra ngân hàng
    $success = debitWallet(
        $user['id'],
        $amount,
        'Yeu cau rut tien ve ngan hang',
        'wallet_withdraw',
        null,
        'pending',
        [
            'bank_name' => $bankAccount['bank_name'],
            'bank_account_number' => $bankAccount['bank_account_number'],
            'bank_account_name' => $bankAccount['bank_account_name'],
        ]
    );
    if (!$success) {
        jsonResponse(['success' => false, 'message' => 'So du vi khong du'], 400);
    }
    getWalletSummary($user);
}
?>

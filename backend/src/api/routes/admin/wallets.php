<?php
function handleAdminWallets($method, $pathParts, $currentUser) {
    if (!tableExists('wallets') || !tableExists('wallet_transactions') || !tableExists('user_bank_accounts')) {
        jsonResponse(['success' => false, 'message' => 'Chua tao bang vi dien tu. Vui long chay migrate_order_workflow.sql'], 500);
    }

    $resource = $pathParts[2] ?? '';
    $id = $pathParts[3] ?? null;

    if ($method === 'GET' && $resource === '') {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = trim((string)($_GET['search'] ?? ''));
        $type = $_GET['type'] ?? '';
        $status = $_GET['status'] ?? '';
        $sort = $_GET['sort'] ?? 'newest';
        $dateFrom = trim((string)($_GET['date_from'] ?? ''));
        $dateTo = trim((string)($_GET['date_to'] ?? ''));

        $where = '1=1';
        $params = [];
        if ($search !== '') {
            $where .= " AND (
                u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?
                OR wt.description LIKE ? OR wt.bank_name LIKE ? OR wt.bank_account_number LIKE ?
            )";
            $term = "%{$search}%";
            array_push($params, $term, $term, $term, $term, $term, $term);
        }
        if (in_array($type, ['credit', 'debit'], true)) {
            $where .= ' AND wt.type = ?';
            $params[] = $type;
        }
        if (in_array($status, ['pending', 'completed', 'rejected'], true)) {
            $where .= ' AND wt.status = ?';
            $params[] = $status;
        }
        if (($dateFrom !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom))
            || ($dateTo !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo))) {
            jsonResponse(['success' => false, 'message' => 'Khoang thoi gian loc khong hop le'], 400);
        }
        if ($dateFrom !== '' && $dateTo !== '') {
            $fromTs = strtotime($dateFrom);
            $toTs = strtotime($dateTo);
            if ($fromTs > $toTs) {
                jsonResponse(['success' => false, 'message' => 'Ngay bat dau khong duoc lon hon ngay ket thuc'], 400);
            }
            if ($toTs > strtotime('+1 month', $fromTs)) {
                jsonResponse(['success' => false, 'message' => 'Chi duoc loc toi da trong khoang 1 thang'], 400);
            }
        }
        if ($dateFrom !== '') {
            $where .= ' AND DATE(wt.created_at) >= ?';
            $params[] = $dateFrom;
        }
        if ($dateTo !== '') {
            $where .= ' AND DATE(wt.created_at) <= ?';
            $params[] = $dateTo;
        }

        $orderBy = match ($sort) {
            'oldest' => 'wt.created_at ASC',
            'amount_desc' => 'wt.amount DESC',
            'amount_asc' => 'wt.amount ASC',
            default => 'wt.created_at DESC',
        };

        $count = (int)(queryOne(
            "SELECT COUNT(*) AS count
             FROM wallet_transactions wt
             LEFT JOIN users u ON wt.user_id = u.id
             WHERE {$where}",
            $params
        )['count'] ?? 0);

        $transactions = queryAll(
            "SELECT wt.*, w.balance,
                    u.first_name, u.last_name, u.email,
                    uba.bank_name AS linked_bank_name,
                    uba.bank_account_number AS linked_bank_account_number,
                    uba.bank_account_name AS linked_bank_account_name
             FROM wallet_transactions wt
             LEFT JOIN wallets w ON wt.wallet_id = w.id
             LEFT JOIN users u ON wt.user_id = u.id
             LEFT JOIN user_bank_accounts uba
               ON uba.user_id = wt.user_id AND uba.is_active = 1 AND uba.is_default = 1
             WHERE {$where}
             ORDER BY {$orderBy}
             LIMIT {$limit} OFFSET {$offset}",
            $params
        );

        $stats = [
            'totalBalance' => (float)(queryOne("SELECT SUM(balance) AS total FROM wallets")['total'] ?? 0),
            'pendingWithdrawals' => (int)(queryOne("SELECT COUNT(*) AS count FROM wallet_transactions WHERE type = 'debit' AND status = 'pending' AND reference_type = 'wallet_withdraw'")['count'] ?? 0),
            'pendingWithdrawAmount' => (float)(queryOne("SELECT SUM(amount) AS total FROM wallet_transactions WHERE type = 'debit' AND status = 'pending' AND reference_type = 'wallet_withdraw'")['total'] ?? 0),
            'linkedBanks' => tableExists('user_bank_accounts')
                ? (int)(queryOne("SELECT COUNT(*) AS count FROM user_bank_accounts WHERE is_active = 1")['count'] ?? 0)
                : 0,
        ];

        jsonResponse(['success' => true, 'data' => [
            'transactions' => $transactions,
            'stats' => $stats,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'totalItems' => $count,
                'totalPages' => (int)ceil($count / $limit),
            ],
        ]]);
    }

    if ($method === 'PUT' && $resource === 'transactions' && $id) {
        $input = requestJson();
        $newStatus = $input['status'] ?? '';
        if (!in_array($newStatus, ['completed', 'rejected'], true)) {
            jsonResponse(['success' => false, 'message' => 'Trang thai giao dich khong hop le'], 400);
        }

        $transaction = queryOne("SELECT * FROM wallet_transactions WHERE id = ?", [$id]);
        if (!$transaction) {
            jsonResponse(['success' => false, 'message' => 'Khong tim thay giao dich vi'], 404);
        }
        if (($transaction['status'] ?? '') !== 'pending') {
            jsonResponse(['success' => false, 'message' => 'Chi xu ly duoc giao dich dang cho'], 400);
        }
        if (($transaction['type'] ?? '') !== 'debit' || ($transaction['reference_type'] ?? '') !== 'wallet_withdraw') {
            jsonResponse(['success' => false, 'message' => 'Chi xu ly duoc yeu cau rut tien'], 400);
        }

        updateRow('wallet_transactions', $id, [
            'status' => $newStatus,
            'description' => $newStatus === 'completed'
                ? trim((string)($input['admin_note'] ?? 'Yeu cau rut tien da duoc xu ly'))
                : trim((string)($input['admin_note'] ?? 'Yeu cau rut tien bi tu choi')),
        ]);

        if ($newStatus === 'rejected') {
            creditWallet(
                $transaction['user_id'],
                (float)$transaction['amount'],
                'Hoan lai tien rut bi tu choi',
                'wallet_withdraw_rejected',
                $id,
                [
                    'bank_name' => $transaction['bank_name'],
                    'bank_account_number' => $transaction['bank_account_number'],
                    'bank_account_name' => $transaction['bank_account_name'],
                ]
            );
        }

        jsonResponse(['success' => true, 'message' => 'Da cap nhat giao dich vi']);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}


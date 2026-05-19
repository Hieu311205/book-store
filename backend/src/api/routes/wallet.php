<?php
function handleWallet($method, $pathParts) {
    $user = requireUser();
    if (!tableExists('wallets') || !tableExists('wallet_transactions')) {
        jsonResponse(['success' => false, 'message' => 'Chua tao bang vi dien tu. Vui long chay migrate_order_workflow.sql'], 500);
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

function getWalletSummary($user) {
    $wallet = getOrCreateWallet($user['id']);
    $transactions = queryAll(
        "SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        [$user['id']]
    );
    $bankAccounts = tableExists('user_bank_accounts')
        ? queryAll("SELECT * FROM user_bank_accounts WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC, id DESC", [$user['id']])
        : [];
    jsonResponse(['success' => true, 'data' => [
        'wallet' => $wallet,
        'transactions' => $transactions,
        'bank_accounts' => $bankAccounts,
    ]]);
}

function linkBankAccount($user) {
    if (!tableExists('user_bank_accounts')) {
        jsonResponse(['success' => false, 'message' => 'Chua tao bang tai khoan ngan hang. Vui long chay migrate_order_workflow.sql'], 500);
    }

    $input = requestJson();
    $bankName = trim((string)($input['bank_name'] ?? ''));
    $bankAccountNumber = trim((string)($input['bank_account_number'] ?? ''));
    $bankAccountName = trim((string)($input['bank_account_name'] ?? ''));

    if ($bankName === '' || $bankAccountNumber === '' || $bankAccountName === '') {
        jsonResponse(['success' => false, 'message' => 'Vui long nhap day du thong tin ngan hang'], 400);
    }

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

function deleteBankAccount($user, $id) {
    if (!$id || !tableExists('user_bank_accounts')) {
        jsonResponse(['success' => false, 'message' => 'Khong tim thay tai khoan ngan hang'], 404);
    }
    executeSql("UPDATE user_bank_accounts SET is_active = 0, is_default = 0 WHERE id = ? AND user_id = ?", [$id, $user['id']]);
    getWalletSummary($user);
}

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
    creditWallet(
        $user['id'],
        $amount,
        'Nap tien vao vi',
        'wallet_deposit',
        null,
        [
            'bank_name' => $bankAccount['bank_name'],
            'bank_account_number' => $bankAccount['bank_account_number'],
            'bank_account_name' => $bankAccount['bank_account_name'],
        ]
    );
    getWalletSummary($user);
}

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

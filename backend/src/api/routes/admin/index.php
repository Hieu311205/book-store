<?php
require_once __DIR__ . '/dashboard.php';
require_once __DIR__ . '/products.php';
require_once __DIR__ . '/categories.php';
require_once __DIR__ . '/orders.php';
require_once __DIR__ . '/wallets.php';
require_once __DIR__ . '/users.php';
require_once __DIR__ . '/coupons.php';

function handleAdmin($method, $pathParts) {
    $user = requireUser();
    requireAdminRole($user);

    $section = $pathParts[1] ?? '';
    if ($section === 'dashboard') {
        handleAdminDashboard($method, $pathParts);
    } elseif ($section === 'products') {
        handleAdminProducts($method, $pathParts);
    } elseif ($section === 'categories') {
        handleAdminCategories($method, $pathParts);
    } elseif ($section === 'orders') {
        handleAdminOrders($method, $pathParts);
    } elseif ($section === 'return-requests') {
        handleAdminReturnRequests($method, $pathParts, $user);
    } elseif ($section === 'wallets') {
        handleAdminWallets($method, $pathParts, $user);
    } elseif ($section === 'users') {
        requireSuperAdmin($user);
        handleAdminUsers($method, $pathParts, $user);
    } elseif ($section === 'coupons') {
        requireSuperAdmin($user);
        handleAdminCoupons($method, $pathParts);
    } elseif ($section === 'sliders') {
        requireSuperAdmin($user);
        handleSimpleResource($method, $pathParts, 'sliders', ['title', 'subtitle', 'image_url', 'link', 'button_text', 'sort_order', 'is_active', 'start_date', 'end_date']);
    } elseif ($section === 'settings') {
        requireSuperAdmin($user);
        handleSettings($method, $pathParts);
    } elseif ($section === 'contact-messages') {
        requireSuperAdmin($user);
        handleContactMessages($method, $pathParts);
    } else {
        jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
    }
}

function requireAdminRole($user) {
    if (!in_array($user['role'], ['admin', 'super_admin'], true)) {
        jsonResponse(['success' => false, 'message' => 'Ban khong co quyen truy cap'], 403);
    }
}

function requireSuperAdmin($user) {
    if (($user['role'] ?? '') !== 'super_admin') {
        jsonResponse(['success' => false, 'message' => 'Chi super admin moi co quyen thuc hien thao tac nay'], 403);
    }
}

function handleContactMessages($method, $pathParts) {
    $id = $pathParts[2] ?? null;

    if ($method === 'GET') {
        jsonResponse(['success' => true, 'data' => queryAll("SELECT * FROM contact_messages ORDER BY is_read ASC, created_at DESC")]);
    }

    if ($method === 'PUT' && $id && (($pathParts[3] ?? '') === 'read')) {
        updateRow('contact_messages', $id, ['is_read' => 1]);
        jsonResponse(['success' => true, 'message' => 'Da danh dau da doc']);
    }

    if ($method === 'DELETE' && $id) {
        executeSql("DELETE FROM contact_messages WHERE id = ?", [$id]);
        jsonResponse(['success' => true, 'message' => 'Da xoa tin nhan']);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}

function handleSimpleResource($method, $pathParts, $table, $allowed) {
    $id = $pathParts[2] ?? null;
    if ($method === 'GET') {
        jsonResponse(['success' => true, 'data' => queryAll("SELECT * FROM {$table} ORDER BY id DESC")]);
    }
    if ($method === 'POST') {
        $id = insertRow($table, filterInput(requestJson(), $allowed));
        jsonResponse(['success' => true, 'data' => queryOne("SELECT * FROM {$table} WHERE id = ?", [$id])], 201);
    }
    if ($method === 'PUT' && $id) {
        updateRow($table, $id, filterInput(requestJson(), $allowed));
        jsonResponse(['success' => true, 'data' => queryOne("SELECT * FROM {$table} WHERE id = ?", [$id])]);
    }
    if ($method === 'DELETE' && $id) {
        executeSql("DELETE FROM {$table} WHERE id = ?", [$id]);
        jsonResponse(['success' => true, 'message' => 'Da xoa']);
    }
    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}

function handleSettings($method, $pathParts) {
    $id = $pathParts[2] ?? null;
    $allowed = ['key_name', 'value', 'type', 'group_name'];

    if ($method === 'GET') {
        jsonResponse(['success' => true, 'data' => queryAll("SELECT * FROM settings ORDER BY group_name, key_name")]);
    }

    if ($method === 'POST') {
        $input = requestJson();
        if (empty($input['key_name'])) {
            jsonResponse(['success' => false, 'message' => 'Thieu key_name'], 400);
        }
        $data = filterInput($input, $allowed);
        $id = insertRow('settings', $data);
        jsonResponse(['success' => true, 'data' => queryOne("SELECT * FROM settings WHERE id = ?", [$id])], 201);
    }

    if ($method === 'PUT' && $id) {
        updateRow('settings', $id, filterInput(requestJson(), $allowed));
        jsonResponse(['success' => true, 'data' => queryOne("SELECT * FROM settings WHERE id = ?", [$id])]);
    }

    if ($method === 'DELETE' && $id) {
        executeSql("DELETE FROM settings WHERE id = ?", [$id]);
        jsonResponse(['success' => true, 'message' => 'Da xoa cai dat']);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}


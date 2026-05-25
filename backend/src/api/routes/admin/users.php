<?php
function handleAdminUsers($method, $pathParts, $currentUser) {
    $id = $pathParts[2] ?? null;

    if ($method === 'GET' && !$id) {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $where = '1=1';
        $params = [];

        if (!empty($_GET['search'])) {
            $like = '%' . $_GET['search'] . '%';
            $where .= ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?)';
            $params[] = $like; $params[] = $like; $params[] = $like; $params[] = $like;
        }
        if (!empty($_GET['role'])) {
            $where .= ' AND role = ?';
            $params[] = $_GET['role'];
        }
        if (($_GET['status'] ?? '') === 'active') {
            $where .= ' AND is_active = 1';
        } elseif (($_GET['status'] ?? '') === 'blocked') {
            $where .= ' AND is_active = 0';
        }
        if (!empty($_GET['date_from'])) {
            $where .= ' AND DATE(created_at) >= ?';
            $params[] = $_GET['date_from'];
        }
        if (!empty($_GET['date_to'])) {
            $where .= ' AND DATE(created_at) <= ?';
            $params[] = $_GET['date_to'];
        }

        $sortMap = [
            'newest' => 'created_at DESC',
            'oldest' => 'created_at ASC',
            'name_asc' => 'first_name ASC, last_name ASC',
            'email_asc' => 'email ASC',
        ];
        $orderBy = $sortMap[$_GET['sort'] ?? 'newest'] ?? 'created_at DESC';

        $count = (int)(queryOne("SELECT COUNT(*) AS count FROM users WHERE {$where}", $params)['count'] ?? 0);
        $users = queryAll(
            "SELECT id, ugid, email, first_name, last_name, phone, role, is_active, created_at
             FROM users WHERE {$where}
             ORDER BY {$orderBy} LIMIT ? OFFSET ?",
            array_merge($params, [$limit, $offset])
        );
        jsonResponse(['success' => true, 'data' => ['users' => $users, 'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'totalItems' => $count,
            'totalPages' => (int)ceil($count / $limit),
        ]]]);
    }

    if ($method === 'GET' && $id) {
        $user = queryOne("SELECT id, ugid, email, first_name, last_name, phone, role, is_active, created_at FROM users WHERE id = ?", [$id]);
        if (!$user) {
            jsonResponse(['success' => false, 'message' => 'Khong tim thay nguoi dung'], 404);
        }
        $user['recent_orders'] = queryAll("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10", [$id]);
        jsonResponse(['success' => true, 'data' => $user]);
    }

    if ($method === 'PUT' && $id && (($pathParts[3] ?? '') === 'block')) {
        if ((int)$currentUser['id'] === (int)$id) {
            jsonResponse(['success' => false, 'message' => 'Khong the khoa tai khoan cua chinh minh'], 403);
        }
        $target = queryOne("SELECT id, role FROM users WHERE id = ?", [$id]);
        if (!$target) {
            jsonResponse(['success' => false, 'message' => 'Khong tim thay nguoi dung'], 404);
        }
        if (($target['role'] ?? '') === 'super_admin') {
            jsonResponse(['success' => false, 'message' => 'Khong the khoa tai khoan super admin'], 403);
        }
        executeSql("UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?", [$id]);
        jsonResponse(['success' => true, 'message' => 'Da cap nhat trang thai nguoi dung']);
    }

    if ($method === 'PUT' && $id && (($pathParts[3] ?? '') === 'role')) {
        $role = requestJson()['role'] ?? 'customer';
        if (!in_array($role, ['customer', 'admin', 'super_admin'], true)) {
            jsonResponse(['success' => false, 'message' => 'Vai tro khong hop le'], 400);
        }
        updateRow('users', $id, ['role' => $role]);
        jsonResponse(['success' => true, 'message' => 'Da cap nhat vai tro nguoi dung']);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}


<?php
function handleAdminCoupons($method, $pathParts) {
    $id = $pathParts[2] ?? null;
    $allowed = ['code', 'type', 'value', 'min_purchase', 'max_discount', 'usage_limit', 'used_count', 'per_user_limit', 'start_date', 'end_date', 'is_active'];

    if ($method === 'GET') {
        $isPaginated = isset($_GET['page']) || isset($_GET['limit']);
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $where = '1=1';
        $params = [];

        if (!empty($_GET['search'])) {
            $like = '%' . $_GET['search'] . '%';
            $where .= ' AND code LIKE ?';
            $params[] = $like;
        }
        if (!empty($_GET['type'])) {
            $where .= ' AND type = ?';
            $params[] = $_GET['type'];
        }
        if (($_GET['status'] ?? '') === 'active') {
            $where .= ' AND is_active = 1 AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()) AND (usage_limit IS NULL OR used_count < usage_limit)';
        } elseif (($_GET['status'] ?? '') === 'inactive') {
            $where .= ' AND is_active = 0';
        } elseif (($_GET['status'] ?? '') === 'exhausted') {
            $where .= ' AND usage_limit IS NOT NULL AND used_count >= usage_limit';
        } elseif (($_GET['status'] ?? '') === 'expired') {
            $where .= ' AND end_date IS NOT NULL AND end_date < NOW()';
        }

        $sortMap = [
            'newest' => 'id DESC',
            'oldest' => 'id ASC',
            'code_asc' => 'code ASC',
            'value_desc' => 'value DESC',
            'used_desc' => 'used_count DESC',
        ];
        $orderBy = $sortMap[$_GET['sort'] ?? 'newest'] ?? 'id DESC';
        $selectSql = "SELECT *,
            CASE
                WHEN usage_limit IS NOT NULL AND used_count >= usage_limit THEN 'exhausted'
                WHEN end_date IS NOT NULL AND end_date < NOW() THEN 'expired'
                WHEN start_date IS NOT NULL AND start_date > NOW() THEN 'scheduled'
                WHEN is_active = 1 THEN 'active'
                ELSE 'inactive'
            END AS effective_status
            FROM coupons WHERE {$where} ORDER BY {$orderBy}";

        if (!$isPaginated) {
            jsonResponse(['success' => true, 'data' => queryAll($selectSql, $params)]);
        }

        $count = (int)(queryOne("SELECT COUNT(*) AS count FROM coupons WHERE {$where}", $params)['count'] ?? 0);
        $coupons = queryAll($selectSql . " LIMIT ? OFFSET ?", array_merge($params, [$limit, $offset]));
        jsonResponse(['success' => true, 'data' => ['coupons' => $coupons, 'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'totalItems' => $count,
            'totalPages' => (int)ceil($count / $limit),
        ]]]);
    }

    if ($method === 'POST') {
        $data = filterInput(requestJson(), $allowed);
        if (isset($data['usage_limit'], $data['used_count']) && $data['usage_limit'] !== null && (int)$data['used_count'] >= (int)$data['usage_limit']) {
            $data['is_active'] = 0;
        }
        $id = insertRow('coupons', $data);
        jsonResponse(['success' => true, 'data' => queryOne("SELECT * FROM coupons WHERE id = ?", [$id])], 201);
    }

    if ($method === 'PUT' && $id) {
        $current = queryOne("SELECT * FROM coupons WHERE id = ?", [$id]);
        if (!$current) {
            jsonResponse(['success' => false, 'message' => 'Khong tim thay ma giam gia'], 404);
        }
        $data = filterInput(requestJson(), $allowed);
        $nextUsed = array_key_exists('used_count', $data) ? (int)$data['used_count'] : (int)$current['used_count'];
        $nextLimit = array_key_exists('usage_limit', $data) ? $data['usage_limit'] : $current['usage_limit'];
        $isExhausted = $nextLimit !== null && $nextLimit !== '' && $nextUsed >= (int)$nextLimit;

        if ($isExhausted) {
            $data['is_active'] = 0;
        }

        updateRow('coupons', $id, $data);
        jsonResponse(['success' => true, 'data' => queryOne("SELECT * FROM coupons WHERE id = ?", [$id])]);
    }

    if ($method === 'DELETE' && $id) {
        executeSql("DELETE FROM coupons WHERE id = ?", [$id]);
        jsonResponse(['success' => true, 'message' => 'Da xoa']);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}


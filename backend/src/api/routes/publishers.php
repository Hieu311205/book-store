<?php
/**
 * Publishers API — công khai (GET) và admin CRUD
 */

function handlePublishers($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phương thức không được hỗ trợ'], 405);
    }

    $id = $pathParts[1] ?? null;

    if ($id) {
        $pub = queryOne(
            "SELECT pub.*, COUNT(p.id) AS product_count
             FROM publishers pub
             LEFT JOIN products p ON p.publisher_id = pub.id AND p.is_active = 1
             WHERE pub.id = ?
             GROUP BY pub.id",
            [$id]
        );
        if (!$pub) {
            jsonResponse(['success' => false, 'message' => 'Không tìm thấy nhà xuất bản'], 404);
        }
        jsonResponse(['success' => true, 'data' => $pub]);
    }

    $search = trim($_GET['q'] ?? $_GET['search'] ?? '');
    $limit  = min(200, max(1, (int)($_GET['limit'] ?? 200)));

    if ($search) {
        $like = '%' . $search . '%';
        $pubs = queryAll(
            "SELECT * FROM publishers WHERE name LIKE ? OR name_en LIKE ? ORDER BY name LIMIT ?",
            [$like, $like, $limit]
        );
    } else {
        $pubs = queryAll("SELECT * FROM publishers ORDER BY name LIMIT ?", [$limit]);
    }

    jsonResponse(['success' => true, 'data' => $pubs]);
}

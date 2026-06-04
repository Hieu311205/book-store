<?php
/**
 * Authors API — công khai (GET) và admin CRUD
 *
 * Public:
 *   GET /api/v1/authors              → danh sách tác giả (dùng cho dropdown)
 *   GET /api/v1/authors/{id}         → chi tiết tác giả + số sách
 *
 * Admin (yêu cầu đăng nhập admin):
 *   Xử lý qua handleAdmin → handleAdminAuthors trong admin.php
 */

function handleAuthors($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phương thức không được hỗ trợ'], 405);
    }

    $id = $pathParts[1] ?? null;

    if ($id) {
        $author = queryOne(
            "SELECT a.*, COUNT(p.id) AS product_count
             FROM authors a
             LEFT JOIN products p ON p.author_id = a.id AND p.is_active = 1
             WHERE a.id = ?
             GROUP BY a.id",
            [$id]
        );
        if (!$author) {
            jsonResponse(['success' => false, 'message' => 'Không tìm thấy tác giả'], 404);
        }
        jsonResponse(['success' => true, 'data' => $author]);
    }

    $search = trim($_GET['q'] ?? $_GET['search'] ?? '');
    $limit  = min(200, max(1, (int)($_GET['limit'] ?? 200)));

    if ($search) {
        $like    = '%' . $search . '%';
        $authors = queryAll(
            "SELECT * FROM authors WHERE name LIKE ? OR name_en LIKE ? ORDER BY name LIMIT ?",
            [$like, $like, $limit]
        );
    } else {
        $authors = queryAll("SELECT * FROM authors ORDER BY name LIMIT ?", [$limit]);
    }

    jsonResponse(['success' => true, 'data' => $authors]);
}

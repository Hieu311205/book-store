<?php
function handleAdminCategories($method, $pathParts) {
    $allowed = ['name', 'name_en', 'parent_id', 'description', 'image_url', 'icon', 'sort_order', 'is_active'];

    if ($method === 'GET') {
        $isPaginated = isset($_GET['page']) || isset($_GET['limit']);
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $where = '1=1';
        $params = [];

        if (!empty($_GET['search'])) {
            $like = '%' . $_GET['search'] . '%';
            $where .= ' AND (c.name LIKE ? OR c.name_en LIKE ? OR c.description LIKE ?)';
            $params[] = $like; $params[] = $like; $params[] = $like;
        }
        if (($_GET['status'] ?? '') === 'active') {
            $where .= ' AND c.is_active = 1';
        } elseif (($_GET['status'] ?? '') === 'inactive') {
            $where .= ' AND c.is_active = 0';
        }
        if (($_GET['parent'] ?? '') === 'root') {
            $where .= ' AND c.parent_id IS NULL';
        } elseif (($_GET['parent'] ?? '') === 'child') {
            $where .= ' AND c.parent_id IS NOT NULL';
        }

        $sortMap = [
            'sort_order' => 'c.sort_order ASC, c.id ASC',
            'newest' => 'c.created_at DESC',
            'oldest' => 'c.created_at ASC',
            'name_asc' => 'c.name ASC',
            'products_desc' => 'product_count DESC, c.sort_order ASC',
        ];
        $orderBy = $sortMap[$_GET['sort'] ?? 'sort_order'] ?? 'c.sort_order ASC, c.id ASC';

        $selectSql = "SELECT c.*,
                             p.name AS parent_name,
                             (SELECT COUNT(*) FROM products pr WHERE pr.category_id = c.id) AS product_count
                      FROM categories c
                      LEFT JOIN categories p ON c.parent_id = p.id
                      WHERE {$where}
                      ORDER BY {$orderBy}";

        if (!$isPaginated) {
            jsonResponse(['success' => true, 'data' => queryAll($selectSql, $params)]);
        }

        $count = (int)(queryOne(
            "SELECT COUNT(*) AS count
             FROM categories c
             LEFT JOIN categories p ON c.parent_id = p.id
             WHERE {$where}",
            $params
        )['count'] ?? 0);
        $categories = queryAll($selectSql . " LIMIT ? OFFSET ?", array_merge($params, [$limit, $offset]));

        jsonResponse(['success' => true, 'data' => ['categories' => $categories, 'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'totalItems' => $count,
            'totalPages' => (int)ceil($count / $limit),
        ]]]);
    }

    if ($method === 'POST') {
        $input = requestJson();
        $data = cleanCategoryData(filterInput($input, $allowed));
        $baseSlug = slugifyText($input['name_en'] ?? $input['name'] ?? 'category');
        $data['slug'] = $baseSlug . '-' . substr((string)time(), -4);
        $id = insertRow('categories', $data);
        $category = queryOne("SELECT * FROM categories WHERE id = ?", [$id]);
        $category['cover_folder'] = createCategoryCoverFolders($baseSlug);
        jsonResponse(['success' => true, 'message' => 'Da them danh muc', 'data' => $category], 201);
    }

    $id = $pathParts[2] ?? null;
    if ($method === 'PUT' && $id) {
        updateRow('categories', $id, cleanCategoryData(filterInput(requestJson(), $allowed)));
        jsonResponse(['success' => true, 'message' => 'Da cap nhat danh muc', 'data' => queryOne("SELECT * FROM categories WHERE id = ?", [$id])]);
    }
    if ($method === 'DELETE' && $id) {
        executeSql("DELETE FROM categories WHERE id = ?", [$id]);
        jsonResponse(['success' => true, 'message' => 'Da xoa danh muc']);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}

function cleanCategoryData($data) {
    foreach (['parent_id', 'name_en', 'description', 'image_url', 'icon'] as $field) {
        if (array_key_exists($field, $data) && $data[$field] === '') {
            $data[$field] = null;
        }
    }

    foreach (['parent_id', 'sort_order', 'is_active'] as $field) {
        if (array_key_exists($field, $data) && $data[$field] !== null) {
            $data[$field] = (int)$data[$field];
        }
    }

    return $data;
}

function createCategoryCoverFolders($slug) {
    $folderName = preg_replace('/[^a-z0-9-]/', '', strtolower((string)$slug));
    $folderName = trim($folderName, '-');
    if ($folderName === '') {
        $folderName = 'category';
    }

    $root = dirname(__DIR__, 4);
    $relativePath = 'images/covers/' . $folderName;
    $targets = [
        $root . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . $relativePath,
        $root . DIRECTORY_SEPARATOR . 'admin-panel' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . $relativePath,
    ];

    foreach ($targets as $target) {
        if (!is_dir($target)) {
            @mkdir($target, 0775, true);
        }
        if (is_dir($target)) {
            $keepFile = $target . DIRECTORY_SEPARATOR . '.gitkeep';
            if (!file_exists($keepFile)) {
                @file_put_contents($keepFile, '');
            }
        }
    }

    return '/' . str_replace('\\', '/', $relativePath) . '/';
}


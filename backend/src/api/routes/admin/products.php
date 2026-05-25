<?php
function handleAdminProducts($method, $pathParts) {
    if ($method === 'POST' && (($pathParts[2] ?? '') === 'cover')) {
        handleProductCoverUpload();
    }

    if ($method === 'GET' && !isset($pathParts[2])) {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $where = ['1 = 1'];
        $params = [];

        if (!empty($_GET['search'])) {
            $where[] = '(p.title LIKE ? OR p.sku LIKE ? OR p.isbn LIKE ? OR a.name LIKE ?)';
            $term = '%' . $_GET['search'] . '%';
            array_push($params, $term, $term, $term, $term);
        }
        if (!empty($_GET['category'])) {
            $where[] = 'p.category_id = ?';
            $params[] = (int)$_GET['category'];
        }
        if (!empty($_GET['author'])) {
            $where[] = 'p.author_id = ?';
            $params[] = (int)$_GET['author'];
        }
        if (!empty($_GET['publisher'])) {
            $where[] = 'p.publisher_id = ?';
            $params[] = (int)$_GET['publisher'];
        }
        if (!empty($_GET['price_min'])) {
            $where[] = 'p.price >= ?';
            $params[] = (float)$_GET['price_min'];
        }
        if (!empty($_GET['price_max'])) {
            $where[] = 'p.price <= ?';
            $params[] = (float)$_GET['price_max'];
        }
        if (($_GET['status'] ?? '') === 'active') {
            $where[] = 'p.is_active = 1';
        } elseif (($_GET['status'] ?? '') === 'inactive') {
            $where[] = 'p.is_active = 0';
        } elseif (($_GET['status'] ?? '') === 'low_stock') {
            $where[] = 'p.stock > 0 AND p.stock < 10';
        } elseif (($_GET['status'] ?? '') === 'out_of_stock') {
            $where[] = 'p.stock = 0';
        }
        if (!empty($_GET['is_featured'])) {
            $where[] = 'p.is_featured = 1';
        }
        if (!empty($_GET['is_bestseller'])) {
            $where[] = 'COALESCE(p.sales_count, 0) > 0';
        }

        $sortMap = [
            'newest'     => 'p.created_at DESC',
            'oldest'     => 'p.created_at ASC',
            'price_asc'  => 'p.price ASC',
            'price_desc' => 'p.price DESC',
            'stock_asc'  => 'p.stock ASC',
            'stock_desc' => 'p.stock DESC',
            'name_asc'   => 'p.title ASC',
            'bestseller' => 'p.sales_count DESC',
        ];
        $orderBy = $sortMap[$_GET['sort'] ?? 'newest'] ?? 'p.created_at DESC';

        $whereSql = implode(' AND ', $where);
        $from = "FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN authors a ON p.author_id = a.id LEFT JOIN publishers pub ON p.publisher_id = pub.id";
        $count = (int)(queryOne("SELECT COUNT(*) AS count {$from} WHERE {$whereSql}", $params)['count'] ?? 0);
        $products = queryAll(
            "SELECT p.*, c.name AS category_name, a.name AS author_name, pub.name AS publisher_name
             {$from} WHERE {$whereSql}
             ORDER BY {$orderBy} LIMIT ? OFFSET ?",
            array_merge($params, [$limit, $offset])
        );
        $products = attachAdminProductImages($products);

        jsonResponse(['success' => true, 'data' => ['products' => $products, 'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'totalItems' => $count,
            'totalPages' => (int)ceil($count / $limit),
        ]]]);
    }

    if ($method === 'POST') {
        $input = requestJson();
        $allowed = ['category_id', 'author_id', 'publisher_id', 'title', 'title_en', 'description', 'short_description', 'isbn', 'pages', 'publish_year', 'language', 'translator', 'edition', 'format', 'price', 'compare_price', 'discount_percent', 'stock', 'sku', 'weight', 'meta_title', 'meta_description', 'is_active', 'is_featured'];
        $data = cleanProductData(filterInput($input, $allowed));
        if (empty($data['title'])) {
            jsonResponse(['success' => false, 'message' => 'Thieu ten sach'], 400);
        }
        if (!isset($data['price'])) {
            jsonResponse(['success' => false, 'message' => 'Thieu gia sach'], 400);
        }
        $data['ugid'] = guid();
        $data['slug'] = slugifyText($input['title'] ?? 'product') . '-' . substr((string)time(), -4);
        $id = insertRow('products', $data);
        savePrimaryProductImage($id, $input['image_url'] ?? null, $data['title']);
        $product = queryOne("SELECT * FROM products WHERE id = ?", [$id]);
        $product['images'] = queryAll("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order", [$id]);
        jsonResponse(['success' => true, 'message' => 'Da them sach', 'data' => $product], 201);
    }

    $id = $pathParts[2] ?? null;
    if (!$id) {
        jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
    }

    if ($method === 'PUT' && (($pathParts[3] ?? '') === 'stock')) {
        updateRow('products', $id, ['stock' => (int)(requestJson()['stock'] ?? 0), 'updated_at' => date('Y-m-d H:i:s')]);
        jsonResponse(['success' => true, 'message' => 'Da cap nhat ton kho']);
    }

    if ($method === 'PUT') {
        $input = requestJson();
        $allowed = ['category_id', 'author_id', 'publisher_id', 'title', 'title_en', 'description', 'short_description', 'isbn', 'pages', 'publish_year', 'language', 'translator', 'edition', 'format', 'price', 'compare_price', 'discount_percent', 'stock', 'sku', 'weight', 'meta_title', 'meta_description', 'is_active', 'is_featured'];
        $data = cleanProductData(filterInput($input, $allowed));
        $data['updated_at'] = date('Y-m-d H:i:s');
        updateRow('products', $id, $data);
        if (array_key_exists('image_url', $input)) {
            savePrimaryProductImage($id, $input['image_url'], $data['title'] ?? null);
        }
        $product = queryOne("SELECT * FROM products WHERE id = ?", [$id]);
        $product['images'] = queryAll("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order", [$id]);
        jsonResponse(['success' => true, 'message' => 'Da cap nhat sach', 'data' => $product]);
    }

    if ($method === 'DELETE') {
        executeSql("DELETE FROM products WHERE id = ?", [$id]);
        jsonResponse(['success' => true, 'message' => 'Da xoa sach']);
    }

    jsonResponse(['success' => false, 'message' => 'Phuong thuc khong duoc ho tro'], 405);
}

function cleanProductData($data) {
    $nullable = ['category_id', 'author_id', 'publisher_id', 'title_en', 'description', 'short_description', 'isbn', 'pages', 'publish_year', 'translator', 'edition', 'compare_price', 'discount_percent', 'sku', 'weight', 'meta_title', 'meta_description'];
    foreach ($nullable as $field) {
        if (array_key_exists($field, $data) && $data[$field] === '') {
            $data[$field] = null;
        }
    }

    foreach (['category_id', 'author_id', 'publisher_id', 'pages', 'publish_year', 'discount_percent', 'stock', 'weight', 'is_active', 'is_featured'] as $field) {
        if (array_key_exists($field, $data) && $data[$field] !== null) {
            $data[$field] = (int)$data[$field];
        }
    }

    foreach (['price', 'compare_price'] as $field) {
        if (array_key_exists($field, $data) && $data[$field] !== null) {
            $data[$field] = (float)$data[$field];
        }
    }

    return $data;
}

function attachAdminProductImages($products) {
    if (!$products) {
        return [];
    }

    $ids = array_column($products, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $images = queryAll("SELECT * FROM product_images WHERE product_id IN ({$placeholders}) ORDER BY sort_order", $ids);

    foreach ($products as &$product) {
        $product['images'] = array_values(array_filter($images, fn($image) => (int)$image['product_id'] === (int)$product['id']));
    }

    return $products;
}

function savePrimaryProductImage($productId, $imageUrl, $title = null) {
    $imageUrl = trim((string)$imageUrl);
    executeSql("DELETE FROM product_images WHERE product_id = ? AND is_primary = 1", [$productId]);

    if ($imageUrl === '') {
        return;
    }

    insertRow('product_images', [
        'product_id' => $productId,
        'image_url' => $imageUrl,
        'alt_text' => $title ?: 'Book cover',
        'sort_order' => 0,
        'is_primary' => 1,
    ]);
}

function handleProductCoverUpload() {
    $categoryId = (int)($_POST['category_id'] ?? 0);
    $productId = (int)($_POST['product_id'] ?? 0);

    if ($categoryId <= 0) {
        jsonResponse(['success' => false, 'message' => 'Vui lòng chọn danh mục trước khi tải ảnh bìa'], 400);
    }

    if (empty($_FILES['cover']) || !is_uploaded_file($_FILES['cover']['tmp_name'])) {
        jsonResponse(['success' => false, 'message' => 'Vui lòng chọn file ảnh bìa'], 400);
    }

    $category = queryOne("SELECT id, name, name_en FROM categories WHERE id = ?", [$categoryId]);
    if (!$category) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy danh mục'], 404);
    }

    $file = $_FILES['cover'];
    $maxSize = 5 * 1024 * 1024;
    if (($file['size'] ?? 0) > $maxSize) {
        jsonResponse(['success' => false, 'message' => 'Ảnh bìa không được vượt quá 5MB'], 400);
    }

    $extension = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!in_array($extension, $allowedExtensions, true)) {
        jsonResponse(['success' => false, 'message' => 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP'], 400);
    }

    $imageInfo = @getimagesize($file['tmp_name']);
    if (!$imageInfo || !str_starts_with((string)$imageInfo['mime'], 'image/')) {
        jsonResponse(['success' => false, 'message' => 'File tải lên không phải ảnh hợp lệ'], 400);
    }

    $categorySlug = slugifyText($category['name_en'] ?: $category['name'] ?: 'category');
    $folderUrl = createCategoryCoverFolders($categorySlug);
    $baseName = slugifyText(pathinfo($file['name'], PATHINFO_FILENAME));
    if ($baseName === '') {
        $baseName = 'cover';
    }
    $fileName = $baseName . '-' . date('YmdHis') . '.' . $extension;
    $relativePath = trim($folderUrl, '/') . '/' . $fileName;

    $root = dirname(__DIR__, 4);
    $targets = [
        $root . DIRECTORY_SEPARATOR . 'admin-panel' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath),
        $root . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath),
    ];

    $adminTarget = $targets[0];
    if (!move_uploaded_file($file['tmp_name'], $adminTarget)) {
        jsonResponse(['success' => false, 'message' => 'Không thể lưu ảnh bìa'], 500);
    }

    if (!@copy($adminTarget, $targets[1])) {
        @unlink($adminTarget);
        jsonResponse(['success' => false, 'message' => 'Không thể đồng bộ ảnh sang frontend'], 500);
    }

    $imageUrl = '/' . str_replace('\\', '/', $relativePath);
    if ($productId > 0) {
        $product = queryOne("SELECT id, title FROM products WHERE id = ?", [$productId]);
        if ($product) {
            savePrimaryProductImage($productId, $imageUrl, $product['title']);
        }
    }

    jsonResponse([
        'success' => true,
        'message' => 'Đã tải ảnh bìa',
        'data' => [
            'image_url' => $imageUrl,
            'folder' => $folderUrl,
        ],
    ]);
}

function guid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}


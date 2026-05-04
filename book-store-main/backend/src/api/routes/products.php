<?php
function handleProducts($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phương thức không được hỗ trợ'], 405);
    }

    $action = $pathParts[1] ?? null;

    if ($action === 'featured') {
        listProducts(['featured' => 1], true);
    } elseif ($action === 'bestsellers') {
        listProducts(['bestseller' => 1], true);
    } elseif ($action === 'new-arrivals') {
        listProducts([], true);
    } elseif ($action === 'category' && isset($pathParts[2])) {
        $_GET['category'] = $pathParts[2];
        listProducts();
    } elseif ($action === 'search') {
        $_GET['search'] = $_GET['q'] ?? '';
        listProducts();
    } elseif ($action === 'slug' && isset($pathParts[2])) {
        getProduct('slug', $pathParts[2]);
    } elseif ($action) {
        getProduct('id', $action);
    } else {
        listProducts();
    }
}

function productBaseSql() {
    return "FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN authors a ON p.author_id = a.id
        LEFT JOIN publishers pub ON p.publisher_id = pub.id";
}

function listProducts($forced = [], $simple = false) {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int)($_GET['limit'] ?? ($simple ? 8 : 12))));
    $offset = ($page - 1) * $limit;
    $sort = $_GET['sort'] ?? 'newest';

    $where = ['p.is_active = 1'];
    $params = [];

    $filters = array_merge($_GET, $forced);
    if (!empty($filters['category'])) {
        if (ctype_digit((string)$filters['category'])) {
            $where[] = 'p.category_id = ?';
            $params[] = $filters['category'];
        } else {
            $where[] = 'c.slug = ?';
            $params[] = $filters['category'];
        }
    }
    if (!empty($filters['author'])) {
        $where[] = 'p.author_id = ?';
        $params[] = $filters['author'];
    }
    if (!empty($filters['publisher'])) {
        $where[] = 'p.publisher_id = ?';
        $params[] = $filters['publisher'];
    }
    if (!empty($filters['min_price'])) {
        $where[] = 'p.price >= ?';
        $params[] = $filters['min_price'];
    }
    if (!empty($filters['max_price'])) {
        $where[] = 'p.price <= ?';
        $params[] = $filters['max_price'];
    }
    if (!empty($filters['in_stock'])) {
        $where[] = 'p.stock > 0';
    }
    if (!empty($filters['featured'])) {
        $where[] = 'p.is_featured = 1';
    }
    if (!empty($filters['bestseller'])) {
        $where[] = 'p.is_bestseller = 1';
    }
    if (!empty($filters['search'])) {
        $where[] = '(p.title LIKE ? OR p.title_en LIKE ? OR a.name LIKE ?)';
        $term = '%' . $filters['search'] . '%';
        array_push($params, $term, $term, $term);
    }

    $orders = [
        'oldest' => 'p.created_at ASC',
        'price_asc' => 'p.price ASC',
        'price_desc' => 'p.price DESC',
        'bestseller' => 'p.sales_count DESC',
        'popular' => 'p.views_count DESC',
        'newest' => 'p.created_at DESC',
    ];
    $orderBy = $orders[$sort] ?? $orders['newest'];
    if (isset($forced['bestseller'])) {
        $orderBy = 'p.sales_count DESC';
    }

    $whereSql = 'WHERE ' . implode(' AND ', $where);
    $count = (int)(queryOne("SELECT COUNT(*) AS count " . productBaseSql() . " {$whereSql}", $params)['count'] ?? 0);
    $rows = queryAll(
        "SELECT p.*, c.name AS category_name, a.name AS author_name, pub.name AS publisher_name
         " . productBaseSql() . " {$whereSql}
         ORDER BY {$orderBy}
         LIMIT ? OFFSET ?",
        array_merge($params, [$limit, $offset])
    );

    $rows = attachProductImages($rows, $simple);
    if ($simple) {
        jsonResponse(['success' => true, 'data' => $rows]);
    }

    $totalPages = (int)ceil($count / $limit);
    jsonResponse([
        'success' => true,
        'data' => [
            'products' => $rows,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'totalItems' => $count,
                'totalPages' => $totalPages,
                'hasNext' => $page < $totalPages,
                'hasPrev' => $page > 1,
            ],
        ],
    ]);
}

function getProduct($field, $value) {
    $column = $field === 'slug' ? 'p.slug' : 'p.id';
    $product = queryOne(
        "SELECT p.*, c.name AS category_name, c.slug AS category_slug,
                a.name AS author_name, a.slug AS author_slug, a.bio AS author_bio,
                pub.name AS publisher_name, pub.slug AS publisher_slug
         " . productBaseSql() . " WHERE {$column} = ?",
        [$value]
    );

    if (!$product) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy sách'], 404);
    }

    executeSql("UPDATE products SET views_count = COALESCE(views_count, 0) + 1 WHERE id = ?", [$product['id']]);
    $product['images'] = queryAll("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order", [$product['id']]);
    $product['tags'] = array_column(queryAll("SELECT tag FROM product_tags WHERE product_id = ?", [$product['id']]), 'tag');
    jsonResponse(['success' => true, 'data' => $product]);
}

function attachProductImages($products, $simple = false) {
    if (!$products) {
        return [];
    }
    $ids = array_column($products, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $images = queryAll("SELECT * FROM product_images WHERE product_id IN ({$placeholders}) ORDER BY sort_order", $ids);
    foreach ($products as &$product) {
        $matching = array_values(array_filter($images, fn($img) => (int)$img['product_id'] === (int)$product['id']));
        if ($simple) {
            $primaryImages = array_filter($matching, fn($img) => (int)$img['is_primary'] === 1);
            $primary = reset($primaryImages);
            $product['primary_image'] = $primary['image_url'] ?? ($matching[0]['image_url'] ?? null);
        } else {
            $product['images'] = $matching;
        }
    }
    return $products;
}
?>

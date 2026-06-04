<?php
/**
 * Products API — danh sách, chi tiết, tìm kiếm và gợi ý sách
 *
 * ENDPOINT MAP (tất cả GET):
 *   GET /api/v1/products                    → listProducts()       — danh sách có filter/sort/page
 *   GET /api/v1/products/featured           → listProducts(featured=1, simple=true)
 *   GET /api/v1/products/bestsellers        → listProducts(bestseller=1, simple=true)
 *   GET /api/v1/products/new-arrivals       → listProducts(simple=true, sort=newest)
 *   GET /api/v1/products/category/{id|slug} → listProducts(category=...)
 *   GET /api/v1/products/suggest?q=...      → suggestProducts()    — autocomplete search bar
 *   GET /api/v1/products/search?q=...       → listProducts(search=q)
 *   GET /api/v1/products/slug/{slug}        → getProduct('slug', slug)
 *   GET /api/v1/products/{id}               → getProduct('id', id)
 *
 * Không yêu cầu đăng nhập (API công khai).
 */

// ─── Router ──────────────────────────────────────────────────────────────────
// Nhận dispatch từ index.php, chỉ chấp nhận GET
function handleProducts($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phương thức không được hỗ trợ'], 405);
    }

    $action = $pathParts[1] ?? null; // phần path sau /products/

    if ($action === 'featured') {
        listProducts(['featured' => 1], true);       // sản phẩm nổi bật, trả đơn giản
    } elseif ($action === 'bestsellers') {
        listProducts(['bestseller' => 1], true);     // bán chạy nhất theo sales_count
    } elseif ($action === 'new-arrivals') {
        listProducts([], true);                      // mới nhất theo created_at DESC
    } elseif ($action === 'category' && isset($pathParts[2])) {
        $_GET['category'] = $pathParts[2];           // truyền category vào filter $_GET
        listProducts();
    } elseif ($action === 'suggest') {
        suggestProducts();                           // gợi ý nhanh cho search autocomplete
    } elseif ($action === 'search') {
        $_GET['search'] = $_GET['q'] ?? '';          // alias: ?q= → ?search=
        listProducts();
    } elseif ($action === 'slug' && isset($pathParts[2])) {
        getProduct('slug', $pathParts[2]);
    } elseif ($action) {
        getProduct('id', $action);                   // /products/{id}
    } else {
        listProducts();                              // /products — danh sách đầy đủ
    }
}

function getProductCategoryDescendantIds($categoryId) {
    $categoryId = (int)$categoryId;
    if ($categoryId <= 0) {
        return [];
    }

    $rows = queryAll("SELECT id, parent_id FROM categories WHERE is_active = 1");
    $childrenByParent = [];
    foreach ($rows as $row) {
        $parentId = $row['parent_id'] === null ? 0 : (int)$row['parent_id'];
        $childrenByParent[$parentId][] = (int)$row['id'];
    }

    $ids = [];
    $queue = [$categoryId];
    while ($queue) {
        $id = array_shift($queue);
        if (in_array($id, $ids, true)) {
            continue;
        }
        $ids[] = $id;
        foreach ($childrenByParent[$id] ?? [] as $childId) {
            $queue[] = $childId;
        }
    }

    return $ids;
}

function addProductCategoryFilter(&$where, &$params, $category) {
    if (ctype_digit((string)$category)) {
        $ids = getProductCategoryDescendantIds((int)$category);
        if (!$ids) {
            $where[] = 'p.category_id = ?';
            $params[] = (int)$category;
            return;
        }

        $where[] = 'p.category_id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')';
        foreach ($ids as $id) {
            $params[] = $id;
        }
        return;
    }

    $categoryRow = queryOne("SELECT id FROM categories WHERE slug = ? AND is_active = 1", [$category]);
    if ($categoryRow) {
        addProductCategoryFilter($where, $params, (int)$categoryRow['id']);
        return;
    }

    $where[] = 'c.slug = ?';
    $params[] = $category;
}

// ─── Autocomplete: gợi ý sách khi người dùng gõ vào search bar ───────────────
// Trả tối đa 8 kết quả khớp title/title_en/author, ưu tiên theo sales_count
// Được gọi bởi SearchBox component (debounce 280ms)
function suggestProducts() {
    $q = trim((string)($_GET['q'] ?? ''));
    if (mb_strlen($q) < 1) {
        jsonResponse(['success' => true, 'data' => []]);
    }

    $like  = '%' . $q . '%';
    $items = queryAll(
        "SELECT p.id, p.title, p.slug, p.price, p.rating_avg, p.rating_count,
                a.name AS author_name,
                pi.image_url
         FROM products p
         LEFT JOIN authors a  ON p.author_id = a.id
         LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
         WHERE p.is_active = 1
           AND (p.title LIKE ? OR p.title_en LIKE ? OR a.name LIKE ? OR p.isbn LIKE ?)
         ORDER BY p.sales_count DESC, p.is_featured DESC
         LIMIT 8",
        [$like, $like, $like, $like]
    );

    jsonResponse(['success' => true, 'data' => $items]);
}

// ─── Base SQL JOIN dùng chung cho listProducts và getProduct ─────────────────
function productBaseSql() {
    return "FROM products p
        LEFT JOIN categories c  ON p.category_id  = c.id
        LEFT JOIN authors a     ON p.author_id     = a.id
        LEFT JOIN publishers pub ON p.publisher_id = pub.id";
}

// ─── Danh sách sản phẩm có filter, sort và phân trang ────────────────────────
// $forced: filter bắt buộc (ví dụ ['featured' => 1]) không thể bị ghi đè từ $_GET
// $simple: true → trả mảng phẳng (dùng cho homepage sections), false → có pagination
function listProducts($forced = [], $simple = false) {
    $page   = max(1, (int)($_GET['page'] ?? 1));
    $limit  = min(100, max(1, (int)($_GET['limit'] ?? ($simple ? 8 : 12))));
    $offset = ($page - 1) * $limit;
    $sort   = $_GET['sort'] ?? 'newest';

    $where  = ['p.is_active = 1'];  // luôn lọc sản phẩm đang bán
    $params = [];

    // Gộp filter từ URL và filter bắt buộc, $forced ghi đè $_GET
    $filters = array_merge($_GET, $forced);

    // ── Xây dựng WHERE động theo từng filter ────────────────────────────────
    if (!empty($filters['category'])) {
        // Hỗ trợ cả category ID (số nguyên) và category slug (chuỗi)
        addProductCategoryFilter($where, $params, $filters['category']);
    }
    if (!empty($filters['author'])) {
        $where[]  = 'p.author_id = ?';
        $params[] = $filters['author'];
    }
    if (!empty($filters['publisher'])) {
        $where[]  = 'p.publisher_id = ?';
        $params[] = $filters['publisher'];
    }
    if (!empty($filters['min_price'])) {
        $where[]  = 'p.price >= ?';
        $params[] = $filters['min_price'];
    }
    if (!empty($filters['max_price'])) {
        $where[]  = 'p.price <= ?';
        $params[] = $filters['max_price'];
    }
    if (!empty($filters['in_stock'])) {
        $where[] = 'p.stock > 0';
    }
    if (!empty($filters['featured'])) {
        $where[] = 'p.is_featured = 1';
    }
    if (!empty($filters['bestseller'])) {
        // Lọc sản phẩm có ít nhất 1 lần bán, sắp xếp theo sales_count bên dưới
        $where[] = 'COALESCE(p.sales_count, 0) > 0';
    }
    if (!empty($filters['search'])) {
        // Tìm full-text trên tiêu đề tiếng Việt, tiếng Anh và tên tác giả
        $where[]  = '(p.title LIKE ? OR p.title_en LIKE ? OR a.name LIKE ? OR p.isbn LIKE ?)';
        $term     = '%' . $filters['search'] . '%';
        array_push($params, $term, $term, $term, $term);
    }

    // ── Thứ tự sắp xếp ───────────────────────────────────────────────────────
    $orders  = [
        'oldest'     => 'p.created_at ASC',
        'price_asc'  => 'p.price ASC',
        'price_desc' => 'p.price DESC',
        'bestseller' => 'p.sales_count DESC',
        'popular'    => 'p.views_count DESC',
        'newest'     => 'p.created_at DESC',
    ];
    $orderBy = $orders[$sort] ?? $orders['newest'];
    if (isset($forced['bestseller'])) {
        $orderBy = 'p.sales_count DESC'; // section bestseller luôn sort theo doanh số
    }

    // ── Truy vấn ─────────────────────────────────────────────────────────────
    $whereSql = 'WHERE ' . implode(' AND ', $where);
    $count    = (int)(queryOne("SELECT COUNT(*) AS count " . productBaseSql() . " {$whereSql}", $params)['count'] ?? 0);
    $rows     = queryAll(
        "SELECT p.*, c.name AS category_name, a.name AS author_name, pub.name AS publisher_name
         " . productBaseSql() . " {$whereSql}
         ORDER BY {$orderBy}
         LIMIT ? OFFSET ?",
        array_merge($params, [$limit, $offset])
    );

    // Gắn ảnh vào từng sản phẩm (1 query cho cả batch, không N+1)
    $rows = attachProductImages($rows, $simple);

    if ($simple) {
        // Mode đơn giản: trả mảng phẳng để dùng trong homepage sections
        jsonResponse(['success' => true, 'data' => $rows]);
    }

    $totalPages = (int)ceil($count / $limit);
    jsonResponse([
        'success' => true,
        'data'    => [
            'products'   => $rows,
            'pagination' => [
                'page'       => $page,
                'limit'      => $limit,
                'totalItems' => $count,
                'totalPages' => $totalPages,
                'hasNext'    => $page < $totalPages,
                'hasPrev'    => $page > 1,
            ],
        ],
    ]);
}

// ─── Chi tiết một sản phẩm (theo ID hoặc slug) ───────────────────────────────
// Tự động tăng views_count mỗi khi được gọi để thống kê lượt xem
function getProduct($field, $value) {
    $column  = $field === 'slug' ? 'p.slug' : 'p.id';
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

    // Tăng lượt xem — không block nếu fail (views_count chỉ thống kê, không critical)
    executeSql("UPDATE products SET views_count = COALESCE(views_count, 0) + 1 WHERE id = ?", [$product['id']]);

    // Gắn thêm ảnh và tag vào response
    $product['images'] = queryAll("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order", [$product['id']]);
    $product['preview_images'] = tableExists('product_preview_images')
        ? queryAll("SELECT * FROM product_preview_images WHERE product_id = ? ORDER BY sort_order, id", [$product['id']])
        : [];
    $product['tags']   = array_column(queryAll("SELECT tag FROM product_tags WHERE product_id = ?", [$product['id']]), 'tag');

    jsonResponse(['success' => true, 'data' => $product]);
}

// ─── Gắn ảnh cho danh sách sản phẩm — tránh N+1 query ───────────────────────
// Lấy tất cả ảnh của batch sản phẩm trong 1 query, sau đó map vào từng row
// $simple=true: chỉ lấy ảnh chính (primary_image), false: lấy toàn bộ ảnh
function attachProductImages($products, $simple = false) {
    if (!$products) {
        return [];
    }
    $ids          = array_column($products, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $images       = queryAll(
        "SELECT * FROM product_images WHERE product_id IN ({$placeholders}) ORDER BY sort_order",
        $ids
    );

    foreach ($products as &$product) {
        $matching = array_values(array_filter($images, fn($img) => (int)$img['product_id'] === (int)$product['id']));
        if ($simple) {
            $primaryImages   = array_filter($matching, fn($img) => (int)$img['is_primary'] === 1);
            $primary         = reset($primaryImages);
            $product['primary_image'] = $primary['image_url'] ?? ($matching[0]['image_url'] ?? null);
        } else {
            $product['images'] = $matching;
        }
    }
    return $products;
}
?>

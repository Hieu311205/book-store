<?php
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

function handleAdminDashboard($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phuong thuc khong duoc ho tro'], 405);
    }

    $action = $pathParts[2] ?? 'stats';
    if ($action === 'stats') {
        jsonResponse(['success' => true, 'data' => [
            'totalSales' => (float)(queryOne("SELECT SUM(total_amount) AS total FROM orders WHERE payment_status = 'paid'")['total'] ?? 0),
            'todaySales' => (float)(queryOne("SELECT SUM(total_amount) AS total FROM orders WHERE payment_status = 'paid' AND DATE(created_at) = CURDATE()")['total'] ?? 0),
            'totalOrders' => (int)(queryOne("SELECT COUNT(*) AS count FROM orders")['count'] ?? 0),
            'pendingOrders' => (int)(queryOne("SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'")['count'] ?? 0),
            'totalUsers' => (int)(queryOne("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'")['count'] ?? 0),
            'totalProducts' => (int)(queryOne("SELECT COUNT(*) AS count FROM products")['count'] ?? 0),
            'lowStockProducts' => (int)(queryOne("SELECT COUNT(*) AS count FROM products WHERE stock < 10")['count'] ?? 0),
        ]]);
    }

    if ($action === 'sales') {
        $period = $_GET['period'] ?? '7days';
        $days = $period === '90days' ? 90 : ($period === '30days' ? 30 : 7);
        jsonResponse(['success' => true, 'data' => queryAll(
            "SELECT DATE(created_at) AS date, SUM(total_amount) AS total, COUNT(id) AS orders
             FROM orders
             WHERE payment_status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY DATE(created_at)
             ORDER BY date",
            [$days]
        )]);
    }

    if ($action === 'recent-orders') {
        jsonResponse(['success' => true, 'data' => queryAll(
            "SELECT o.*, u.first_name, u.last_name, u.email
             FROM orders o LEFT JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC
             LIMIT 10"
        )]);
    }

    if ($action === 'notifications') {
        $pendingOrders = (int)(queryOne("SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'")['count'] ?? 0);
        $shippedOrders = (int)(queryOne("SELECT COUNT(*) AS count FROM orders WHERE status = 'shipped'")['count'] ?? 0);
        $lowStockProducts = (int)(queryOne("SELECT COUNT(*) AS count FROM products WHERE stock < 10")['count'] ?? 0);
        $unreadMessages = tableExists('contact_messages')
            ? (int)(queryOne("SELECT COUNT(*) AS count FROM contact_messages WHERE is_read = 0")['count'] ?? 0)
            : 0;
        $pendingReturns = tableExists('return_requests')
            ? (int)(queryOne("SELECT COUNT(*) AS count FROM return_requests WHERE status = 'pending'")['count'] ?? 0)
            : 0;
        $approvedReturns = tableExists('return_requests')
            ? (int)(queryOne("SELECT COUNT(*) AS count FROM return_requests WHERE status = 'approved'")['count'] ?? 0)
            : 0;
        $pendingWithdrawals = tableExists('wallet_transactions')
            ? (int)(queryOne("SELECT COUNT(*) AS count FROM wallet_transactions WHERE type = 'debit'  AND status = 'pending' AND reference_type = 'wallet_withdraw'")['count'] ?? 0)
            : 0;
        $pendingDeposits = tableExists('wallet_transactions')
            ? (int)(queryOne("SELECT COUNT(*) AS count FROM wallet_transactions WHERE type = 'credit' AND status = 'pending' AND reference_type = 'wallet_deposit'")['count'] ?? 0)
            : 0;

        $items = [];
        if ($pendingOrders > 0) {
            $items[] = [
                'id' => 'pending-orders',
                'type' => 'orders',
                'title' => 'Đơn hàng chờ xác nhận',
                'message' => "{$pendingOrders} đơn hàng mới đang chờ xử lý",
                'to' => '/orders',
            ];
        }
        if ($shippedOrders > 0) {
            $items[] = [
                'id' => 'shipped-orders',
                'type' => 'orders',
                'title' => 'Đơn đang giao',
                'message' => "{$shippedOrders} đơn hàng đang giao cần theo dõi",
                'to' => '/orders',
            ];
        }
        if ($pendingReturns > 0) {
            $items[] = [
                'id' => 'pending-returns',
                'type' => 'returns',
                'title' => 'Yêu cầu đổi trả mới',
                'message' => "{$pendingReturns} yêu cầu đổi trả đang chờ duyệt",
                'to' => '/orders',
            ];
        }
        if ($approvedReturns > 0) {
            $items[] = [
                'id' => 'approved-returns',
                'type' => 'returns',
                'title' => 'Đổi trả chờ hoàn tất',
                'message' => "{$approvedReturns} yêu cầu đổi trả đã duyệt cần hoàn tất",
                'to' => '/orders',
            ];
        }
        if ($pendingWithdrawals > 0) {
            $items[] = [
                'id' => 'pending-wallet-withdrawals',
                'type' => 'wallets',
                'title' => 'Yêu cầu rút ví',
                'message' => "{$pendingWithdrawals} yêu cầu rút tiền đang chờ xử lý",
                'to' => '/wallets',
            ];
        }
        if ($pendingDeposits > 0) {
            $items[] = [
                'id' => 'pending-wallet-deposits',
                'type' => 'wallets',
                'title' => 'Yêu cầu nạp tiền',
                'message' => "{$pendingDeposits} yêu cầu nạp tiền đang chờ duyệt",
                'to' => '/wallets',
            ];
        }
        if ($lowStockProducts > 0) {
            $items[] = [
                'id' => 'low-stock',
                'type' => 'products',
                'title' => 'Sách sắp hết hàng',
                'message' => "{$lowStockProducts} sách còn dưới 10 cuốn",
                'to' => '/products?status=low_stock',
            ];
        }
        if ($unreadMessages > 0) {
            $items[] = [
                'id' => 'unread-messages',
                'type' => 'messages',
                'title' => 'Tin nhắn mới',
                'message' => "{$unreadMessages} tin nhắn liên hệ chưa đọc",
                'to' => '/contact-messages',
            ];
        }

        jsonResponse(['success' => true, 'data' => [
            'count' => $pendingOrders + $shippedOrders + $pendingReturns + $approvedReturns + $pendingWithdrawals + $pendingDeposits + $lowStockProducts + $unreadMessages,
            'items' => $items,
        ]]);
    }

    if ($action === 'inventory') {
        // Tồn kho theo danh mục
        $byCategory = queryAll(
            "SELECT c.name AS name,
                    SUM(p.stock) AS total_stock,
                    SUM(p.stock * p.price) AS total_value
             FROM products p
             JOIN categories c ON p.category_id = c.id
             WHERE p.is_active = 1
             GROUP BY c.id, c.name
             ORDER BY total_stock DESC"
        );

        // Tồn kho theo tác giả (top 8)
        $byAuthor = queryAll(
            "SELECT a.name AS name,
                    SUM(p.stock) AS total_stock
             FROM products p
             JOIN authors a ON p.author_id = a.id
             WHERE p.is_active = 1
             GROUP BY a.id, a.name
             ORDER BY total_stock DESC
             LIMIT 8"
        );

        // Top sản phẩm tồn kho nhiều nhất
        $topProducts = queryAll(
            "SELECT p.id, p.title, p.stock, p.price,
                    (p.stock * p.price) AS inventory_value
             FROM products p
             WHERE p.is_active = 1
             ORDER BY p.stock DESC
             LIMIT 12"
        );

        // Tổng doanh thu và lợi nhuận (doanh thu sau khi trừ chi phí vận chuyển)
        $revenue = queryOne(
            "SELECT
                SUM(total_amount)                              AS total_revenue,
                SUM(total_amount - IFNULL(shipping_cost, 0))  AS net_profit
             FROM orders
             WHERE payment_status = 'paid'"
        );

        // Tăng trưởng doanh thu so với tháng trước
        $thisMonth = (float)(queryOne(
            "SELECT SUM(total_amount) AS total FROM orders
             WHERE payment_status = 'paid'
               AND YEAR(created_at)  = YEAR(CURDATE())
               AND MONTH(created_at) = MONTH(CURDATE())"
        )['total'] ?? 0);
        $lastMonth = (float)(queryOne(
            "SELECT SUM(total_amount) AS total FROM orders
             WHERE payment_status = 'paid'
               AND YEAR(created_at)  = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
               AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))"
        )['total'] ?? 0);
        $revenueGrowth = $lastMonth > 0
            ? round((($thisMonth - $lastMonth) / $lastMonth) * 100, 2)
            : 0;

        jsonResponse(['success' => true, 'data' => [
            'byCategory'    => array_map(fn($r) => [
                'name'       => $r['name'],
                'value'      => (int)$r['total_stock'],
                'totalValue' => (float)$r['total_value'],
            ], $byCategory),
            'byAuthor'      => array_map(fn($r) => [
                'name'  => $r['name'],
                'value' => (int)$r['total_stock'],
            ], $byAuthor),
            'topProducts'   => array_map(fn($r) => [
                'id'              => (int)$r['id'],
                'title'           => $r['title'],
                'stock'           => (int)$r['stock'],
                'price'           => (float)$r['price'],
                'inventory_value' => (float)$r['inventory_value'],
            ], $topProducts),
            'totalRevenue'  => (float)($revenue['total_revenue'] ?? 0),
            'netProfit'     => (float)($revenue['net_profit']    ?? 0),
            'revenueGrowth' => $revenueGrowth,
        ]]);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
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

function handleAdminProducts($method, $pathParts) {
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
            $where[] = 'p.is_bestseller = 1';
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
        $allowed = ['category_id', 'author_id', 'publisher_id', 'title', 'title_en', 'description', 'short_description', 'isbn', 'pages', 'publish_year', 'language', 'translator', 'edition', 'format', 'price', 'compare_price', 'discount_percent', 'stock', 'sku', 'weight', 'meta_title', 'meta_description', 'is_active', 'is_featured', 'is_bestseller'];
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
        $allowed = ['category_id', 'author_id', 'publisher_id', 'title', 'title_en', 'description', 'short_description', 'isbn', 'pages', 'publish_year', 'language', 'translator', 'edition', 'format', 'price', 'compare_price', 'discount_percent', 'stock', 'sku', 'weight', 'meta_title', 'meta_description', 'is_active', 'is_featured', 'is_bestseller'];
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

    foreach (['category_id', 'author_id', 'publisher_id', 'pages', 'publish_year', 'discount_percent', 'stock', 'weight', 'is_active', 'is_featured', 'is_bestseller'] as $field) {
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
        $data['slug'] = slugifyText($input['name_en'] ?? $input['name'] ?? 'category') . '-' . substr((string)time(), -4);
        $id = insertRow('categories', $data);
        jsonResponse(['success' => true, 'message' => 'Da them danh muc', 'data' => queryOne("SELECT * FROM categories WHERE id = ?", [$id])], 201);
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

function handleAdminOrders($method, $pathParts) {
    $id = $pathParts[2] ?? null;

    if ($method === 'GET' && !$id) {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $where = '1=1';
        $params = [];

        if (!empty($_GET['status'])) {
            $where .= ' AND o.status = ?';
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['payment_status'])) {
            $where .= ' AND o.payment_status = ?';
            $params[] = $_GET['payment_status'];
        }
        if (!empty($_GET['return_status'])) {
            if (tableExists('return_requests')) {
                $where .= ' AND EXISTS (SELECT 1 FROM return_requests rr WHERE rr.order_id = o.id AND rr.status = ?)';
                $params[] = $_GET['return_status'];
            } else {
                $where .= ' AND 1=0';
            }
        }
        if (!empty($_GET['payment_method'])) {
            $where .= ' AND o.payment_method = ?';
            $params[] = $_GET['payment_method'];
        }
        if (!empty($_GET['search'])) {
            $like = '%' . $_GET['search'] . '%';
            $where .= ' AND (o.order_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR o.shipping_name LIKE ? OR u.email LIKE ? OR o.shipping_phone LIKE ? OR o.tracking_code LIKE ?)';
            $params[] = $like; $params[] = $like; $params[] = $like; $params[] = $like; $params[] = $like; $params[] = $like; $params[] = $like;
        }
        if (!empty($_GET['customer_name'])) {
            $like = '%' . $_GET['customer_name'] . '%';
            $where .= ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR o.shipping_name LIKE ? OR u.email LIKE ?)';
            $params[] = $like; $params[] = $like; $params[] = $like; $params[] = $like;
        }
        if (isset($_GET['min_amount']) && $_GET['min_amount'] !== '') {
            $where .= ' AND o.total_amount >= ?';
            $params[] = (float)$_GET['min_amount'];
        }
        if (isset($_GET['max_amount']) && $_GET['max_amount'] !== '') {
            $where .= ' AND o.total_amount <= ?';
            $params[] = (float)$_GET['max_amount'];
        }
        if (!empty($_GET['date_from'])) {
            $where .= ' AND DATE(o.created_at) >= ?';
            $params[] = $_GET['date_from'];
        }
        if (!empty($_GET['date_to'])) {
            $where .= ' AND DATE(o.created_at) <= ?';
            $params[] = $_GET['date_to'];
        }

        $sortMap = [
            'newest' => 'o.created_at DESC',
            'oldest' => 'o.created_at ASC',
            'amount_desc' => 'o.total_amount DESC',
            'amount_asc' => 'o.total_amount ASC',
        ];
        $orderBy = $sortMap[$_GET['sort'] ?? 'newest'] ?? 'o.created_at DESC';

        $count = (int)(queryOne(
            "SELECT COUNT(*) AS count FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE {$where}",
            $params
        )['count'] ?? 0);
        $returnSelect = tableExists('return_requests')
            ? ", (SELECT rr.status FROM return_requests rr WHERE rr.order_id = o.id ORDER BY rr.created_at DESC LIMIT 1) AS return_status,
                 (SELECT rr.type FROM return_requests rr WHERE rr.order_id = o.id ORDER BY rr.created_at DESC LIMIT 1) AS return_type"
            : ", NULL AS return_status, NULL AS return_type";
        $orders = queryAll(
            "SELECT o.*, u.first_name, u.last_name, u.email{$returnSelect}
             FROM orders o LEFT JOIN users u ON o.user_id = u.id
             WHERE {$where} ORDER BY {$orderBy} LIMIT ? OFFSET ?",
            array_merge($params, [$limit, $offset])
        );
        jsonResponse(['success' => true, 'data' => ['orders' => $orders, 'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'totalItems' => $count,
            'totalPages' => (int)ceil($count / $limit),
        ]]]);
    }

    if ($method === 'GET' && $id) {
        $order = queryOne("SELECT o.*, u.first_name, u.last_name, u.email, u.phone AS user_phone FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?", [$id]);
        if (!$order) {
            jsonResponse(['success' => false, 'message' => 'Khong tim thay don hang'], 404);
        }
        $order['items'] = queryAll("SELECT * FROM order_items WHERE order_id = ?", [$id]);
        $order['return_request'] = tableExists('return_requests')
            ? queryOne("SELECT rr.*, u.first_name, u.last_name, u.email FROM return_requests rr LEFT JOIN users u ON rr.user_id = u.id WHERE rr.order_id = ? ORDER BY rr.created_at DESC LIMIT 1", [$id])
            : null;
        jsonResponse(['success' => true, 'data' => $order]);
    }

    if ($method === 'PUT' && $id && (($pathParts[3] ?? '') === 'status')) {
        $input = requestJson();
        $newStatus = $input['status'] ?? 'pending';
        // 'paid' kept for backward-compat with DBs that have it; 'confirmed' is the live DB value
        $allowedOrderStatuses = ['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
        if (!in_array($newStatus, $allowedOrderStatuses, true)) {
            jsonResponse(['success' => false, 'message' => 'Trang thai don hang khong hop le'], 400);
        }
        $order = queryOne("SELECT * FROM orders WHERE id = ?", [$id]);
        if (!$order) {
            jsonResponse(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
        }
        $currentStatus = $order['status'] ?? 'pending';
        $allowedTransitions = [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['processing', 'cancelled'],
            'paid' => ['processing', 'cancelled'],
            'processing' => ['shipped', 'cancelled'],
            'shipped' => ['delivered'],
            'delivered' => ['refunded'],
            'cancelled' => [],
            'refunded' => [],
        ];
        if ($newStatus !== $currentStatus && !in_array($newStatus, $allowedTransitions[$currentStatus] ?? [], true)) {
            jsonResponse(['success' => false, 'message' => 'Khong the chuyen trang thai nguoc hoac bo qua quy trinh'], 400);
        }
        if ($newStatus === 'shipped') {
            $hasShippingProvider = !tableHasColumn('orders', 'shipping_provider') || !empty($order['shipping_provider']);
            if (empty($order['tracking_code']) || !$hasShippingProvider) {
                jsonResponse(['success' => false, 'message' => 'Vui lòng nhập thông tin vận chuyển trước khi chuyển sang đang giao'], 400);
            }
        }
        if ($newStatus === 'delivered' && ($order['status'] ?? '') !== 'shipped') {
            jsonResponse(['success' => false, 'message' => 'Don hang phai o trang thai dang giao truoc khi chuyen sang da giao'], 400);
        }
        $updateData = [
            'status' => $newStatus,
            'admin_note' => $input['admin_note'] ?? null,
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        // COD: tiền mặt khi nhận — chỉ xác nhận thanh toán khi giao thành công
        if (($order['payment_method'] ?? 'cod') === 'cod') {
            if ($newStatus === 'delivered') {
                $updateData['payment_status'] = 'paid';
            } elseif ($newStatus === 'refunded') {
                $updateData['payment_status'] = 'refunded';
            } elseif ($newStatus === 'cancelled' && $order['payment_status'] === 'paid') {
                $updateData['payment_status'] = 'refunded';
            }
        } else {
            // bank_transfer / card: admin xác nhận thanh toán khi chuyển sang trạng thái xử lý
            if (in_array($newStatus, ['confirmed', 'paid', 'processing', 'shipped', 'delivered'], true) && ($order['payment_status'] ?? 'pending') !== 'refunded') {
                $updateData['payment_status'] = 'paid';
            } elseif ($newStatus === 'refunded') {
                $updateData['payment_status'] = 'refunded';
            } elseif ($newStatus === 'cancelled' && $order['payment_status'] === 'paid') {
                $updateData['payment_status'] = 'refunded';
            }
        }

        if ($newStatus === 'shipped') {
            $updateData['shipped_at'] = date('Y-m-d H:i:s');
        }
        if ($newStatus === 'delivered') {
            $updateData['delivered_at'] = date('Y-m-d H:i:s');
        }
        updateRow('orders', $id, $updateData);
        if (in_array($newStatus, ['cancelled', 'refunded'], true) && ($order['payment_status'] ?? 'pending') === 'paid') {
            creditWallet($order['user_id'], (float)$order['total_amount'], 'Hoan tien don ' . $order['order_number'], 'order_refund', $id);
        }
        jsonResponse(['success' => true, 'message' => 'Đã cập nhật trạng thái đơn hàng']);
    }

    if ($method === 'PUT' && $id && (($pathParts[3] ?? '') === 'payment-status')) {
        $input = requestJson();
        $newPaymentStatus = $input['payment_status'] ?? 'pending';
        $allowedPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        if (!in_array($newPaymentStatus, $allowedPaymentStatuses, true)) {
            jsonResponse(['success' => false, 'message' => 'Trang thai thanh toan khong hop le'], 400);
        }
        $order = queryOne("SELECT * FROM orders WHERE id = ?", [$id]);
        if (!$order) {
            jsonResponse(['success' => false, 'message' => 'Khong tim thay don hang'], 404);
        }
        $updateData = ['payment_status' => $newPaymentStatus, 'updated_at' => date('Y-m-d H:i:s')];
        if ($newPaymentStatus === 'paid' && ($order['status'] ?? 'pending') === 'pending') {
            $updateData['status'] = 'confirmed';
        }
        if ($newPaymentStatus === 'refunded') {
            $updateData['status'] = 'refunded';
        }
        updateRow('orders', $id, $updateData);
        if ($newPaymentStatus === 'refunded' && ($order['payment_status'] ?? 'pending') === 'paid') {
            creditWallet($order['user_id'], (float)$order['total_amount'], 'Hoan tien don ' . $order['order_number'], 'payment_refund', $id);
        }
        jsonResponse(['success' => true, 'message' => 'Da cap nhat trang thai thanh toan']);
    }

    if ($method === 'PUT' && $id && (($pathParts[3] ?? '') === 'tracking')) {
        $input = requestJson();
        $order = queryOne("SELECT * FROM orders WHERE id = ?", [$id]);
        if (!$order) {
            jsonResponse(['success' => false, 'message' => 'Khong tim thay don hang'], 404);
        }
        if (in_array($order['status'] ?? '', ['delivered', 'cancelled', 'refunded'], true)) {
            jsonResponse(['success' => false, 'message' => 'Khong the cap nhat van chuyen cho don hang da ket thuc'], 400);
        }
        if (!in_array($order['status'] ?? '', ['processing', 'shipped'], true)) {
            jsonResponse(['success' => false, 'message' => 'Don hang phai o trang thai dang chuan bi hang truoc khi chuyen sang dang giao'], 400);
        }
        if (empty(trim((string)($input['tracking_code'] ?? '')))) {
            jsonResponse(['success' => false, 'message' => 'Vui lòng nhập mã vận đơn'], 400);
        }
        if (tableHasColumn('orders', 'shipping_provider') && empty(trim((string)($input['shipping_provider'] ?? '')))) {
            jsonResponse(['success' => false, 'message' => 'Vui lòng chọn đơn vị vận chuyển'], 400);
        }
        $updateData = [
            'tracking_code' => trim((string)$input['tracking_code']),
            'status' => 'shipped',
            'shipped_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];
        if (tableHasColumn('orders', 'shipping_provider')) {
            $updateData['shipping_provider'] = trim((string)$input['shipping_provider']);
        }
        if (isset($input['shipping_fee'])) {
            $updateData['shipping_cost'] = (float)$input['shipping_fee'];
        }
        updateRow('orders', $id, $updateData);
        jsonResponse(['success' => true, 'message' => 'Da cap nhat ma van don']);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}

function handleAdminReturnRequests($method, $pathParts, $currentUser) {
    if (!tableExists('return_requests')) {
        jsonResponse(['success' => false, 'message' => 'Chua tao bang return_requests. Vui long chay file migrate_order_workflow.sql'], 500);
    }

    $id = $pathParts[2] ?? null;

    if ($method === 'GET' && !$id) {
        $status = $_GET['status'] ?? '';
        $where = '1=1';
        $params = [];
        if ($status !== '') {
            $where .= ' AND rr.status = ?';
            $params[] = $status;
        }

        $requests = queryAll(
            "SELECT rr.*, o.order_number, o.total_amount, o.status AS order_status, o.payment_status,
                    u.first_name, u.last_name, u.email
             FROM return_requests rr
             LEFT JOIN orders o ON rr.order_id = o.id
             LEFT JOIN users u ON rr.user_id = u.id
             WHERE {$where}
             ORDER BY rr.created_at DESC
             LIMIT 100",
            $params
        );
        jsonResponse(['success' => true, 'data' => ['requests' => $requests]]);
    }

    if ($method === 'PUT' && $id) {
        $input = requestJson();
        $status = $input['status'] ?? 'pending';
        if (!in_array($status, ['pending', 'approved', 'rejected', 'completed'], true)) {
            jsonResponse(['success' => false, 'message' => 'Trang thai doi tra khong hop le'], 400);
        }

        $request = queryOne("SELECT * FROM return_requests WHERE id = ?", [$id]);
        if (!$request) {
            jsonResponse(['success' => false, 'message' => 'Khong tim thay yeu cau doi tra'], 404);
        }
        $currentStatus = $request['status'] ?? 'pending';
        $allowedTransitions = [
            'pending' => ['approved', 'rejected'],
            'approved' => ['completed', 'rejected'],
            'rejected' => [],
            'completed' => [],
        ];
        if ($status !== $currentStatus && !in_array($status, $allowedTransitions[$currentStatus] ?? [], true)) {
            jsonResponse(['success' => false, 'message' => 'Khong the chuyen trang thai doi tra theo thu tu nay'], 400);
        }

        $updateData = [
            'status' => $status,
            'admin_note' => $input['admin_note'] ?? null,
            'processed_by' => $currentUser['id'],
            'processed_at' => date('Y-m-d H:i:s'),
        ];
        updateRow('return_requests', $id, $updateData);

        if ($status === 'completed' && $currentStatus !== 'completed') {
            if (($request['type'] ?? 'return') === 'return') {
                $items = queryAll("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [$request['order_id']]);
                foreach ($items as $item) {
                    if (!empty($item['product_id'])) {
                        executeSql(
                            "UPDATE products SET stock = stock + ?, sales_count = CASE WHEN sales_count >= ? THEN sales_count - ? ELSE 0 END WHERE id = ?",
                            [$item['quantity'], $item['quantity'], $item['quantity'], $item['product_id']]
                        );
                    }
                }
                $order = queryOne("SELECT * FROM orders WHERE id = ?", [$request['order_id']]);
                updateRow('orders', $request['order_id'], [
                    'status' => 'refunded',
                    'payment_status' => 'refunded',
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
                if ($order && ($order['payment_status'] ?? 'pending') === 'paid') {
                    creditWallet($order['user_id'], (float)$order['total_amount'], 'Hoan tien tra hang ' . $order['order_number'], 'return_request', $id);
                }
            }
        }

        jsonResponse(['success' => true, 'message' => 'Da cap nhat yeu cau doi tra']);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}

function handleAdminWallets($method, $pathParts, $currentUser) {
    if (!tableExists('wallets') || !tableExists('wallet_transactions') || !tableExists('user_bank_accounts')) {
        jsonResponse(['success' => false, 'message' => 'Chua tao bang vi dien tu. Vui long chay migrate_order_workflow.sql'], 500);
    }

    $resource = $pathParts[2] ?? '';
    $id = $pathParts[3] ?? null;

    if ($method === 'GET' && $resource === '') {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = trim((string)($_GET['search'] ?? ''));
        $type = $_GET['type'] ?? '';
        $status = $_GET['status'] ?? '';
        $sort = $_GET['sort'] ?? 'newest';

        $where = '1=1';
        $params = [];
        if ($search !== '') {
            $where .= " AND (
                u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?
                OR wt.description LIKE ? OR wt.bank_name LIKE ? OR wt.bank_account_number LIKE ?
            )";
            $term = "%{$search}%";
            array_push($params, $term, $term, $term, $term, $term, $term);
        }
        if (in_array($type, ['credit', 'debit'], true)) {
            $where .= ' AND wt.type = ?';
            $params[] = $type;
        }
        if (in_array($status, ['pending', 'completed', 'rejected'], true)) {
            $where .= ' AND wt.status = ?';
            $params[] = $status;
        }

        $orderBy = match ($sort) {
            'oldest' => 'wt.created_at ASC',
            'amount_desc' => 'wt.amount DESC',
            'amount_asc' => 'wt.amount ASC',
            default => 'wt.created_at DESC',
        };

        $count = (int)(queryOne(
            "SELECT COUNT(*) AS count
             FROM wallet_transactions wt
             LEFT JOIN users u ON wt.user_id = u.id
             WHERE {$where}",
            $params
        )['count'] ?? 0);

        $transactions = queryAll(
            "SELECT wt.*, w.balance,
                    u.first_name, u.last_name, u.email,
                    uba.bank_name AS linked_bank_name,
                    uba.bank_account_number AS linked_bank_account_number,
                    uba.bank_account_name AS linked_bank_account_name
             FROM wallet_transactions wt
             LEFT JOIN wallets w ON wt.wallet_id = w.id
             LEFT JOIN users u ON wt.user_id = u.id
             LEFT JOIN user_bank_accounts uba
               ON uba.user_id = wt.user_id AND uba.is_active = 1 AND uba.is_default = 1
             WHERE {$where}
             ORDER BY {$orderBy}
             LIMIT {$limit} OFFSET {$offset}",
            $params
        );

        $stats = [
            'totalBalance' => (float)(queryOne("SELECT SUM(balance) AS total FROM wallets")['total'] ?? 0),
            'pendingWithdrawals' => (int)(queryOne("SELECT COUNT(*) AS count FROM wallet_transactions WHERE type = 'debit'  AND status = 'pending' AND reference_type = 'wallet_withdraw'")['count'] ?? 0),
            'pendingWithdrawAmount' => (float)(queryOne("SELECT SUM(amount) AS total FROM wallet_transactions WHERE type = 'debit'  AND status = 'pending' AND reference_type = 'wallet_withdraw'")['total'] ?? 0),
            'pendingDeposits' => (int)(queryOne("SELECT COUNT(*) AS count FROM wallet_transactions WHERE type = 'credit' AND status = 'pending' AND reference_type = 'wallet_deposit'")['count'] ?? 0),
            'pendingDepositAmount' => (float)(queryOne("SELECT SUM(amount) AS total FROM wallet_transactions WHERE type = 'credit' AND status = 'pending' AND reference_type = 'wallet_deposit'")['total'] ?? 0),
            'linkedBanks' => tableExists('user_bank_accounts')
                ? (int)(queryOne("SELECT COUNT(*) AS count FROM user_bank_accounts WHERE is_active = 1")['count'] ?? 0)
                : 0,
        ];

        jsonResponse(['success' => true, 'data' => [
            'transactions' => $transactions,
            'stats' => $stats,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'totalItems' => $count,
                'totalPages' => (int)ceil($count / $limit),
            ],
        ]]);
    }

    if ($method === 'PUT' && $resource === 'transactions' && $id) {
        global $pdo;
        $input     = requestJson();
        $newStatus = $input['status'] ?? '';
        if (!in_array($newStatus, ['completed', 'rejected'], true)) {
            jsonResponse(['success' => false, 'message' => 'Trang thai giao dich khong hop le'], 400);
        }

        $transaction = queryOne("SELECT * FROM wallet_transactions WHERE id = ?", [$id]);
        if (!$transaction) {
            jsonResponse(['success' => false, 'message' => 'Khong tim thay giao dich vi'], 404);
        }
        if (($transaction['status'] ?? '') !== 'pending') {
            jsonResponse(['success' => false, 'message' => 'Chi xu ly duoc giao dich dang cho'], 400);
        }

        $type    = $transaction['type']           ?? '';
        $refType = $transaction['reference_type'] ?? '';

        $isDeposit  = ($type === 'credit' && $refType === 'wallet_deposit');
        $isWithdraw = ($type === 'debit'  && $refType === 'wallet_withdraw');

        if (!$isDeposit && !$isWithdraw) {
            jsonResponse(['success' => false, 'message' => 'Loai giao dich nay khong the duyet thu cong'], 400);
        }

        $defaultNotes = [
            'deposit_completed'  => 'Yêu cầu nạp tiền đã được duyệt',
            'deposit_rejected'   => 'Yêu cầu nạp tiền bị từ chối',
            'withdraw_completed' => 'Yêu cầu rút tiền đã được xử lý',
            'withdraw_rejected'  => 'Yêu cầu rút tiền bị từ chối',
        ];
        $noteKey   = ($isDeposit ? 'deposit' : 'withdraw') . '_' . $newStatus;
        $adminNote = trim((string)($input['admin_note'] ?? $defaultNotes[$noteKey]));
        $amount    = (float)$transaction['amount'];
        $userId    = (int)$transaction['user_id'];
        $bankData  = [
            'bank_name'           => $transaction['bank_name'],
            'bank_account_number' => $transaction['bank_account_number'],
            'bank_account_name'   => $transaction['bank_account_name'],
        ];

        // Toàn bộ thao tác trong một DB transaction — đảm bảo tính nguyên tử
        $pdo->beginTransaction();
        try {
            executeSql(
                "UPDATE wallet_transactions SET status = ?, description = ? WHERE id = ?",
                [$newStatus, $adminNote, $id]
            );

            if ($isDeposit && $newStatus === 'completed') {
                // Duyệt nạp tiền → khoá hàng và cộng số dư
                $wallet = queryOne("SELECT * FROM wallets WHERE user_id = ? FOR UPDATE", [$userId]);
                if (!$wallet) {
                    executeSql("INSERT INTO wallets (user_id, balance) VALUES (?, 0)", [$userId]);
                    $wallet = queryOne("SELECT * FROM wallets WHERE user_id = ?", [$userId]);
                }
                executeSql(
                    "UPDATE wallets SET balance = balance + ?, updated_at = NOW() WHERE id = ?",
                    [$amount, $wallet['id']]
                );
            } elseif ($isWithdraw && $newStatus === 'rejected') {
                // Từ chối rút tiền → khoá hàng và hoàn số dư + ghi log
                $wallet = queryOne("SELECT * FROM wallets WHERE user_id = ? FOR UPDATE", [$userId]);
                executeSql(
                    "UPDATE wallets SET balance = balance + ?, updated_at = NOW() WHERE id = ?",
                    [$amount, $wallet['id']]
                );
                executeSql(
                    "INSERT INTO wallet_transactions
                     (wallet_id, user_id, type, amount, status, description,
                      reference_type, reference_id, bank_name, bank_account_number, bank_account_name)
                     VALUES (?, ?, 'credit', ?, 'completed', ?, 'wallet_withdraw_rejected', ?, ?, ?, ?)",
                    [
                        $wallet['id'], $userId, $amount,
                        'Hoàn lại tiền rút bị từ chối', $id,
                        $bankData['bank_name'],
                        $bankData['bank_account_number'],
                        $bankData['bank_account_name'],
                    ]
                );
            }
            // Duyệt rút tiền (completed): không làm gì — tiền đã bị trừ lúc user yêu cầu
            // Từ chối nạp tiền (rejected): không làm gì — tiền chưa được cộng

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        jsonResponse(['success' => true, 'message' => 'Đã cập nhật giao dịch ví']);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}

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

function guid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
?>

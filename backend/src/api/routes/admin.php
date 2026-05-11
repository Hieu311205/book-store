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
    } elseif ($section === 'users') {
        requireSuperAdmin($user);
        handleAdminUsers($method, $pathParts, $user);
    } elseif ($section === 'coupons') {
        requireSuperAdmin($user);
        handleSimpleResource($method, $pathParts, 'coupons', ['code', 'type', 'value', 'min_purchase', 'max_discount', 'usage_limit', 'used_count', 'per_user_limit', 'start_date', 'end_date', 'is_active']);
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
        $lowStockProducts = (int)(queryOne("SELECT COUNT(*) AS count FROM products WHERE stock < 10")['count'] ?? 0);
        $unreadMessages = (int)(queryOne("SELECT COUNT(*) AS count FROM contact_messages WHERE is_read = 0")['count'] ?? 0);

        $items = [];
        if ($pendingOrders > 0) {
            $items[] = [
                'id' => 'pending-orders',
                'type' => 'orders',
                'title' => 'Don hang cho xu ly',
                'message' => "{$pendingOrders} don hang dang cho xu ly",
                'to' => '/orders',
            ];
        }
        if ($lowStockProducts > 0) {
            $items[] = [
                'id' => 'low-stock',
                'type' => 'products',
                'title' => 'Sach sap het hang',
                'message' => "{$lowStockProducts} sach con duoi 10 cuon",
                'to' => '/products?status=low_stock',
            ];
        }
        if ($unreadMessages > 0) {
            $items[] = [
                'id' => 'unread-messages',
                'type' => 'messages',
                'title' => 'Tin nhan moi',
                'message' => "{$unreadMessages} tin nhan lien he chua doc",
                'to' => '/contact-messages',
            ];
        }

        jsonResponse(['success' => true, 'data' => [
            'count' => $pendingOrders + $lowStockProducts + $unreadMessages,
            'items' => $items,
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
        jsonResponse(['success' => true, 'data' => queryAll(
            "SELECT c.*,
                    p.name AS parent_name,
                    (SELECT COUNT(*) FROM products pr WHERE pr.category_id = c.id) AS product_count
             FROM categories c
             LEFT JOIN categories p ON c.parent_id = p.id
             ORDER BY c.sort_order ASC, c.id ASC"
        )]);
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

        $count = (int)(queryOne(
            "SELECT COUNT(*) AS count FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE {$where}",
            $params
        )['count'] ?? 0);
        $orders = queryAll(
            "SELECT o.*, u.first_name, u.last_name, u.email
             FROM orders o LEFT JOIN users u ON o.user_id = u.id
             WHERE {$where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?",
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
        jsonResponse(['success' => true, 'data' => $order]);
    }

    if ($method === 'PUT' && $id && (($pathParts[3] ?? '') === 'status')) {
        $input = requestJson();
        $newStatus = $input['status'] ?? 'pending';
        $order = queryOne("SELECT payment_method, payment_status FROM orders WHERE id = ?", [$id]);
        if (!$order) {
            jsonResponse(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
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
            if (in_array($newStatus, ['paid', 'processing', 'shipped', 'delivered'], true)) {
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
        jsonResponse(['success' => true, 'message' => 'Đã cập nhật trạng thái đơn hàng']);
    }

    if ($method === 'PUT' && $id && (($pathParts[3] ?? '') === 'payment-status')) {
        $input = requestJson();
        $newPaymentStatus = $input['payment_status'] ?? 'pending';
        $allowedPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        if (!in_array($newPaymentStatus, $allowedPaymentStatuses, true)) {
            jsonResponse(['success' => false, 'message' => 'Trang thai thanh toan khong hop le'], 400);
        }
        updateRow('orders', $id, ['payment_status' => $newPaymentStatus, 'updated_at' => date('Y-m-d H:i:s')]);
        jsonResponse(['success' => true, 'message' => 'Da cap nhat trang thai thanh toan']);
    }

    if ($method === 'PUT' && $id && (($pathParts[3] ?? '') === 'tracking')) {
        updateRow('orders', $id, ['tracking_code' => requestJson()['tracking_code'] ?? null, 'updated_at' => date('Y-m-d H:i:s')]);
        jsonResponse(['success' => true, 'message' => 'Da cap nhat ma van don']);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}

function handleAdminUsers($method, $pathParts, $currentUser) {
    $id = $pathParts[2] ?? null;

    if ($method === 'GET' && !$id) {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $count = (int)(queryOne("SELECT COUNT(*) AS count FROM users")['count'] ?? 0);
        $users = queryAll("SELECT id, ugid, email, first_name, last_name, phone, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?", [$limit, $offset]);
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

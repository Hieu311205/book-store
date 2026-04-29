<?php
function handleCart($method, $pathParts) {
    $action = $pathParts[1] ?? '';
    if ($method === 'GET' && $action === '') {
        cartGet();
    } elseif ($method === 'POST' && $action === 'add') {
        cartAdd();
    } elseif ($method === 'PUT' && $action === 'update') {
        cartUpdate();
    } elseif ($method === 'DELETE' && $action === 'remove' && isset($pathParts[2])) {
        cartRemove($pathParts[2]);
    } elseif ($method === 'DELETE' && $action === 'clear') {
        cartClear();
    } elseif ($method === 'POST' && in_array($action, ['coupon', 'apply-coupon'], true)) {
        cartApplyCoupon();
    } else {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy thao tác'], 404);
    }
}

function cartOwnerClause(&$params) {
    $user = currentUser();
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
    if ($user) {
        $params[] = $user['id'];
        return 'ci.user_id = ?';
    }
    if ($sessionId) {
        $params[] = $sessionId;
        return 'ci.session_id = ?';
    }
    return null;
}

function cartGet() {
    $params = [];
    $owner = cartOwnerClause($params);
    if (!$owner) {
        cartResponse([]);
    }

    $items = queryAll(
        "SELECT ci.*, p.title, p.title_en, p.slug, p.price, p.compare_price, p.discount_percent,
                p.stock, a.name AS author_name,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 ORDER BY sort_order LIMIT 1) AS image_url
         FROM cart_items ci
         LEFT JOIN products p ON ci.product_id = p.id
         LEFT JOIN authors a ON p.author_id = a.id
         WHERE {$owner}",
        $params
    );
    cartResponse($items);
}

function cartResponse($items) {
    $subtotal = 0;
    $discount = 0;
    $itemCount = 0;
    foreach ($items as &$item) {
        $item['line_total'] = (float)$item['price'] * (int)$item['quantity'];
        $subtotal += $item['line_total'];
        $original = $item['compare_price'] ?: $item['price'];
        $discount += ((float)$original - (float)$item['price']) * (int)$item['quantity'];
        $itemCount += (int)$item['quantity'];
    }
    jsonResponse([
        'success' => true,
        'data' => [
            'items' => $items,
            'summary' => [
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $subtotal,
                'item_count' => $itemCount,
            ],
        ],
    ]);
}

function cartAdd() {
    $input = requestJson();
    $productId = (int)($input['product_id'] ?? 0);
    $quantity = max(1, (int)($input['quantity'] ?? 1));
    $user = currentUser();
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;

    if (!$user && !$sessionId) {
        jsonResponse(['success' => false, 'message' => 'Cần mã phiên hoặc đăng nhập'], 400);
    }

    $product = queryOne("SELECT id, stock FROM products WHERE id = ? AND is_active = 1", [$productId]);
    if (!$product) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy sách'], 404);
    }

    $params = $user ? [$user['id'], $productId] : [$sessionId, $productId];
    $where = $user ? 'user_id = ?' : 'session_id = ?';
    $existing = queryOne("SELECT * FROM cart_items WHERE {$where} AND product_id = ?", $params);
    $newQuantity = $quantity + (int)($existing['quantity'] ?? 0);
    if ((int)$product['stock'] < $newQuantity) {
        jsonResponse(['success' => false, 'message' => 'Số lượng tồn kho không đủ'], 400);
    }

    if ($existing) {
        executeSql("UPDATE cart_items SET quantity = ? WHERE id = ?", [$newQuantity, $existing['id']]);
    } else {
        insertRow('cart_items', [
            'user_id' => $user['id'] ?? null,
            'session_id' => $user ? null : $sessionId,
            'product_id' => $productId,
            'quantity' => $quantity,
        ]);
    }
    cartGet();
}

function cartUpdate() {
    $input = requestJson();
    $productId = (int)($input['product_id'] ?? 0);
    $quantity = (int)($input['quantity'] ?? 1);
    if ($quantity < 1) {
        cartRemove($productId);
    }
    $product = queryOne("SELECT stock FROM products WHERE id = ? AND is_active = 1", [$productId]);
    if (!$product) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy sách'], 404);
    }
    if ((int)$product['stock'] < $quantity) {
        jsonResponse(['success' => false, 'message' => 'Số lượng tồn kho không đủ'], 400);
    }
    $user = currentUser();
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
    if ($user) {
        executeSql("UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?", [$quantity, $user['id'], $productId]);
    } else {
        executeSql("UPDATE cart_items SET quantity = ? WHERE session_id = ? AND product_id = ?", [$quantity, $sessionId, $productId]);
    }
    cartGet();
}

function cartRemove($productId) {
    $user = currentUser();
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
    if ($user) {
        executeSql("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?", [$user['id'], $productId]);
    } elseif ($sessionId) {
        executeSql("DELETE FROM cart_items WHERE session_id = ? AND product_id = ?", [$sessionId, $productId]);
    }
    cartGet();
}

function cartClear() {
    $user = currentUser();
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
    if ($user) {
        executeSql("DELETE FROM cart_items WHERE user_id = ?", [$user['id']]);
    } elseif ($sessionId) {
        executeSql("DELETE FROM cart_items WHERE session_id = ?", [$sessionId]);
    }
    cartResponse([]);
}

function cartApplyCoupon() {
    $input = requestJson();
    $code = $input['code'] ?? '';
    $coupon = queryOne(
        "SELECT id, code, type, value, min_purchase, max_discount
         FROM coupons
         WHERE code = ? AND is_active = 1
           AND (start_date IS NULL OR start_date <= NOW())
           AND (end_date IS NULL OR end_date >= NOW())",
        [$code]
    );
    if (!$coupon) {
        jsonResponse(['success' => false, 'message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn'], 400);
    }
    jsonResponse(['success' => true, 'message' => 'Đã áp dụng mã giảm giá', 'data' => ['coupon' => $coupon]]);
}
?>

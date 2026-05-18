<?php
function handleOrders($method, $pathParts) {
    $user = requireUser();
    $id = $pathParts[1] ?? null;
    if ($method === 'POST' && !$id) {
        createOrder($user);
    } elseif ($method === 'GET' && !$id) {
        listOrders($user);
    } elseif ($method === 'GET' && ($pathParts[2] ?? '') === 'track') {
        trackOrder($user, $id);
    } elseif ($method === 'GET' && $id) {
        getOrder($user, $id);
    } elseif ($method === 'POST' && ($pathParts[2] ?? '') === 'cancel') {
        cancelOrder($user, $id);
    } elseif ($method === 'POST' && ($pathParts[2] ?? '') === 'confirm-received') {
        confirmReceived($user, $id);
    } elseif ($method === 'POST' && ($pathParts[2] ?? '') === 'return-request') {
        requestReturnOrder($user, $id);
    } else {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy thao tác'], 404);
    }
}

function createOrder($user) {
    $input = requestJson();
    $addressId = (int)($input['address_id'] ?? 0);
    $shippingMethod = $input['shipping_method'] ?? 'giao_hang_tiet_kiem';
    $allowedShippingMethods = ['giao_hang_tiet_kiem', 'ghn', 'viettel_post', 'shop_delivery', 'standard', 'express'];
    if (!in_array($shippingMethod, $allowedShippingMethods, true)) {
        $shippingMethod = 'giao_hang_tiet_kiem';
    }
    $paymentMethod = $input['payment_method'] ?? 'cod';
    $allowedPaymentMethods = ['cod', 'bank_transfer', 'card'];
    if (!in_array($paymentMethod, $allowedPaymentMethods, true)) {
        $paymentMethod = 'cod';
    }
    $couponCode = $input['coupon_code'] ?? null;
    $address = queryOne("SELECT * FROM user_addresses WHERE id = ? AND user_id = ?", [$addressId, $user['id']]);
    if (!$address) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy địa chỉ'], 400);
    }

    $shouldClearCart = true;
    $selectedCartProductIds = [];
    $directItems = $input['items'] ?? null;
    if (is_array($directItems) && count($directItems) > 0) {
        $shouldClearCart = !empty($input['clear_selected_cart_items']);
        $items = [];
        foreach ($directItems as $directItem) {
            $productId = (int)($directItem['product_id'] ?? 0);
            $quantity = max(1, (int)($directItem['quantity'] ?? 1));
            if ($productId <= 0) {
                continue;
            }
            $product = queryOne(
                "SELECT id AS product_id, title, price, stock,
                        (SELECT image_url FROM product_images WHERE product_id = products.id AND is_primary = 1 ORDER BY sort_order LIMIT 1) AS image_url
                 FROM products
                 WHERE id = ? AND is_active = 1",
                [$productId]
            );
            if ($product) {
                $product['quantity'] = $quantity;
                $items[] = $product;
                $selectedCartProductIds[] = $productId;
            }
        }
    } else {
        $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
        $cartSql = "SELECT ci.*, p.title, p.price, p.stock,
                    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 ORDER BY sort_order LIMIT 1) AS image_url
             FROM cart_items ci LEFT JOIN products p ON ci.product_id = p.id
             WHERE ci.user_id = ?";
        $cartParams = [$user['id']];
        if ($sessionId) {
            $cartSql .= " OR ci.session_id = ?";
            $cartParams[] = $sessionId;
        }
        $items = queryAll($cartSql, $cartParams);

        // Nếu vẫn rỗng và có session, thử merge session cart trước
        if (!$items && $sessionId) {
            executeSql(
                "UPDATE cart_items SET user_id = ?, session_id = NULL WHERE session_id = ?",
                [$user['id'], $sessionId]
            );
            $items = queryAll(
                "SELECT ci.*, p.title, p.price, p.stock,
                        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 ORDER BY sort_order LIMIT 1) AS image_url
                 FROM cart_items ci LEFT JOIN products p ON ci.product_id = p.id
                 WHERE ci.user_id = ?",
                [$user['id']]
            );
        }
    }
    if (!$items) {
        jsonResponse(['success' => false, 'message' => 'Giỏ hàng đang trống'], 400);
    }
    foreach ($items as $item) {
        if ((int)$item['stock'] < (int)$item['quantity']) {
            jsonResponse(['success' => false, 'message' => "Không đủ tồn kho cho {$item['title']}"], 400);
        }
    }

    $subtotal = array_reduce($items, fn($sum, $item) => $sum + ((float)$item['price'] * (int)$item['quantity']), 0);
    $shippingFees = [
        'giao_hang_tiet_kiem' => 25000,
        'ghn' => 30000,
        'viettel_post' => 35000,
        'shop_delivery' => 20000,
        'standard' => 25000,
        'express' => 50000,
    ];
    $shippingCost = $shippingFees[$shippingMethod] ?? 25000;
    $discount = 0;
    $coupon = null;
    if ($couponCode) {
        $coupon = queryOne("SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()) AND (usage_limit IS NULL OR used_count < usage_limit)", [$couponCode]);
        if ($coupon && $subtotal >= (float)$coupon['min_purchase']) {
            $discount = $coupon['type'] === 'percentage' ? floor($subtotal * ((float)$coupon['value'] / 100)) : (float)$coupon['value'];
            if ($coupon['max_discount'] && $discount > (float)$coupon['max_discount']) {
                $discount = (float)$coupon['max_discount'];
            }
        }
    }

    $orderData = [
        'order_number' => 'ORD-' . date('ymd') . strtoupper(substr(uniqid(), -5)),
        'user_id' => $user['id'],
        'shipping_name' => $address['full_name'],
        'shipping_phone' => $address['phone'],
        'shipping_province' => $address['province'],
        'shipping_city' => $address['city'],
        'shipping_postal_code' => $address['postal_code'],
        'shipping_address' => $address['address'],
        'subtotal' => $subtotal,
        'shipping_cost' => $shippingCost,
        'discount_amount' => $discount,
        'tax_amount' => 0,
        'total_amount' => $subtotal + $shippingCost - $discount,
        'coupon_id' => $coupon['id'] ?? null,
        'coupon_code' => $coupon['code'] ?? null,
        'status' => 'pending',
        'payment_status' => 'pending',
        'payment_method' => $paymentMethod,
        'shipping_method' => $shippingMethod,
        'customer_note' => $input['customer_note'] ?? null,
    ];
    if (tableHasColumn('orders', 'shipping_provider')) {
        $orderData['shipping_provider'] = $shippingMethod;
    }

    global $pdo;
    $pdo->beginTransaction();
    try {
        $orderId = insertRow('orders', $orderData);

        foreach ($items as $item) {
            insertRow('order_items', [
                'order_id'      => $orderId,
                'product_id'    => $item['product_id'],
                'product_title' => $item['title'],
                'product_image' => $item['image_url'],
                'price'         => $item['price'],
                'quantity'      => $item['quantity'],
                'total'         => (float)$item['price'] * (int)$item['quantity'],
            ]);
            executeSql(
                "UPDATE products SET stock = stock - ?, sales_count = COALESCE(sales_count, 0) + ? WHERE id = ?",
                [$item['quantity'], $item['quantity'], $item['product_id']]
            );
        }

        if ($shouldClearCart) {
            $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
            if ($selectedCartProductIds) {
                $placeholders = implode(',', array_fill(0, count($selectedCartProductIds), '?'));
                executeSql("DELETE FROM cart_items WHERE user_id = ? AND product_id IN ({$placeholders})", array_merge([$user['id']], $selectedCartProductIds));
                if ($sessionId) {
                    executeSql("DELETE FROM cart_items WHERE session_id = ? AND product_id IN ({$placeholders})", array_merge([$sessionId], $selectedCartProductIds));
                }
            } else {
                executeSql("DELETE FROM cart_items WHERE user_id = ?", [$user['id']]);
                if ($sessionId) {
                    executeSql("DELETE FROM cart_items WHERE session_id = ?", [$sessionId]);
                }
            }
        }

        if ($coupon) {
            executeSql("UPDATE coupons SET used_count = COALESCE(used_count, 0) + 1 WHERE id = ?", [$coupon['id']]);
            insertRow('coupon_usage', ['coupon_id' => $coupon['id'], 'user_id' => $user['id'], 'order_id' => $orderId]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'Không thể tạo đơn hàng: ' . $e->getMessage()], 500);
    }

    jsonResponse(['success' => true, 'message' => 'Đã tạo đơn hàng', 'data' => queryOne("SELECT * FROM orders WHERE id = ?", [$orderId])], 201);
}

function listOrders($user) {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int)($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;
    $where = "user_id = ?";
    $params = [$user['id']];
    if (!empty($_GET['status'])) {
        $where .= " AND status = ?";
        $params[] = $_GET['status'];
    }
    $count = (int)(queryOne("SELECT COUNT(*) AS count FROM orders WHERE {$where}", $params)['count'] ?? 0);
    $returnSelect = tableExists('return_requests')
        ? ", (SELECT rr.status FROM return_requests rr WHERE rr.order_id = orders.id ORDER BY rr.created_at DESC LIMIT 1) AS return_status,
             (SELECT rr.type FROM return_requests rr WHERE rr.order_id = orders.id ORDER BY rr.created_at DESC LIMIT 1) AS return_type"
        : ", NULL AS return_status, NULL AS return_type";
    $orders = queryAll("SELECT orders.*{$returnSelect} FROM orders WHERE {$where} ORDER BY created_at DESC LIMIT ? OFFSET ?", array_merge($params, [$limit, $offset]));
    jsonResponse(['success' => true, 'data' => ['orders' => $orders, 'pagination' => ['page' => $page, 'limit' => $limit, 'totalItems' => $count, 'totalPages' => (int)ceil($count / $limit)]]]);
}

function getOrder($user, $id) {
    $order = queryOne("SELECT * FROM orders WHERE id = ? AND user_id = ?", [$id, $user['id']]);
    if (!$order) jsonResponse(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
    $order['items'] = queryAll("SELECT * FROM order_items WHERE order_id = ?", [$id]);
    $order['return_request'] = tableExists('return_requests')
        ? queryOne("SELECT * FROM return_requests WHERE order_id = ? ORDER BY created_at DESC LIMIT 1", [$id])
        : null;
    jsonResponse(['success' => true, 'data' => $order]);
}

function trackOrder($user, $id) {
    $shippingProviderSelect = tableHasColumn('orders', 'shipping_provider') ? ', shipping_provider' : '';
    $order = queryOne("SELECT id, order_number, status, payment_status, shipping_method, tracking_code, shipped_at, delivered_at, created_at{$shippingProviderSelect} FROM orders WHERE id = ? AND user_id = ?", [$id, $user['id']]);
    if (!$order) jsonResponse(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
    jsonResponse(['success' => true, 'data' => $order]);
}

function cancelOrder($user, $id) {
    $order = queryOne("SELECT * FROM orders WHERE id = ? AND user_id = ?", [$id, $user['id']]);
    if (!$order) jsonResponse(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
    if (!in_array($order['status'], ['pending', 'confirmed', 'paid'], true)) {
        jsonResponse(['success' => false, 'message' => 'Không thể hủy đơn hàng ở trạng thái này'], 400);
    }
    $items = queryAll("SELECT * FROM order_items WHERE order_id = ?", [$id]);
    foreach ($items as $item) {
        executeSql("UPDATE products SET stock = stock + ?, sales_count = CASE WHEN sales_count >= ? THEN sales_count - ? ELSE 0 END WHERE id = ?", [$item['quantity'], $item['quantity'], $item['quantity'], $item['product_id']]);
    }
    $updateData = ['status' => 'cancelled', 'updated_at' => date('Y-m-d H:i:s')];
    if (($order['payment_status'] ?? 'pending') === 'paid') {
        $updateData['payment_status'] = 'refunded';
    }
    updateRow('orders', $id, $updateData);
    jsonResponse(['success' => true, 'message' => 'Đã hủy đơn hàng']);
}

function confirmReceived($user, $id) {
    $order = queryOne("SELECT * FROM orders WHERE id = ? AND user_id = ?", [$id, $user['id']]);
    if (!$order) jsonResponse(['success' => false, 'message' => 'Khong tim thay don hang'], 404);
    if (($order['status'] ?? '') !== 'shipped') {
        jsonResponse(['success' => false, 'message' => 'Chi co the xac nhan khi don dang giao'], 400);
    }

    $updateData = [
        'status' => 'delivered',
        'delivered_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s'),
    ];
    if (($order['payment_method'] ?? 'cod') === 'cod') {
        $updateData['payment_status'] = 'paid';
    }
    updateRow('orders', $id, $updateData);
    jsonResponse(['success' => true, 'message' => 'Da xac nhan nhan hang']);
}

function requestReturnOrder($user, $id) {
    if (!tableExists('return_requests')) {
        jsonResponse(['success' => false, 'message' => 'Chua tao bang return_requests. Vui long chay file migrate_order_workflow.sql'], 500);
    }

    $input = requestJson();
    $type = $input['type'] ?? 'return';
    if (!in_array($type, ['return', 'exchange'], true)) {
        jsonResponse(['success' => false, 'message' => 'Loai yeu cau khong hop le'], 400);
    }

    $reason = trim((string)($input['reason'] ?? ''));
    if ($reason === '') {
        jsonResponse(['success' => false, 'message' => 'Vui long nhap ly do doi tra'], 400);
    }

    $order = queryOne("SELECT * FROM orders WHERE id = ? AND user_id = ?", [$id, $user['id']]);
    if (!$order) {
        jsonResponse(['success' => false, 'message' => 'Khong tim thay don hang'], 404);
    }
    if (($order['status'] ?? '') !== 'delivered') {
        jsonResponse(['success' => false, 'message' => 'Chi co the yeu cau doi tra khi don da giao thanh cong'], 400);
    }

    $existing = queryOne(
        "SELECT id FROM return_requests WHERE order_id = ? AND status IN ('pending', 'approved') ORDER BY created_at DESC LIMIT 1",
        [$id]
    );
    if ($existing) {
        jsonResponse(['success' => false, 'message' => 'Don hang da co yeu cau doi tra dang xu ly'], 400);
    }

    $requestId = insertRow('return_requests', [
        'order_id' => $id,
        'user_id' => $user['id'],
        'type' => $type,
        'reason' => $reason,
        'note' => trim((string)($input['note'] ?? '')) ?: null,
        'status' => 'pending',
    ]);

    jsonResponse([
        'success' => true,
        'message' => 'Da gui yeu cau doi tra',
        'data' => queryOne("SELECT * FROM return_requests WHERE id = ?", [$requestId]),
    ], 201);
}
?>

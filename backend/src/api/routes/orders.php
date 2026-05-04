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
    } else {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy thao tác'], 404);
    }
}

function createOrder($user) {
    $input = requestJson();
    $addressId = (int)($input['address_id'] ?? 0);
    $shippingMethod = $input['shipping_method'] ?? 'standard';
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

    $items = queryAll(
        "SELECT ci.*, p.title, p.price, p.stock,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 ORDER BY sort_order LIMIT 1) AS image_url
         FROM cart_items ci LEFT JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = ?",
        [$user['id']]
    );
    if (!$items) {
        jsonResponse(['success' => false, 'message' => 'Giỏ hàng đang trống'], 400);
    }
    foreach ($items as $item) {
        if ((int)$item['stock'] < (int)$item['quantity']) {
            jsonResponse(['success' => false, 'message' => "Không đủ tồn kho cho {$item['title']}"], 400);
        }
    }

    $subtotal = array_reduce($items, fn($sum, $item) => $sum + ((float)$item['price'] * (int)$item['quantity']), 0);
    $shippingCost = $shippingMethod === 'express' ? 50000 : 25000;
    $discount = 0;
    $coupon = null;
    if ($couponCode) {
        $coupon = queryOne("SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW())", [$couponCode]);
        if ($coupon && $subtotal >= (float)$coupon['min_purchase']) {
            $discount = $coupon['type'] === 'percentage' ? floor($subtotal * ((float)$coupon['value'] / 100)) : (float)$coupon['value'];
            if ($coupon['max_discount'] && $discount > (float)$coupon['max_discount']) {
                $discount = (float)$coupon['max_discount'];
            }
        }
    }

    $orderId = insertRow('orders', [
        'order_number' => 'ORD-' . substr((string)time(), -8) . random_int(100, 999),
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
    ]);

    foreach ($items as $item) {
        insertRow('order_items', [
            'order_id' => $orderId,
            'product_id' => $item['product_id'],
            'product_title' => $item['title'],
            'product_image' => $item['image_url'],
            'price' => $item['price'],
            'quantity' => $item['quantity'],
            'total' => (float)$item['price'] * (int)$item['quantity'],
        ]);
        executeSql("UPDATE products SET stock = stock - ?, sales_count = COALESCE(sales_count, 0) + ? WHERE id = ?", [$item['quantity'], $item['quantity'], $item['product_id']]);
    }
    executeSql("DELETE FROM cart_items WHERE user_id = ?", [$user['id']]);
    if ($coupon) {
        executeSql("UPDATE coupons SET used_count = COALESCE(used_count, 0) + 1 WHERE id = ?", [$coupon['id']]);
        insertRow('coupon_usage', ['coupon_id' => $coupon['id'], 'user_id' => $user['id'], 'order_id' => $orderId]);
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
    $orders = queryAll("SELECT * FROM orders WHERE {$where} ORDER BY created_at DESC LIMIT ? OFFSET ?", array_merge($params, [$limit, $offset]));
    jsonResponse(['success' => true, 'data' => ['orders' => $orders, 'pagination' => ['page' => $page, 'limit' => $limit, 'totalItems' => $count, 'totalPages' => (int)ceil($count / $limit)]]]);
}

function getOrder($user, $id) {
    $order = queryOne("SELECT * FROM orders WHERE id = ? AND user_id = ?", [$id, $user['id']]);
    if (!$order) jsonResponse(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
    $order['items'] = queryAll("SELECT * FROM order_items WHERE order_id = ?", [$id]);
    jsonResponse(['success' => true, 'data' => $order]);
}

function trackOrder($user, $id) {
    $order = queryOne("SELECT id, order_number, status, payment_status, tracking_code, shipped_at, delivered_at, created_at FROM orders WHERE id = ? AND user_id = ?", [$id, $user['id']]);
    if (!$order) jsonResponse(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
    jsonResponse(['success' => true, 'data' => $order]);
}

function cancelOrder($user, $id) {
    $order = queryOne("SELECT * FROM orders WHERE id = ? AND user_id = ?", [$id, $user['id']]);
    if (!$order) jsonResponse(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
    if (!in_array($order['status'], ['pending', 'paid'], true)) {
        jsonResponse(['success' => false, 'message' => 'Không thể hủy đơn hàng này'], 400);
    }
    $items = queryAll("SELECT * FROM order_items WHERE order_id = ?", [$id]);
    foreach ($items as $item) {
        executeSql("UPDATE products SET stock = stock + ?, sales_count = CASE WHEN sales_count >= ? THEN sales_count - ? ELSE 0 END WHERE id = ?", [$item['quantity'], $item['quantity'], $item['quantity'], $item['product_id']]);
    }
    updateRow('orders', $id, ['status' => 'cancelled', 'updated_at' => date('Y-m-d H:i:s')]);
    jsonResponse(['success' => true, 'message' => 'Đã hủy đơn hàng']);
}
?>

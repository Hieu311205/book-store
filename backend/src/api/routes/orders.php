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
    // ── BƯỚC 6: Nhận toàn bộ dữ liệu đơn hàng từ frontend ──────────────────
    $input = requestJson();

    // Địa chỉ giao hàng (bắt buộc)
    $addressId = (int)($input['address_id'] ?? 0);

    // Đơn vị vận chuyển — chỉ chấp nhận các giá trị hợp lệ, mặc định tiết kiệm
    $shippingMethod = $input['shipping_method'] ?? 'giao_hang_tiet_kiem';
    $allowedShippingMethods = ['giao_hang_tiet_kiem', 'ghn', 'viettel_post', 'shop_delivery', 'standard', 'express'];
    if (!in_array($shippingMethod, $allowedShippingMethods, true)) {
        $shippingMethod = 'giao_hang_tiet_kiem';
    }

    // Phương thức thanh toán — chỉ chấp nhận 4 giá trị, mặc định COD
    $paymentMethod = $input['payment_method'] ?? 'cod';
    $allowedPaymentMethods = ['cod', 'bank_transfer', 'card', 'wallet'];
    if (!in_array($paymentMethod, $allowedPaymentMethods, true)) {
        $paymentMethod = 'cod';
    }

    // Kiểm tra bảng ví tồn tại khi dùng phương thức wallet
    if ($paymentMethod === 'wallet' && (!tableExists('wallets') || !tableExists('wallet_transactions'))) {
        jsonResponse(['success' => false, 'message' => 'Chua tao bang vi dien tu. Vui long chay migrate_all_features.sql'], 500);
    }

    // Cong thanh toan the mo phong: chi chap nhan bo the test, khong luu so the/CVV.
    if ($paymentMethod === 'card') {
        $cardNumber = preg_replace('/\D+/', '', (string)($input['card_number'] ?? ''));
        $cardExpiry = trim((string)($input['card_expiry'] ?? ''));
        $cardCvv = trim((string)($input['card_cvv'] ?? ''));
        $cardHolder = trim((string)($input['card_holder'] ?? ''));
        $cardPhone = preg_replace('/\D+/', '', (string)($input['card_phone'] ?? ''));
        $isNapas = str_starts_with($cardNumber, '9704');
        $expiryValid = false;
        if (preg_match('/^(\d{2})\/(\d{2})$/', $cardExpiry, $expiryParts)) {
            $expiryMonth = (int)$expiryParts[1];
            $expiryYear = 2000 + (int)$expiryParts[2];
            $currentYear = (int)date('Y');
            $currentMonth = (int)date('m');
            $expiryValid = $expiryMonth >= 1
                && $expiryMonth <= 12
                && ($expiryYear > $currentYear || ($expiryYear === $currentYear && $expiryMonth >= $currentMonth));
        }
        if (
            !preg_match('/^\d{16}$/', $cardNumber)
            || !$expiryValid
            || (!$isNapas && !preg_match('/^\d{3}$/', $cardCvv))
            || ($isNapas && $cardCvv !== '' && !preg_match('/^\d{3}$/', $cardCvv))
            || $cardHolder === ''
            || !preg_match('/^\d{9,11}$/', $cardPhone)
        ) {
            jsonResponse(['success' => false, 'message' => 'Thong tin the test khong hop le'], 400);
        }
        if ($cardNumber === '4000000000000002') {
            jsonResponse(['success' => false, 'message' => 'The test bi tu choi thanh toan'], 400);
        }
        if ($cardNumber === '4000000000009995') {
            jsonResponse(['success' => false, 'message' => 'The test khong du so du'], 400);
        }
        if ($cardNumber !== '4111111111111111' && !$isNapas) {
            jsonResponse(['success' => false, 'message' => 'Chi chap nhan the test Visa hoac the NAPAS mo phong'], 400);
        }
    }

    // OTP bat buoc voi the test va vi dien tu. Chuyen khoan QR cho admin xac nhan sau.
    // verifyOrderOtp() trong otp.php sẽ:
    //   - Kiểm tra mã trong DB: đúng user, đúng mã, chưa dùng, còn hạn
    //   - Nếu sai → gọi jsonResponse(400) và dừng luồng tại đây
    //   - Nếu đúng → đánh dấu used_at = NOW() và trả về bình thường
    if (in_array($paymentMethod, ['card', 'wallet'], true)) {
        require_once __DIR__ . '/otp.php';
        verifyOrderOtp($user['id'], $input['otp_code'] ?? '', $paymentMethod);
    }
    // ── Từ đây trở xuống: OTP đã được xác minh, tiếp tục tạo đơn hàng ────────

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
        'payment_status' => in_array($paymentMethod, ['card', 'wallet'], true) ? 'paid' : 'pending',
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
        if (tableExists('payments')) {
            $databaseTime = queryOne("SELECT NOW() AS db_now, DATE_ADD(NOW(), INTERVAL 15 MINUTE) AS expires_at");
            $paymentGateway = match ($paymentMethod) {
                'bank_transfer' => 'bank_transfer',
                'card' => 'card_test',
                'wallet' => 'wallet',
                default => 'cod',
            };
            $paymentStatus = in_array($paymentMethod, ['card', 'wallet'], true) ? 'paid' : 'pending';
            $paymentId = insertRow('payments', [
                'order_id' => $orderId,
                'user_id' => $user['id'],
                'gateway' => $paymentGateway,
                'amount' => $orderData['total_amount'],
                'currency' => 'VND',
                'authority' => $paymentMethod === 'bank_transfer' ? $orderData['order_number'] : null,
                'transaction_id' => in_array($paymentMethod, ['card', 'wallet'], true) ? strtoupper($paymentGateway) . '-' . uniqid() : null,
                'status' => $paymentStatus,
                'expires_at' => $paymentMethod === 'bank_transfer' ? $databaseTime['expires_at'] : null,
                'verified_at' => $paymentStatus === 'paid' ? $databaseTime['db_now'] : null,
                'gateway_response' => json_encode(['source' => 'checkout'], JSON_UNESCAPED_UNICODE),
            ]);
        }
        if ($paymentMethod === 'wallet') {
            if (!debitWallet($user['id'], $orderData['total_amount'], 'Thanh toan don hang ' . $orderData['order_number'], 'order', $orderId)) {
                throw new Exception('So du vi khong du de thanh toan don hang');
            }
        }

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
            executeSql(
                "UPDATE coupons
                 SET used_count = COALESCE(used_count, 0) + 1,
                     is_active = CASE
                         WHEN usage_limit IS NOT NULL AND COALESCE(used_count, 0) + 1 >= usage_limit THEN 0
                         ELSE is_active
                     END
                 WHERE id = ?",
                [$coupon['id']]
            );
            insertRow('coupon_usage', ['coupon_id' => $coupon['id'], 'user_id' => $user['id'], 'order_id' => $orderId]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'Không thể tạo đơn hàng: ' . $e->getMessage()], 500);
    }

    $createdOrder = queryOne("SELECT * FROM orders WHERE id = ?", [$orderId]);
    if (tableExists('payments')) {
        $createdOrder['payment'] = queryOne(
            "SELECT *, UNIX_TIMESTAMP(expires_at) AS expires_at_unix, UNIX_TIMESTAMP(verified_at) AS verified_at_unix
             FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1",
            [$orderId]
        );
    }
    jsonResponse(['success' => true, 'message' => 'Đã tạo đơn hàng', 'data' => $createdOrder], 201);
}

function expirePendingBankTransfers() {
    if (!tableExists('payments') || !tableHasColumn('payments', 'expires_at')) {
        return;
    }

    executeSql(
        "UPDATE payments p
         JOIN orders o ON o.id = p.order_id
         SET p.expires_at = DATE_ADD(p.created_at, INTERVAL 15 MINUTE),
             p.status = 'pending',
             o.payment_status = 'pending'
         WHERE p.gateway = 'bank_transfer'
           AND p.expires_at IS NOT NULL
           AND p.expires_at <= p.created_at
           AND p.status IN ('pending', 'expired')
           AND o.payment_status IN ('pending', 'expired')"
    );

    executeSql(
        "UPDATE payments p
         JOIN orders o ON o.id = p.order_id
         SET p.status = 'expired',
             o.payment_status = 'expired',
             o.status = 'cancelled',
             o.admin_note = COALESCE(o.admin_note, 'Tu dong huy: QR thanh toan da het han')
         WHERE p.gateway = 'bank_transfer'
           AND p.status = 'pending'
           AND p.expires_at IS NOT NULL
           AND p.expires_at <= NOW()"
    );
}

function listOrders($user) {
    expirePendingBankTransfers();
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;
    $where = "user_id = ?";
    $params = [$user['id']];
    if (!empty($_GET['status'])) {
        $where .= " AND status = ?";
        $params[] = $_GET['status'];
    }
    $paymentStatus = $_GET['payment_status'] ?? '';
    if (in_array($paymentStatus, ['pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded'], true)) {
        $where .= " AND payment_status = ?";
        $params[] = $paymentStatus;
    }
    $search = trim((string)($_GET['search'] ?? ''));
    if ($search !== '') {
        $where .= " AND (order_number LIKE ? OR coupon_code LIKE ? OR tracking_code LIKE ? OR shipping_name LIKE ? OR shipping_phone LIKE ?)";
        $like = '%' . $search . '%';
        array_push($params, $like, $like, $like, $like, $like);
    }
    $month = trim((string)($_GET['month'] ?? ''));
    if (preg_match('/^\d{4}-\d{2}$/', $month)) {
        $startDate = $month . '-01 00:00:00';
        $endDate = date('Y-m-d H:i:s', strtotime($startDate . ' +1 month'));
        $where .= " AND created_at >= ? AND created_at < ?";
        array_push($params, $startDate, $endDate);
    }
    $count = (int)(queryOne("SELECT COUNT(*) AS count FROM orders WHERE {$where}", $params)['count'] ?? 0);
    $returnSelect = tableExists('return_requests')
        ? ", (SELECT rr.status FROM return_requests rr WHERE rr.order_id = orders.id ORDER BY rr.created_at DESC LIMIT 1) AS return_status,
             (SELECT rr.type FROM return_requests rr WHERE rr.order_id = orders.id ORDER BY rr.created_at DESC LIMIT 1) AS return_type"
        : ", NULL AS return_status, NULL AS return_type";
    $reviewHasOrder = tableExists('reviews') && tableHasColumn('reviews', 'order_id');
    $reviewJoin = $reviewHasOrder
        ? "r.product_id = oi.product_id AND r.user_id = orders.user_id AND r.order_id = orders.id"
        : "r.product_id = oi.product_id AND r.user_id = orders.user_id";
    $reviewSelect = tableExists('reviews')
        ? ", (SELECT COUNT(DISTINCT oi.product_id)
              FROM order_items oi
              WHERE oi.order_id = orders.id AND oi.product_id IS NOT NULL) AS reviewable_items_count,
             (SELECT COUNT(DISTINCT oi.product_id)
              FROM order_items oi
              JOIN reviews r ON {$reviewJoin}
              WHERE oi.order_id = orders.id AND oi.product_id IS NOT NULL) AS reviewed_items_count"
        : ", 0 AS reviewable_items_count, 0 AS reviewed_items_count";
    $orders = queryAll("SELECT orders.*{$returnSelect}{$reviewSelect} FROM orders WHERE {$where} ORDER BY created_at DESC LIMIT ? OFFSET ?", array_merge($params, [$limit, $offset]));
    jsonResponse(['success' => true, 'data' => ['orders' => $orders, 'pagination' => ['page' => $page, 'limit' => $limit, 'totalItems' => $count, 'totalPages' => (int)ceil($count / $limit)]]]);
}

function getOrder($user, $id) {
    expirePendingBankTransfers();
    $order = queryOne("SELECT * FROM orders WHERE id = ? AND user_id = ?", [$id, $user['id']]);
    if (!$order) jsonResponse(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
    $reviewHasOrder = tableExists('reviews') && tableHasColumn('reviews', 'order_id');
    $reviewWhere = $reviewHasOrder
        ? "r.product_id = order_items.product_id AND r.user_id = ? AND r.order_id = order_items.order_id"
        : "r.product_id = order_items.product_id AND r.user_id = ?";
    $reviewSelect = tableExists('reviews')
        ? ", EXISTS(SELECT 1 FROM reviews r WHERE {$reviewWhere}) AS already_reviewed"
        : ", 0 AS already_reviewed";
    $reviewParams = tableExists('reviews') ? [$user['id'], $id] : [$id];
    $order['items'] = queryAll("SELECT order_items.*{$reviewSelect} FROM order_items WHERE order_id = ?", $reviewParams);
    $order['return_request'] = tableExists('return_requests')
        ? queryOne("SELECT * FROM return_requests WHERE order_id = ? ORDER BY created_at DESC LIMIT 1", [$id])
        : null;
    $order['payment'] = tableExists('payments')
        ? queryOne(
            "SELECT *, UNIX_TIMESTAMP(expires_at) AS expires_at_unix, UNIX_TIMESTAMP(verified_at) AS verified_at_unix
             FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1",
            [$id]
        )
        : null;
    jsonResponse(['success' => true, 'data' => $order]);
}

function trackOrder($user, $id) {
    expirePendingBankTransfers();
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
        creditWallet($user['id'], (float)$order['total_amount'], 'Hoan tien huy don ' . $order['order_number'], 'order_cancel', $id);
    } else {
        $updateData['payment_status'] = 'cancelled';
    }
    updateRow('orders', $id, $updateData);
    if (tableExists('payments')) {
        $paymentStatus = $updateData['payment_status'] === 'refunded' ? 'refunded' : 'failed';
        executeSql("UPDATE payments SET status = ?, updated_at = NOW() WHERE order_id = ?", [$paymentStatus, $id]);
    }
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
        jsonResponse(['success' => false, 'message' => 'Chua tao bang return_requests. Vui long chay file migrate_all_features.sql'], 500);
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
        "SELECT id FROM return_requests WHERE order_id = ? AND status IN ('pending', 'approved', 'completed') ORDER BY created_at DESC LIMIT 1",
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

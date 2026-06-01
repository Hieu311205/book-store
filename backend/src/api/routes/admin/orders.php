<?php
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
        $estimatedDeliveryDays = 4;
        $adminDaysAfterEstimate = 5;
        $adminDeliveryResolutionDays = $estimatedDeliveryDays + $adminDaysAfterEstimate;
        $allowedTransitions = [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['processing', 'cancelled'],
            'paid' => ['processing', 'cancelled'],
            'processing' => ['shipped', 'cancelled'],
            'shipped' => ['delivered', 'cancelled'],
            'delivered' => [],
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
        if (in_array($newStatus, ['delivered', 'cancelled'], true) && $currentStatus === 'shipped') {
            if ($currentStatus !== 'shipped') {
                jsonResponse(['success' => false, 'message' => 'Don hang phai dang giao truoc khi xac nhan da giao'], 400);
            }
            if (empty($order['shipped_at'])) {
                jsonResponse(['success' => false, 'message' => 'Don hang chua co thoi gian bat dau giao'], 400);
            }
            if (strtotime($order['shipped_at']) > strtotime("-{$adminDeliveryResolutionDays} days")) {
                jsonResponse(['success' => false, 'message' => "Chi duoc xu ly sau {$adminDaysAfterEstimate} ngay ke tu ngay nhan du kien"], 400);
            }
            if (tableExists('return_requests')) {
                $activeReturn = queryOne(
                    "SELECT id FROM return_requests WHERE order_id = ? AND status IN ('pending', 'approved') ORDER BY created_at DESC LIMIT 1",
                    [$id]
                );
                if ($activeReturn) {
                    jsonResponse(['success' => false, 'message' => 'Don dang co yeu cau doi tra/khieu nai, chua the xac nhan da giao'], 400);
                }
            }
        }
        if ($newStatus === 'refunded') {
            jsonResponse(['success' => false, 'message' => 'Hoan tien duoc xu ly tu dong qua huy don hoac yeu cau tra hang'], 400);
        }
        $adminNote = trim((string)($input['admin_note'] ?? ''));
        if ($newStatus === 'cancelled' && $adminNote === '') {
            jsonResponse(['success' => false, 'message' => 'Vui long nhap ly do huy don tu shop'], 400);
        }
        $updateData = [
            'status' => $newStatus,
            'admin_note' => $adminNote !== '' ? $adminNote : null,
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        $isLateDeliveryCancellation = $newStatus === 'cancelled' && $currentStatus === 'shipped';
        if ($newStatus === 'cancelled') {
            if ($isLateDeliveryCancellation && ($order['payment_status'] ?? 'pending') === 'paid') {
                $updateData['payment_status'] = 'paid';
            } elseif (($order['payment_status'] ?? 'pending') === 'paid') {
                $updateData['payment_status'] = 'refunded';
            } else {
                $updateData['payment_status'] = 'cancelled';
            }
        } elseif (($order['payment_method'] ?? 'cod') === 'cod') {
            // COD: tiền mặt khi nhận — thanh toán được cập nhật khi người dùng/admin xác nhận đã giao.
        } else {
            // bank_transfer / card: admin xác nhận thanh toán khi chuyển sang trạng thái xử lý
            if (in_array($newStatus, ['confirmed', 'paid', 'processing', 'shipped'], true) && ($order['payment_status'] ?? 'pending') !== 'refunded') {
                $updateData['payment_status'] = 'paid';
            }
        }

        if ($newStatus === 'shipped') {
            $updateData['shipped_at'] = date('Y-m-d H:i:s');
        }
        if ($newStatus === 'delivered') {
            $updateData['delivered_at'] = date('Y-m-d H:i:s');
            if (($order['payment_method'] ?? 'cod') === 'cod') {
                $updateData['payment_status'] = 'paid';
            }
        }
        updateRow('orders', $id, $updateData);
        if ($newStatus === 'cancelled' && !$isLateDeliveryCancellation && ($order['payment_status'] ?? 'pending') === 'paid') {
            creditWallet($order['user_id'], (float)$order['total_amount'], 'Hoan tien don ' . $order['order_number'], 'order_refund', $id);
        }
        jsonResponse(['success' => true, 'message' => 'Đã cập nhật trạng thái đơn hàng']);
    }

    if ($method === 'PUT' && $id && (($pathParts[3] ?? '') === 'payment-status')) {
        jsonResponse(['success' => false, 'message' => 'Trang thai thanh toan duoc cap nhat tu dong theo quy trinh don hang'], 400);
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
        jsonResponse(['success' => false, 'message' => 'Chua tao bang return_requests. Vui long chay file migrate_all_features.sql'], 500);
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
                $order = queryOne("SELECT * FROM orders WHERE id = ?", [$request['order_id']]);
                if (!$order || ($order['payment_status'] ?? 'pending') !== 'paid') {
                    jsonResponse(['success' => false, 'message' => 'Don chua thanh toan thi khong the hoan tien'], 400);
                }
                $items = queryAll("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [$request['order_id']]);
                foreach ($items as $item) {
                    if (!empty($item['product_id'])) {
                        executeSql(
                            "UPDATE products SET stock = stock + ?, sales_count = CASE WHEN sales_count >= ? THEN sales_count - ? ELSE 0 END WHERE id = ?",
                            [$item['quantity'], $item['quantity'], $item['quantity'], $item['product_id']]
                        );
                    }
                }
                updateRow('orders', $request['order_id'], [
                    'status' => 'refunded',
                    'payment_status' => 'refunded',
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
                creditWallet($order['user_id'], (float)$order['total_amount'], 'Hoan tien tra hang ' . $order['order_number'], 'return_request', $id);
            }
        }

        jsonResponse(['success' => true, 'message' => 'Da cap nhat yeu cau doi tra']);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}


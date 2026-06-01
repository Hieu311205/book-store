<?php
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
        $year = (int)($_GET['year'] ?? 0);
        $month = (int)($_GET['month'] ?? 0);
        if ($year >= 2000 && $month >= 1 && $month <= 12) {
            $startDate = sprintf('%04d-%02d-01 00:00:00', $year, $month);
            $endDate = date('Y-m-d H:i:s', strtotime($startDate . ' +1 month'));
            jsonResponse(['success' => true, 'data' => queryAll(
                "SELECT DATE(created_at) AS date, SUM(total_amount) AS total, COUNT(id) AS orders
                 FROM orders
                 WHERE payment_status = 'paid' AND created_at >= ? AND created_at < ?
                 GROUP BY DATE(created_at)
                 ORDER BY date",
                [$startDate, $endDate]
            )]);
        }

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
            ? (int)(queryOne("SELECT COUNT(*) AS count FROM wallet_transactions WHERE type = 'debit' AND status = 'pending' AND reference_type = 'wallet_withdraw'")['count'] ?? 0)
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
            'count' => $pendingOrders + $shippedOrders + $pendingReturns + $approvedReturns + $pendingWithdrawals + $lowStockProducts + $unreadMessages,
            'items' => $items,
        ]]);
    }

    jsonResponse(['success' => false, 'message' => 'Khong tim thay thao tac'], 404);
}


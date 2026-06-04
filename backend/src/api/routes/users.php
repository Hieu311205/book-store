<?php
/**
 * Users API — địa chỉ giao hàng và danh sách yêu thích (wishlist)
 *
 * ENDPOINT MAP (yêu cầu đăng nhập):
 *   GET    /api/v1/users/addresses              → danh sách địa chỉ (mặc định trên đầu)
 *   POST   /api/v1/users/addresses              → thêm địa chỉ mới
 *   PUT    /api/v1/users/addresses/{id}         → cập nhật địa chỉ
 *   PUT    /api/v1/users/addresses/{id}/set-default → đặt làm địa chỉ mặc định
 *   DELETE /api/v1/users/addresses/{id}         → xóa địa chỉ
 *
 *   GET    /api/v1/users/wishlist               → danh sách sách yêu thích + ảnh bìa
 *   POST   /api/v1/users/wishlist/add/{id}      → thêm vào yêu thích (idempotent)
 *   DELETE /api/v1/users/wishlist/remove/{id}   → xóa khỏi yêu thích
 */

// ─── Router ──────────────────────────────────────────────────────────────────
function handleUsers($method, $pathParts) {
    $user = requireUser(); // JWT required — dừng nếu chưa đăng nhập
    $section = $pathParts[1] ?? '';
    if ($section === 'addresses') {
        handleAddresses($method, $pathParts, $user);
    } elseif ($section === 'wishlist') {
        handleWishlist($method, $pathParts, $user);
    } else {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy thao tác'], 404);
    }
}

// ─── Địa chỉ giao hàng ───────────────────────────────────────────────────────
// Mỗi user có nhiều địa chỉ; đúng 1 địa chỉ có is_default = 1
// Khi set-default: reset toàn bộ về 0 trước, rồi set 1 cho địa chỉ được chọn (2 query)
function handleAddresses($method, $pathParts, $user) {
    $id = $pathParts[2] ?? null;
    $allowed = ['title', 'full_name', 'phone', 'province', 'city', 'postal_code', 'address', 'is_default'];

    if ($method === 'GET') {
        // ORDER BY is_default DESC → địa chỉ mặc định luôn đứng đầu danh sách
        jsonResponse(['success' => true, 'data' => queryAll("SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC", [$user['id']])]);
    }

    if ($method === 'POST') {
        $data = filterInput(requestJson(), $allowed);
        $data['user_id'] = $user['id'];
        if (!empty($data['is_default'])) {
            // Xóa flag mặc định của tất cả địa chỉ cũ trước khi đặt mặc định mới
            executeSql("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [$user['id']]);
        }
        $newId = insertRow('user_addresses', $data);
        jsonResponse(['success' => true, 'data' => queryOne("SELECT * FROM user_addresses WHERE id = ?", [$newId])], 201);
    }

    // Route đặt mặc định phải kiểm tra trước route PUT thông thường (cùng $method + $id)
    if ($method === 'PUT' && $id && (($pathParts[3] ?? '') === 'set-default')) {
        executeSql("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [$user['id']]);
        executeSql("UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?", [$id, $user['id']]);
        jsonResponse(['success' => true, 'message' => 'Đã cập nhật địa chỉ mặc định']);
    }

    if ($method === 'PUT' && $id) {
        $data = filterInput(requestJson(), $allowed);
        if (!empty($data['is_default'])) {
            executeSql("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [$user['id']]);
        }
        if ($data) {
            $sets = implode(', ', array_map(fn($column) => "$column = ?", array_keys($data)));
            // WHERE user_id = ? phòng IDOR — user chỉ update được địa chỉ của chính mình
            executeSql("UPDATE user_addresses SET {$sets} WHERE id = ? AND user_id = ?", array_merge(array_values($data), [$id, $user['id']]));
        }
        jsonResponse(['success' => true, 'data' => queryOne("SELECT * FROM user_addresses WHERE id = ? AND user_id = ?", [$id, $user['id']])]);
    }

    if ($method === 'DELETE' && $id) {
        executeSql("DELETE FROM user_addresses WHERE id = ? AND user_id = ?", [$id, $user['id']]);
        jsonResponse(['success' => true, 'message' => 'Đã xóa địa chỉ']);
    }

    jsonResponse(['success' => false, 'message' => 'Không tìm thấy thao tác'], 404);
}

// ─── Wishlist (sách yêu thích) ────────────────────────────────────────────────
// Thêm idempotent: nếu đã tồn tại trong wishlist thì bỏ qua thay vì báo lỗi
// Subquery lấy ảnh bìa thay vì JOIN để tránh duplicate row khi có nhiều ảnh
function handleWishlist($method, $pathParts, $user) {
    $action    = $pathParts[2] ?? '';
    $productId = $pathParts[3] ?? null;

    if ($method === 'GET') {
        $items = queryAll(
            "SELECT w.id, w.product_id, w.notify_when_available,
                    p.title, p.slug, p.price, p.compare_price, p.stock,
                    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 ORDER BY sort_order LIMIT 1) AS image_url
             FROM wishlist w LEFT JOIN products p ON w.product_id = p.id
             WHERE w.user_id = ?
             ORDER BY w.created_at DESC",
            [$user['id']]
        );
        jsonResponse(['success' => true, 'data' => $items]);
    }

    if ($method === 'POST' && $action === 'add' && $productId) {
        if (!queryOne("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?", [$user['id'], $productId])) {
            insertRow('wishlist', ['user_id' => $user['id'], 'product_id' => $productId]);
        }
        jsonResponse(['success' => true, 'message' => 'Đã thêm vào yêu thích']);
    }

    if ($method === 'PUT' && $action === 'notify' && $productId) {
        $row = queryOne("SELECT id, notify_when_available FROM wishlist WHERE user_id = ? AND product_id = ?", [$user['id'], $productId]);
        if (!$row) {
            jsonResponse(['success' => false, 'message' => 'Sách chưa có trong danh sách yêu thích'], 404);
        }
        $newVal = $row['notify_when_available'] ? 0 : 1;
        executeSql("UPDATE wishlist SET notify_when_available = ? WHERE id = ?", [$newVal, $row['id']]);
        jsonResponse([
            'success' => true,
            'message' => $newVal ? 'Sẽ thông báo khi có hàng' : 'Đã tắt thông báo',
            'notify_when_available' => (bool)$newVal,
        ]);
    }

    if ($method === 'DELETE' && $action === 'remove' && $productId) {
        executeSql("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?", [$user['id'], $productId]);
        jsonResponse(['success' => true, 'message' => 'Đã xóa khỏi yêu thích']);
    }

    jsonResponse(['success' => false, 'message' => 'Không tìm thấy thao tác'], 404);
}
?>

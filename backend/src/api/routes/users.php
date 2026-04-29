<?php
function handleUsers($method, $pathParts) {
    $user = requireUser();
    $section = $pathParts[1] ?? '';
    if ($section === 'addresses') {
        handleAddresses($method, $pathParts, $user);
    } elseif ($section === 'wishlist') {
        handleWishlist($method, $pathParts, $user);
    } else {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy thao tác'], 404);
    }
}

function handleAddresses($method, $pathParts, $user) {
    $id = $pathParts[2] ?? null;
    $allowed = ['title', 'full_name', 'phone', 'province', 'city', 'postal_code', 'address', 'is_default'];
    if ($method === 'GET') {
        jsonResponse(['success' => true, 'data' => queryAll("SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC", [$user['id']])]);
    }
    if ($method === 'POST') {
        $data = filterInput(requestJson(), $allowed);
        $data['user_id'] = $user['id'];
        if (!empty($data['is_default'])) {
            executeSql("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [$user['id']]);
        }
        $newId = insertRow('user_addresses', $data);
        jsonResponse(['success' => true, 'data' => queryOne("SELECT * FROM user_addresses WHERE id = ?", [$newId])], 201);
    }
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

function handleWishlist($method, $pathParts, $user) {
    $action = $pathParts[2] ?? '';
    $productId = $pathParts[3] ?? null;
    if ($method === 'GET') {
        $items = queryAll(
            "SELECT w.*, p.title, p.slug, p.price, p.compare_price,
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
    if ($method === 'DELETE' && $action === 'remove' && $productId) {
        executeSql("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?", [$user['id'], $productId]);
        jsonResponse(['success' => true, 'message' => 'Đã xóa khỏi yêu thích']);
    }
    jsonResponse(['success' => false, 'message' => 'Không tìm thấy thao tác'], 404);
}
?>

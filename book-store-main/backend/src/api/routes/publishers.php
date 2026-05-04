<?php
function handlePublishers($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phương thức không được hỗ trợ'], 405);
    }

    if (isset($pathParts[1]) && $pathParts[1] !== '' && $pathParts[1] !== 'count') {
        $publisher = queryOne("SELECT * FROM publishers WHERE id = ?", [$pathParts[1]]);
        if (!$publisher) {
            jsonResponse(['success' => false, 'message' => 'Nhà xuất bản không tồn tại'], 404);
        }
        $publisher['product_count'] = (int)(queryOne(
            "SELECT COUNT(*) AS count FROM products WHERE publisher_id = ?",
            [$pathParts[1]]
        )['count'] ?? 0);
        jsonResponse(['success' => true, 'data' => $publisher]);
    } else {
        $publishers = queryAll("SELECT * FROM publishers ORDER BY name");
        jsonResponse(['success' => true, 'data' => $publishers]);
    }
}
?>

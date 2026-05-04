<?php
function handleAuthors($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phương thức không được hỗ trợ'], 405);
    }

    if (isset($pathParts[1]) && $pathParts[1] !== '' && $pathParts[1] !== 'count') {
        $author = queryOne("SELECT * FROM authors WHERE id = ?", [$pathParts[1]]);
        if (!$author) {
            jsonResponse(['success' => false, 'message' => 'Tác giả không tồn tại'], 404);
        }
        $author['product_count'] = (int)(queryOne(
            "SELECT COUNT(*) AS count FROM products WHERE author_id = ?",
            [$pathParts[1]]
        )['count'] ?? 0);
        jsonResponse(['success' => true, 'data' => $author]);
    } else {
        $authors = queryAll("SELECT * FROM authors ORDER BY name");
        jsonResponse(['success' => true, 'data' => $authors]);
    }
}
?>

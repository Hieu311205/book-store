<?php
function handleCategories($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phương thức không được hỗ trợ'], 405);
    }

    if (($pathParts[1] ?? null) === 'slug' && isset($pathParts[2])) {
        getCategoryBySlug($pathParts[2]);
    } elseif (isset($pathParts[2]) && $pathParts[2] === 'subcategories') {
        jsonResponse(['success' => true, 'data' => queryAll(
            "SELECT * FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY sort_order",
            [$pathParts[1]]
        )]);
    } elseif (isset($pathParts[1]) && $pathParts[1] !== '') {
        getCategoryById($pathParts[1]);
    } else {
        $categories = queryAll("SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order");
        jsonResponse(['success' => true, 'data' => buildCategoryTree($categories)]);
    }
}

function buildCategoryTree($items, $parentId = null) {
    $tree = [];
    foreach ($items as $item) {
        $itemParent = $item['parent_id'] === null ? null : (int)$item['parent_id'];
        if ($itemParent === $parentId) {
            $item['children'] = buildCategoryTree($items, (int)$item['id']);
            $tree[] = $item;
        }
    }
    return $tree;
}

function getCategoryById($id) {
    $category = queryOne("SELECT * FROM categories WHERE id = ? AND is_active = 1", [$id]);
    if (!$category) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy danh mục'], 404);
    }
    $category['product_count'] = (int)(queryOne(
        "SELECT COUNT(*) AS count FROM products WHERE category_id = ? AND is_active = 1",
        [$id]
    )['count'] ?? 0);
    jsonResponse(['success' => true, 'data' => $category]);
}

function getCategoryBySlug($slug) {
    $category = queryOne("SELECT * FROM categories WHERE slug = ? AND is_active = 1", [$slug]);
    if (!$category) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy danh mục'], 404);
    }
    $category['subcategories'] = queryAll(
        "SELECT * FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY sort_order",
        [$category['id']]
    );
    $category['product_count'] = (int)(queryOne(
        "SELECT COUNT(*) AS count FROM products WHERE category_id = ? AND is_active = 1",
        [$category['id']]
    )['count'] ?? 0);
    jsonResponse(['success' => true, 'data' => $category]);
}
?>

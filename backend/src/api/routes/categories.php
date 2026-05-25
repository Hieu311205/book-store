<?php
/**
 * Categories API — danh mục sách: cây phân cấp, chi tiết theo ID/slug
 *
 * ENDPOINT MAP (tất cả GET, công khai):
 *   GET /api/v1/categories                      → buildCategoryTree() — trả cây danh mục đầy đủ
 *   GET /api/v1/categories/{id}                 → getCategoryById()   — chi tiết + số lượng sách
 *   GET /api/v1/categories/{id}/subcategories   → danh sách danh mục con (inline query)
 *   GET /api/v1/categories/slug/{slug}          → getCategoryBySlug() — kèm danh mục con
 *
 * CẤU TRÚC DỮ LIỆU:
 *   categories (id, parent_id, name, slug, sort_order, is_active, ...)
 *   parent_id = NULL → danh mục gốc (root)
 *   parent_id = N    → danh mục con của N
 */

// ─── Router ──────────────────────────────────────────────────────────────────
function handleCategories($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phương thức không được hỗ trợ'], 405);
    }

    if (($pathParts[1] ?? null) === 'slug' && isset($pathParts[2])) {
        getCategoryBySlug($pathParts[2]);
    } elseif (isset($pathParts[2]) && $pathParts[2] === 'subcategories') {
        // Lấy nhanh danh sách con mà không cần gọi hàm riêng
        jsonResponse(['success' => true, 'data' => queryAll(
            "SELECT * FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY sort_order",
            [$pathParts[1]]
        )]);
    } elseif (isset($pathParts[1]) && $pathParts[1] !== '') {
        getCategoryById($pathParts[1]);
    } else {
        // Không có sub-path → trả toàn bộ cây danh mục để render menu sidebar/navbar
        $categories = queryAll("SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order");
        jsonResponse(['success' => true, 'data' => buildCategoryTree($categories)]);
    }
}

// ─── Xây cây phân cấp từ danh sách phẳng ────────────────────────────────────
// Đệ quy theo parent_id: duyệt toàn bộ $items, nhặt các node có parent_id = $parentId,
// rồi gắn đệ quy children vào từng node. O(n²) nhưng chấp nhận được vì số danh mục nhỏ.
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

// ─── Chi tiết danh mục theo ID ───────────────────────────────────────────────
// Trả thêm product_count để hiển thị "(123 cuốn)" trên trang danh mục
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

// ─── Chi tiết danh mục theo slug ─────────────────────────────────────────────
// Dùng bởi trang Category (route /category/:slug) — trả thêm subcategories + product_count
function getCategoryBySlug($slug) {
    $category = queryOne("SELECT * FROM categories WHERE slug = ? AND is_active = 1", [$slug]);
    if (!$category) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy danh mục'], 404);
    }
    // Kèm danh mục con để render tab sub-category filter trên trang listing
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

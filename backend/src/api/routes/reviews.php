<?php
/**
 * Reviews API — đánh giá sản phẩm: xem, gửi, duyệt (admin)
 *
 * ENDPOINT MAP:
 *   GET  /api/v1/reviews/product/{id}       → getProductReviews()   — danh sách đánh giá công khai
 *   GET  /api/v1/reviews/check/{product_id} → checkCanReview()      — kiểm tra quyền được đánh giá
 *   GET  /api/v1/reviews/my                 → getMyReviews()        — đánh giá của user đang đăng nhập
 *   POST /api/v1/reviews                    → submitReview()        — gửi đánh giá mới
 *   POST /api/v1/reviews/{id}/helpful       → markHelpful()         — tăng lượt "hữu ích"
 *
 * ĐIỀU KIỆN GỬI ĐÁNH GIÁ:
 *   - User đã mua sản phẩm VÀ đơn có status = 'delivered'
 *   - Mỗi user chỉ được đánh giá 1 lần cho mỗi sản phẩm
 *   - Nội dung phải có ít nhất 10 ký tự
 *
 * BẢO MẬT:
 *   - Tên người dùng được ẩn bớt (chỉ hiện họ viết tắt: "Nguyễn V.")
 *   - Admin xem được đầy đủ tên và email
 */

// ─── Router ──────────────────────────────────────────────────────────────────
// Dispatch từ index.php → handleReviews(), sau đó tách theo method + sub-path
function handleReviews($method, $pathParts) {
    $action = $pathParts[1] ?? '';

    if ($method === 'GET' && $action === 'product') {
        getProductReviews($pathParts[2] ?? null);
    } elseif ($method === 'GET' && $action === 'check') {
        checkCanReview(requireUser(), $pathParts[2] ?? null);
    } elseif ($method === 'GET' && $action === 'my') {
        getMyReviews(requireUser());
    } elseif ($method === 'POST' && !$action) {
        submitReview(requireUser());
    } elseif ($method === 'POST' && is_numeric($action) && ($pathParts[2] ?? '') === 'helpful') {
        markHelpful(requireUser(), (int)$action);
    } else {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy thao tác'], 404);
    }
}

// ─── Danh sách đánh giá công khai của một sản phẩm ───────────────────────────
// Hỗ trợ lọc theo sao, sắp xếp theo thời gian/hữu ích/điểm, phân trang
// Trả thêm summary (avg, count, phân bổ theo sao) để vẽ biểu đồ trên UI
function getProductReviews($productId) {
    if (!$productId) {
        jsonResponse(['success' => false, 'message' => 'Thiếu product_id'], 400);
    }

    $page   = max(1, (int)($_GET['page'] ?? 1));
    $limit  = min(20, max(1, (int)($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;
    // Lọc theo số sao (1-5), null = lấy tất cả
    $rating = isset($_GET['rating']) && (int)$_GET['rating'] > 0 ? (int)$_GET['rating'] : null;
    $sort   = $_GET['sort'] ?? 'newest';

    $where  = 'r.product_id = ? AND r.is_approved = 1'; // chỉ hiện review đã duyệt
    $params = [(int)$productId];

    if ($rating) {
        $where   .= ' AND r.rating = ?';
        $params[] = $rating;
    }

    // Thứ tự sắp xếp: mặc định mới nhất trên đầu; 'helpful' dùng cho tab "Hữu ích nhất"
    $orderBy = match ($sort) {
        'helpful'     => 'r.helpful_count DESC, r.created_at DESC',
        'rating_high' => 'r.rating DESC, r.created_at DESC',
        'rating_low'  => 'r.rating ASC, r.created_at DESC',
        default       => 'r.created_at DESC',
    };

    $total = (int)(queryOne(
        "SELECT COUNT(*) AS count FROM reviews r WHERE {$where}",
        $params
    )['count'] ?? 0);

    $reviews = queryAll(
        "SELECT r.id, r.rating, r.title, r.comment, r.pros, r.cons,
                r.is_verified_purchase, r.helpful_count, r.created_at,
                u.first_name, u.last_name, u.avatar_url
         FROM reviews r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE {$where}
         ORDER BY {$orderBy}
         LIMIT ? OFFSET ?",
        array_merge($params, [$limit, $offset])
    );

    // Ẩn họ đầy đủ — chỉ giữ chữ cái đầu (vd: "Nguyễn" → "N.") để bảo vệ quyền riêng tư
    foreach ($reviews as &$r) {
        $firstName = $r['first_name'] ?? '';
        $lastName  = $r['last_name']  ?? '';
        $r['display_name'] = trim($firstName . ' ' . (mb_substr($lastName, 0, 1) ? mb_substr($lastName, 0, 1) . '.' : ''));
        unset($r['first_name'], $r['last_name']);
    }

    // Tổng hợp theo số sao → dùng để vẽ thanh phân bổ (5★: 60%, 4★: 20%, ...)
    $summaryRows = queryAll(
        "SELECT rating, COUNT(*) AS count FROM reviews WHERE product_id = ? AND is_approved = 1 GROUP BY rating",
        [(int)$productId]
    );
    $summary = array_fill(1, 5, 0); // khởi tạo 1-5 sao đều bằng 0
    foreach ($summaryRows as $row) {
        $summary[(int)$row['rating']] = (int)$row['count'];
    }

    // Lấy rating_avg từ products (đã được cập nhật bởi recalcProductRating() khi có review mới)
    $product = queryOne("SELECT rating_avg, rating_count FROM products WHERE id = ?", [(int)$productId]);

    jsonResponse([
        'success' => true,
        'data'    => [
            'reviews'      => $reviews,
            'pagination'   => [
                'page'       => $page,
                'limit'      => $limit,
                'totalItems' => $total,
                'totalPages' => (int)ceil($total / $limit),
            ],
            'summary'      => [
                'avg'     => round((float)($product['rating_avg'] ?? 0), 1),
                'count'   => (int)($product['rating_count'] ?? 0),
                'by_star' => $summary,
            ],
        ],
    ]);
}

// ─── Kiểm tra user có quyền đánh giá sản phẩm không ─────────────────────────
// Điều kiện: đã có đơn hàng chứa sản phẩm này VÀ đơn đó có status = 'delivered'
// Trả về can_review, has_purchased, already_reviewed để frontend hiển thị đúng UI
function checkCanReview($user, $productId) {
    if (!$productId) {
        jsonResponse(['success' => false, 'message' => 'Thiếu product_id'], 400);
    }

    // Chỉ cho phép đánh giá nếu đã mua và đã nhận hàng (tránh review "ảo")
    $purchased = queryOne(
        "SELECT oi.id FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
         LIMIT 1",
        [$user['id'], (int)$productId]
    );

    // Kiểm tra user đã từng đánh giá sản phẩm này chưa (kể cả chưa duyệt)
    $reviewed = queryOne(
        "SELECT id FROM reviews WHERE user_id = ? AND product_id = ?",
        [$user['id'], (int)$productId]
    );

    jsonResponse([
        'success' => true,
        'data'    => [
            'can_review'       => (bool)$purchased && !$reviewed,
            'has_purchased'    => (bool)$purchased,
            'already_reviewed' => (bool)$reviewed,
        ],
    ]);
}

// ─── Danh sách đánh giá của user hiện tại ────────────────────────────────────
// Dùng trong trang Profile → tab "Đánh giá của tôi"; hiển thị ảnh + link sản phẩm
function getMyReviews($user) {
    $reviews = queryAll(
        "SELECT r.*, p.title AS product_title, pi.image_url AS product_image, p.slug AS product_slug
         FROM reviews r
         LEFT JOIN products p ON r.product_id = p.id
         LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC",
        [$user['id']]
    );
    jsonResponse(['success' => true, 'data' => $reviews]);
}

// ─── Gửi đánh giá mới ────────────────────────────────────────────────────────
// Luồng: validate input → kiểm tra đã mua + đã nhận → kiểm tra chưa review → insert → recalc
// Sau khi insert, gọi recalcProductRating() để cập nhật rating_avg trên bảng products ngay lập tức
function submitReview($user) {
    $input     = requestJson();
    $productId = (int)($input['product_id'] ?? 0);
    $rating    = (int)($input['rating'] ?? 0);

    if ($productId <= 0) {
        jsonResponse(['success' => false, 'message' => 'Thiếu product_id'], 400);
    }
    if ($rating < 1 || $rating > 5) {
        jsonResponse(['success' => false, 'message' => 'Điểm đánh giá phải từ 1 đến 5 sao'], 400);
    }

    // Xác minh mua hàng — chỉ review sau khi nhận hàng thực tế
    $purchased = queryOne(
        "SELECT oi.id FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
         LIMIT 1",
        [$user['id'], $productId]
    );
    if (!$purchased) {
        jsonResponse(['success' => false, 'message' => 'Bạn chỉ có thể đánh giá sản phẩm đã mua và đã nhận hàng'], 403);
    }

    // Mỗi user chỉ được gửi 1 review cho mỗi sản phẩm
    $existing = queryOne(
        "SELECT id FROM reviews WHERE user_id = ? AND product_id = ?",
        [$user['id'], $productId]
    );
    if ($existing) {
        jsonResponse(['success' => false, 'message' => 'Bạn đã đánh giá sản phẩm này rồi'], 400);
    }

    $comment = trim((string)($input['comment'] ?? ''));
    if (mb_strlen($comment) < 10) {
        jsonResponse(['success' => false, 'message' => 'Nội dung đánh giá phải có ít nhất 10 ký tự'], 400);
    }

    $id = insertRow('reviews', [
        'product_id'           => $productId,
        'user_id'              => $user['id'],
        'rating'               => $rating,
        'title'                => mb_substr(trim((string)($input['title'] ?? '')), 0, 100) ?: null,
        'comment'              => $comment,
        'pros'                 => mb_substr(trim((string)($input['pros'] ?? '')), 0, 500) ?: null,
        'cons'                 => mb_substr(trim((string)($input['cons'] ?? '')), 0, 500) ?: null,
        'is_verified_purchase' => 1,
        'is_approved'          => 1, // Tự động duyệt; đổi thành 0 nếu muốn quy trình admin duyệt thủ công
    ]);

    // Cập nhật rating_avg và rating_count trên bảng products ngay sau khi insert
    recalcProductRating($productId);

    jsonResponse(['success' => true, 'message' => 'Cảm ơn bạn đã đánh giá!', 'data' => ['id' => $id]], 201);
}

// ─── Đánh dấu một review là "hữu ích" ────────────────────────────────────────
// Tăng helpful_count — dùng để sort review theo mức độ hữu ích (sort=helpful)
// Không giới hạn số lần vote trên cùng 1 user (thiết kế đơn giản cho MVP)
function markHelpful($user, $reviewId) {
    $review = queryOne("SELECT id FROM reviews WHERE id = ?", [$reviewId]);
    if (!$review) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy đánh giá'], 404);
    }
    executeSql("UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?", [$reviewId]);
    jsonResponse(['success' => true, 'message' => 'Đã đánh dấu hữu ích']);
}

// ─── Cập nhật rating tổng hợp của sản phẩm ───────────────────────────────────
// Gọi sau mỗi lần: thêm review (submitReview), duyệt/bỏ duyệt (admin PUT), xóa (admin DELETE)
// Tính lại AVG và COUNT từ reviews đã duyệt, ghi vào products.rating_avg và products.rating_count
function recalcProductRating($productId) {
    $result = queryOne(
        "SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE product_id = ? AND is_approved = 1",
        [$productId]
    );
    executeSql(
        "UPDATE products SET rating_avg = ?, rating_count = ? WHERE id = ?",
        [round((float)($result['avg'] ?? 0), 2), (int)($result['cnt'] ?? 0), $productId]
    );
}

// ─── Xử lý thao tác admin cho reviews ────────────────────────────────────────
// Được gọi bởi handleAdmin() trong admin.php (yêu cầu quyền admin)
// GET /admin/reviews          → danh sách có filter (product_id, is_approved, rating)
// PUT /admin/reviews/{id}     → duyệt/bỏ duyệt review, tự động recalc rating
// DELETE /admin/reviews/{id}  → xóa review, tự động recalc rating
function handleAdminReviews($method, $pathParts) {
    $id = $pathParts[2] ?? null;

    if ($method === 'GET' && !$id) {
        $page   = max(1, (int)($_GET['page'] ?? 1));
        $limit  = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $where  = '1=1';
        $params = [];

        // Filter theo sản phẩm cụ thể
        if (!empty($_GET['product_id'])) {
            $where   .= ' AND r.product_id = ?';
            $params[] = (int)$_GET['product_id'];
        }
        // Filter theo trạng thái duyệt (0 = chờ duyệt, 1 = đã duyệt)
        if (isset($_GET['is_approved']) && $_GET['is_approved'] !== '') {
            $where   .= ' AND r.is_approved = ?';
            $params[] = (int)$_GET['is_approved'];
        }
        if (!empty($_GET['rating'])) {
            $where   .= ' AND r.rating = ?';
            $params[] = (int)$_GET['rating'];
        }

        $total = (int)(queryOne(
            "SELECT COUNT(*) AS count FROM reviews r WHERE {$where}", $params
        )['count'] ?? 0);

        // Admin nhận đủ thông tin: tên, email user — không ẩn họ
        $reviews = queryAll(
            "SELECT r.*, p.title AS product_title, u.first_name, u.last_name, u.email
             FROM reviews r
             LEFT JOIN products p ON r.product_id = p.id
             LEFT JOIN users u ON r.user_id = u.id
             WHERE {$where}
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?",
            array_merge($params, [$limit, $offset])
        );

        jsonResponse(['success' => true, 'data' => [
            'reviews' => $reviews,
            'pagination' => [
                'page'       => $page,
                'limit'      => $limit,
                'totalItems' => $total,
                'totalPages' => (int)ceil($total / $limit),
            ],
        ]]);
    }

    if ($method === 'PUT' && $id) {
        $input  = requestJson();
        $review = queryOne("SELECT * FROM reviews WHERE id = ?", [$id]);
        if (!$review) {
            jsonResponse(['success' => false, 'message' => 'Không tìm thấy đánh giá'], 404);
        }
        $isApproved = isset($input['is_approved']) ? (int)$input['is_approved'] : (int)$review['is_approved'];
        updateRow('reviews', $id, ['is_approved' => $isApproved]);
        // Recalc ngay sau khi thay đổi trạng thái duyệt vì approval ảnh hưởng đến rating_avg
        recalcProductRating((int)$review['product_id']);
        jsonResponse(['success' => true, 'message' => 'Đã cập nhật đánh giá']);
    }

    if ($method === 'DELETE' && $id) {
        $review = queryOne("SELECT product_id FROM reviews WHERE id = ?", [$id]);
        if (!$review) {
            jsonResponse(['success' => false, 'message' => 'Không tìm thấy đánh giá'], 404);
        }
        executeSql("DELETE FROM reviews WHERE id = ?", [$id]);
        // Recalc sau khi xóa để rating_avg phản ánh đúng số review còn lại
        recalcProductRating((int)$review['product_id']);
        jsonResponse(['success' => true, 'message' => 'Đã xóa đánh giá']);
    }

    jsonResponse(['success' => false, 'message' => 'Không tìm thấy thao tác'], 404);
}

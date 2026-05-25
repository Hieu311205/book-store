<?php
/**
 * GIỎ HÀNG — src/api/routes/cart.php
 *
 * Vị trí trong kiến trúc:
 *   index.php  →  handleCart()  →  queryAll/insertRow/executeSql (helpers.php)  →  DB bảng cart_items
 *
 * Luồng dữ liệu — nhận diện chủ sở hữu giỏ hàng:
 *   Khách chưa đăng nhập: frontend gửi header X-Session-Id (UUID tạo ở client)
 *     → cart_items lưu session_id, user_id = NULL.
 *   Khách đã đăng nhập: JWT trong Authorization header → currentUser() trả về user
 *     → cart_items lưu user_id, session_id = NULL.
 *   Khi login: auth.controller.php gọi mergeSessionCartIntoUser()
 *     → cart_items của session_id được gán sang user_id (merge số lượng nếu trùng sản phẩm).
 *
 * Ánh xạ endpoint → hàm:
 *   GET    /cart                  → cartGet()
 *   POST   /cart/add              → cartAdd()
 *   PUT    /cart/update           → cartUpdate()
 *   DELETE /cart/remove/:id       → cartRemove($productId)
 *   DELETE /cart/clear            → cartClear()
 *   GET    /cart/coupons          → cartListCoupons()
 *   POST   /cart/coupon           → cartApplyCoupon()
 *   POST   /cart/apply-coupon     → cartApplyCoupon()
 */

/**
 * Entry point cho /api/v1/cart/*.
 * Input:  $method (string); $pathParts (array) — phân đoạn URL.
 * Output: gọi hàm xử lý tương ứng → jsonResponse (exit).
 * Gọi từ: index.php khi $endpoint === 'cart'.
 */
function handleCart($method, $pathParts) {
    $action = $pathParts[1] ?? '';
    if ($method === 'GET' && $action === '') {
        cartGet();
    } elseif ($method === 'POST' && $action === 'add') {
        cartAdd();
    } elseif ($method === 'PUT' && $action === 'update') {
        cartUpdate();
    } elseif ($method === 'DELETE' && $action === 'remove' && isset($pathParts[2])) {
        cartRemove($pathParts[2]);
    } elseif ($method === 'DELETE' && $action === 'clear') {
        cartClear();
    } elseif ($method === 'GET' && $action === 'coupons') {
        cartListCoupons();
    } elseif ($method === 'POST' && in_array($action, ['coupon', 'apply-coupon'], true)) {
        cartApplyCoupon();
    } else {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy thao tác'], 404);
    }
}

/**
 * Tạo mệnh đề WHERE xác định chủ sở hữu giỏ hàng (user hoặc session).
 * Luồng: kiểm tra JWT → nếu có user hợp lệ dùng user_id; nếu không dùng X-Session-Id.
 * Input:  &$params (array tham chiếu) — sẽ được append giá trị tương ứng vào mảng.
 * Output: string mệnh đề SQL ('ci.user_id = ?' hoặc 'ci.session_id = ?') hoặc null nếu không có định danh.
 * Gọi từ: cartGet() để xây dựng câu WHERE động.
 */
function cartOwnerClause(&$params) {
    $user = currentUser();
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
    if ($user) {
        $params[] = $user['id'];
        return 'ci.user_id = ?';
    }
    if ($sessionId) {
        $params[] = $sessionId;
        return 'ci.session_id = ?';
    }
    return null;
}

/**
 * Lấy toàn bộ giỏ hàng kèm thông tin sản phẩm và tính tổng tiền.
 * Luồng: xác định owner → query cart_items JOIN products JOIN authors
 *        → tính line_total, subtotal, discount → trả về qua cartResponse().
 * Input:  không trực tiếp — đọc JWT/X-Session-Id từ headers.
 * Output: jsonResponse với items[], summary{subtotal, discount, total, item_count}.
 * Gọi từ: handleCart() (GET /cart); cũng được gọi lại ở cuối cartAdd/cartUpdate/cartRemove/cartClear.
 */
function cartGet() {
    $params = [];
    $owner = cartOwnerClause($params);
    if (!$owner) {
        cartResponse([]);
    }

    // JOIN sang products để lấy giá, stock, ảnh chính — tránh N+1 query
    $items = queryAll(
        "SELECT ci.*, p.title, p.title_en, p.slug, p.price, p.compare_price, p.discount_percent,
                p.stock, a.name AS author_name,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 ORDER BY sort_order LIMIT 1) AS image_url
         FROM cart_items ci
         LEFT JOIN products p ON ci.product_id = p.id
         LEFT JOIN authors a ON p.author_id = a.id
         WHERE {$owner}",
        $params
    );
    cartResponse($items);
}

/**
 * Tính toán tổng giỏ hàng và trả JSON response.
 * Input:  $items (array) — danh sách cart_items đã có thông tin sản phẩm.
 * Output: jsonResponse với cấu trúc {success, data: {items, summary}}.
 * Gọi từ: cartGet(), cartClear(), và gián tiếp qua cartGet() ở cuối cartAdd/Update/Remove.
 */
function cartResponse($items) {
    $subtotal = 0;
    $discount = 0;
    $itemCount = 0;
    foreach ($items as &$item) {
        // line_total = giá bán hiện tại × số lượng (không phải compare_price)
        $item['line_total'] = (float)$item['price'] * (int)$item['quantity'];
        $subtotal += $item['line_total'];
        // discount = (giá gốc - giá bán) × số lượng — hiển thị cho user thấy tiết kiệm được bao nhiêu
        $original = $item['compare_price'] ?: $item['price'];
        $discount += ((float)$original - (float)$item['price']) * (int)$item['quantity'];
        $itemCount += (int)$item['quantity'];
    }
    jsonResponse([
        'success' => true,
        'data' => [
            'items' => $items,
            'summary' => [
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $subtotal,
                'item_count' => $itemCount,
            ],
        ],
    ]);
}

/**
 * Thêm sản phẩm vào giỏ hàng hoặc tăng số lượng nếu đã có.
 * Luồng: đọc product_id + quantity → xác định owner (user/session)
 *        → kiểm tra sản phẩm tồn tại → kiểm tra stock
 *        → nếu đã có trong giỏ: UPDATE quantity += quantity_mới
 *        → nếu chưa có: INSERT hàng mới → gọi cartGet() trả kết quả.
 * Input:  JSON body {product_id, quantity}; JWT/X-Session-Id header.
 * Output: jsonResponse giỏ hàng đầy đủ (qua cartGet()).
 * Gọi từ: handleCart() (POST /cart/add).
 */
function cartAdd() {
    $input = requestJson();
    $productId = (int)($input['product_id'] ?? 0);
    $quantity = max(1, (int)($input['quantity'] ?? 1));
    $user = currentUser();
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;

    // Bắt buộc phải có ít nhất một trong hai định danh để theo dõi giỏ hàng
    if (!$user && !$sessionId) {
        jsonResponse(['success' => false, 'message' => 'Cần mã phiên hoặc đăng nhập'], 400);
    }

    $product = queryOne("SELECT id, stock FROM products WHERE id = ? AND is_active = 1", [$productId]);
    if (!$product) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy sách'], 404);
    }

    // Tính số lượng mới = quantity hiện tại trong giỏ + quantity thêm vào
    // Kiểm tra stock trước khi ghi DB để tránh over-sell
    $params = $user ? [$user['id'], $productId] : [$sessionId, $productId];
    $where = $user ? 'user_id = ?' : 'session_id = ?';
    $existing = queryOne("SELECT * FROM cart_items WHERE {$where} AND product_id = ?", $params);
    $newQuantity = $quantity + (int)($existing['quantity'] ?? 0);
    if ((int)$product['stock'] < $newQuantity) {
        jsonResponse(['success' => false, 'message' => 'Số lượng tồn kho không đủ'], 400);
    }

    if ($existing) {
        executeSql("UPDATE cart_items SET quantity = ? WHERE id = ?", [$newQuantity, $existing['id']]);
    } else {
        insertRow('cart_items', [
            'user_id' => $user['id'] ?? null,
            // session_id chỉ lưu khi chưa đăng nhập — sau khi merge, cột này bị xoá (NULL)
            'session_id' => $user ? null : $sessionId,
            'product_id' => $productId,
            'quantity' => $quantity,
        ]);
    }
    cartGet();
}

/**
 * Cập nhật số lượng sản phẩm trong giỏ hàng.
 * Luồng: đọc product_id + quantity → nếu quantity < 1 thì gọi cartRemove()
 *        → kiểm tra stock → UPDATE số lượng → gọi cartGet().
 * Input:  JSON body {product_id, quantity}; JWT/X-Session-Id header.
 * Output: jsonResponse giỏ hàng đầy đủ (qua cartGet()).
 * Gọi từ: handleCart() (PUT /cart/update).
 */
function cartUpdate() {
    $input = requestJson();
    $productId = (int)($input['product_id'] ?? 0);
    $quantity = (int)($input['quantity'] ?? 1);
    // quantity < 1 nghĩa là user muốn xoá sản phẩm khỏi giỏ → delegate sang cartRemove
    if ($quantity < 1) {
        cartRemove($productId);
    }
    $product = queryOne("SELECT stock FROM products WHERE id = ? AND is_active = 1", [$productId]);
    if (!$product) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy sách'], 404);
    }
    if ((int)$product['stock'] < $quantity) {
        jsonResponse(['success' => false, 'message' => 'Số lượng tồn kho không đủ'], 400);
    }
    $user = currentUser();
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
    if ($user) {
        executeSql("UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?", [$quantity, $user['id'], $productId]);
    } else {
        executeSql("UPDATE cart_items SET quantity = ? WHERE session_id = ? AND product_id = ?", [$quantity, $sessionId, $productId]);
    }
    cartGet();
}

/**
 * Xoá một sản phẩm khỏi giỏ hàng theo product_id.
 * Input:  $productId (int|string) — từ URL path; JWT/X-Session-Id header.
 * Output: jsonResponse giỏ hàng sau khi xoá (qua cartGet()).
 * Gọi từ: handleCart() (DELETE /cart/remove/:id); cartUpdate() khi quantity < 1.
 */
function cartRemove($productId) {
    $user = currentUser();
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
    if ($user) {
        executeSql("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?", [$user['id'], $productId]);
    } elseif ($sessionId) {
        executeSql("DELETE FROM cart_items WHERE session_id = ? AND product_id = ?", [$sessionId, $productId]);
    }
    cartGet();
}

/**
 * Xoá toàn bộ giỏ hàng của user/session.
 * Input:  JWT/X-Session-Id header.
 * Output: jsonResponse giỏ hàng rỗng (qua cartResponse([])).
 * Gọi từ: handleCart() (DELETE /cart/clear); thường gọi sau khi đặt hàng thành công.
 */
function cartClear() {
    $user = currentUser();
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
    if ($user) {
        executeSql("DELETE FROM cart_items WHERE user_id = ?", [$user['id']]);
    } elseif ($sessionId) {
        executeSql("DELETE FROM cart_items WHERE session_id = ?", [$sessionId]);
    }
    cartResponse([]);
}

/**
 * Xác thực và áp dụng mã giảm giá.
 * Luồng: đọc code → query bảng coupons với điều kiện is_active + thời hạn + usage_limit
 *        → trả thông tin coupon để frontend tính giảm giá (server không tự trừ giá ở đây).
 * Input:  JSON body {code (string)}.
 * Output: jsonResponse {success, coupon data} hoặc lỗi 400 nếu code không hợp lệ.
 * Gọi từ: handleCart() (POST /cart/coupon hoặc /cart/apply-coupon).
 * Lưu ý: used_count chỉ tăng khi đặt hàng thực sự, không phải khi apply coupon.
 */
function cartApplyCoupon() {
    $input = requestJson();
    $code = $input['code'] ?? '';
    $coupon = queryOne(
        "SELECT id, code, type, value, min_purchase, max_discount, usage_limit, used_count
         FROM coupons
         WHERE code = ? AND is_active = 1
           AND (start_date IS NULL OR start_date <= NOW())
           AND (end_date IS NULL OR end_date >= NOW())
           AND (usage_limit IS NULL OR used_count < usage_limit)",
        [$code]
    );
    if (!$coupon) {
        jsonResponse(['success' => false, 'message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn'], 400);
    }
    jsonResponse(['success' => true, 'message' => 'Đã áp dụng mã giảm giá', 'data' => ['coupon' => $coupon]]);
}

/**
 * Liệt kê tất cả mã giảm giá đang hoạt động.
 * Luồng: query bảng coupons → lọc is_active + thời hạn + còn lượt dùng → sắp xếp theo yêu cầu tối thiểu.
 * Input:  không có tham số.
 * Output: jsonResponse {success, data: [coupon, ...]}.
 * Gọi từ: handleCart() (GET /cart/coupons) — frontend hiển thị danh sách coupon có thể dùng.
 */
function cartListCoupons() {
    $coupons = queryAll(
        "SELECT id, code, type, value, min_purchase, max_discount
         FROM coupons
         WHERE is_active = 1
           AND (start_date IS NULL OR start_date <= NOW())
           AND (end_date IS NULL OR end_date >= NOW())
           AND (usage_limit IS NULL OR used_count < usage_limit)
         ORDER BY min_purchase ASC, value DESC"
    );
    jsonResponse(['success' => true, 'data' => $coupons]);
}
?>

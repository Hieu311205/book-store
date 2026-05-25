<?php
/**
 * Sliders API — ảnh slider/banner trên trang chủ
 *
 * ENDPOINT MAP (GET công khai):
 *   GET /api/v1/sliders → danh sách slider đang hoạt động, đúng khoảng thời gian
 *
 * ĐIỀU KIỆN HIỂN THỊ:
 *   - is_active = 1
 *   - start_date IS NULL hoặc đã đến thời điểm bắt đầu
 *   - end_date IS NULL hoặc chưa hết hạn
 * Sắp xếp theo sort_order ASC → quản trị viên điều chỉnh thứ tự qua admin panel
 */

// ─── Router ──────────────────────────────────────────────────────────────────
function handleSliders($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phuong thuc khong duoc ho tro'], 405);
    }

    // Lọc theo thời gian hiệu lực: start_date ≤ NOW() ≤ end_date (hoặc NULL = không giới hạn)
    $sliders = queryAll(
        "SELECT id, title, subtitle, image_url, link, button_text, sort_order
         FROM sliders
         WHERE is_active = 1
           AND (start_date IS NULL OR start_date <= NOW())
           AND (end_date IS NULL OR end_date >= NOW())
         ORDER BY sort_order ASC, id DESC"
    );

    jsonResponse(['success' => true, 'data' => $sliders]);
}
?>

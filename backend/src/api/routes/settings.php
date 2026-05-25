<?php
/**
 * Settings API — cấu hình công khai của cửa hàng
 *
 * ENDPOINT MAP (GET công khai):
 *   GET /api/v1/settings → toàn bộ settings được type-cast đúng kiểu
 *
 * MỤC ĐÍCH:
 *   Trả cấu hình trang web (tên cửa hàng, thông tin liên hệ, shipping fee, v.v.)
 *   để frontend render đúng mà không cần hardcode.
 *
 * KIỂU DỮ LIỆU (cột `type` trong bảng settings):
 *   'number'  → float
 *   'boolean' → true/false
 *   'json'    → array/object được decode
 *   mặc định  → string
 *
 * Admin có thể chỉnh sửa qua POST/PUT/DELETE tại /api/v1/admin/settings (yêu cầu super_admin).
 */

// ─── Router ──────────────────────────────────────────────────────────────────
function handlePublicSettings($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phuong thuc khong duoc ho tro'], 405);
    }

    $rows = queryAll("SELECT key_name, value, type, group_name FROM settings ORDER BY group_name, key_name");
    $settings = [];

    // Trả object key-value thay vì mảng để frontend truy cập dễ dàng: settings.store_name
    foreach ($rows as $row) {
        $settings[$row['key_name']] = castSettingValue($row['value'], $row['type']);
    }

    jsonResponse(['success' => true, 'data' => $settings]);
}

// ─── Ép kiểu giá trị cài đặt theo cột `type` ────────────────────────────────
// Mọi giá trị trong DB lưu dạng string; hàm này chuyển về PHP type đúng để truyền xuống client
function castSettingValue($value, $type) {
    if ($type === 'number') {
        return is_numeric($value) ? (float)$value : 0;
    }

    if ($type === 'boolean') {
        // filter_var nhận 'true'/'false'/'1'/'0'/'yes'/'no' → bool
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    if ($type === 'json') {
        $decoded = json_decode($value ?? '', true);
        return $decoded === null ? null : $decoded; // giữ null thay vì array rỗng khi JSON lỗi
    }

    return $value;
}
?>

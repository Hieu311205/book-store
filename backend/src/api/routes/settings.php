<?php
function handlePublicSettings($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phuong thuc khong duoc ho tro'], 405);
    }

    $rows = queryAll("SELECT key_name, value, type, group_name FROM settings ORDER BY group_name, key_name");
    $settings = [];

    foreach ($rows as $row) {
        $settings[$row['key_name']] = castSettingValue($row['value'], $row['type']);
    }

    jsonResponse(['success' => true, 'data' => $settings]);
}

function castSettingValue($value, $type) {
    if ($type === 'number') {
        return is_numeric($value) ? (float)$value : 0;
    }

    if ($type === 'boolean') {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    if ($type === 'json') {
        $decoded = json_decode($value ?? '', true);
        return $decoded === null ? null : $decoded;
    }

    return $value;
}
?>

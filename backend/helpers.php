<?php
require_once __DIR__ . '/database.php';

function jsonResponse($payload, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function requestJson() {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function getBearerToken() {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (stripos($header, 'Bearer ') === 0) {
        return trim(substr($header, 7));
    }
    return null;
}

function currentUser() {
    global $pdo, $config;

    $token = getBearerToken();
    if (!$token) {
        return null;
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$header, $payload, $signature] = $parts;
    $expected = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(
        hash_hmac('sha256', "$header.$payload", $config['jwt']['secret'], true)
    ));

    if (!hash_equals($expected, $signature)) {
        return null;
    }

    $decoded = json_decode(base64UrlDecode($payload), true);
    if (!$decoded || (($decoded['exp'] ?? 0) < time())) {
        return null;
    }

    $stmt = $pdo->prepare("SELECT id, ugid, email, first_name, last_name, phone, role, avatar_url, is_active FROM users WHERE id = ?");
    $stmt->execute([$decoded['userId']]);
    $user = $stmt->fetch();
    return $user && (int)$user['is_active'] === 1 ? $user : null;
}

function requireUser() {
    $user = currentUser();
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Bạn cần đăng nhập'], 401);
    }
    return $user;
}

function queryAll($sql, $params = []) {
    global $pdo;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function queryOne($sql, $params = []) {
    global $pdo;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch();
    return $row ?: null;
}

function executeSql($sql, $params = []) {
    global $pdo;
    $stmt = $pdo->prepare($sql);
    return $stmt->execute($params);
}

function insertRow($table, $data) {
    global $pdo;
    $columns = array_keys($data);
    $names = implode(', ', $columns);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $sql = "INSERT INTO {$table} ({$names}) VALUES ({$placeholders})";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_values($data));
    return (int)$pdo->lastInsertId();
}

function updateRow($table, $id, $data) {
    if (!$data) {
        return;
    }
    $sets = implode(', ', array_map(fn($column) => "$column = ?", array_keys($data)));
    $params = array_values($data);
    $params[] = $id;
    executeSql("UPDATE {$table} SET {$sets} WHERE id = ?", $params);
}

function filterInput($input, $allowed) {
    return array_filter(
        array_intersect_key($input, array_flip($allowed)),
        fn($value) => $value !== null,
    );
}

function slugifyText($text) {
    $slug = strtolower(trim($text));
    $slug = preg_replace('/\s+/', '-', $slug);
    $slug = preg_replace('/[^\p{L}\p{N}\-]+/u', '', $slug);
    return trim(preg_replace('/\-+/', '-', $slug), '-');
}

function normalizeBool($value) {
    if ($value === null) {
        return null;
    }
    return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
}
?>

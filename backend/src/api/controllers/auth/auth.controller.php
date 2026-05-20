<?php
$config = include __DIR__ . '/../../../../config.php';

// Simple JWT functions (in production, use a library)
function base64UrlEncode($data) {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}

function generateToken($userId) {
    global $config;
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode(['userId' => $userId, 'iat' => time(), 'exp' => time() + (7 * 24 * 60 * 60)]); // 7 days
    $headerEncoded = base64UrlEncode($header);
    $payloadEncoded = base64UrlEncode($payload);
    $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, $config['jwt']['secret'], true);
    $signatureEncoded = base64UrlEncode($signature);
    return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
}

function register() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $first_name = $input['first_name'] ?? '';
    $last_name = $input['last_name'] ?? '';
    $phone = $input['phone'] ?? '';

    if (!$email || !$password) {
        jsonResponse(['success' => false, 'message' => 'Vui lòng nhập email và mật khẩu'], 400);
    }

    if (queryOne("SELECT id FROM users WHERE email = ?", [$email])) {
        jsonResponse(['success' => false, 'message' => 'Email đã được đăng ký'], 409);
    }

    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    $ugid = uniqid();

    $userId = insertRow('users', [
        'ugid' => $ugid,
        'email' => $email,
        'password_hash' => $password_hash,
        'first_name' => $first_name,
        'last_name' => $last_name,
        'phone' => $phone,
        'role' => 'customer',
        'is_active' => 1,
        'email_verified' => 0,
    ]);

    $user = queryOne("SELECT id, ugid, email, first_name, last_name, phone, role FROM users WHERE id = ?", [$userId]);

    $token = generateToken($userId);

    jsonResponse(['success' => true, 'message' => 'Đăng ký thành công', 'data' => ['user' => $user, 'token' => $token]], 201);
}

function login() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    $user = queryOne("SELECT * FROM users WHERE email = ?", [$email]);

    if (!$user || !verifyPassword($password, $user)) {
        jsonResponse(['success' => false, 'message' => 'Email hoặc mật khẩu không đúng'], 401);
    }

    if (!$user['is_active']) {
        jsonResponse(['success' => false, 'message' => 'Tài khoản đã bị khóa'], 403);
    }

    // Merge session cart into user cart
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
    if ($sessionId) {
        $sessionItems = queryAll("SELECT * FROM cart_items WHERE session_id = ?", [$sessionId]);
        foreach ($sessionItems as $item) {
            $existing = queryOne(
                "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
                [$user['id'], $item['product_id']]
            );
            if ($existing) {
                executeSql(
                    "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
                    [$item['quantity'], $existing['id']]
                );
                executeSql("DELETE FROM cart_items WHERE id = ?", [$item['id']]);
            } else {
                executeSql(
                    "UPDATE cart_items SET user_id = ?, session_id = NULL WHERE id = ?",
                    [$user['id'], $item['id']]
                );
            }
        }
    }

    $token = generateToken($user['id']);

    $userData = [
        'id' => $user['id'],
        'ugid' => $user['ugid'],
        'email' => $user['email'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'phone' => $user['phone'],
        'role' => $user['role'],
        'avatar_url' => $user['avatar_url'],
    ];

    jsonResponse(['success' => true, 'data' => ['user' => $userData, 'token' => $token]]);
}

function logout() {
    jsonResponse(['success' => true, 'message' => 'Đã đăng xuất']);
}

function verifyPassword($password, $user) {
    $stored = $user['password_hash'] ?? '';

    if (password_verify($password, $stored)) {
        return true;
    }

    if (hash_equals((string)$stored, (string)$password)) {
        updateRow('users', $user['id'], [
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ]);
        return true;
    }

    return false;
}

function forgotPassword() {
    jsonResponse(['success' => true, 'message' => 'Chức năng quên mật khẩu chưa được triển khai']);
}

function resetPassword() {
    jsonResponse(['success' => true, 'message' => 'Chức năng đặt lại mật khẩu chưa được triển khai']);
}

function getMe() {
    $user = requireUser();
    jsonResponse(['success' => true, 'data' => ['user' => $user]]);
}

function updateMe() {
    $user = requireUser();
    $input = requestJson();
    $data = filterInput($input, ['first_name', 'last_name', 'phone', 'avatar_url']);
    updateRow('users', $user['id'], $data);
    $updated = queryOne("SELECT id, ugid, email, first_name, last_name, phone, role, avatar_url FROM users WHERE id = ?", [$user['id']]);
    jsonResponse(['success' => true, 'message' => 'Đã cập nhật hồ sơ', 'data' => ['user' => $updated]]);
}
function changePassword() {
    $user = requireUser();
    $input = requestJson();
    $currentPassword = $input['current_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    $confirmPassword = $input['confirm_password'] ?? '';

    if (!$newPassword || !$confirmPassword) {
        jsonResponse(['success' => false, 'message' => 'Vui lòng nhập mật khẩu mới'], 400);
    }

    if ($newPassword !== $confirmPassword) {
        jsonResponse(['success' => false, 'message' => 'Mật khẩu xác nhận không khớp'], 400);
    }

    if (strlen($newPassword) < 6) {
        jsonResponse(['success' => false, 'message' => 'Mật khẩu mới phải có ít nhất 6 ký tự'], 400);
    }

    $fullUser = queryOne("SELECT * FROM users WHERE id = ?", [$user['id']]);
    if (!$fullUser) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy tài khoản'], 404);
    }

    $hasPassword = !empty($fullUser['password_hash']);
    if ($hasPassword && (!$currentPassword || !verifyPassword($currentPassword, $fullUser))) {
        jsonResponse(['success' => false, 'message' => 'Mật khẩu hiện cũ không đúng'], 400);
    }

    if ($hasPassword && verifyPassword($newPassword, $fullUser)) {
        jsonResponse(['success' => false, 'message' => 'Mật khẩu mới không được trùng mật khẩu hiện cũ'], 400);
    }

    updateRow('users', $user['id'], [
        'password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
    ]);

    jsonResponse(['success' => true, 'message' => 'Đã đổi mật khẩu']);
}

function googleLogin() {
    $input = requestJson();
    $credential = $input['credential'] ?? '';

    if (!$credential) {
        jsonResponse(['success' => false, 'message' => 'Thiếu thông tin đăng nhập Google'], 400);
    }

    $googleUser = verifyGoogleCredential($credential);
    if (!$googleUser) {
        jsonResponse(['success' => false, 'message' => 'Không thể xác thực tài khoản Google'], 401);
    }

    $email = strtolower(trim($googleUser['email'] ?? ''));
    $googleId = $googleUser['sub'] ?? '';
    if (!$email || !$googleId) {
        jsonResponse(['success' => false, 'message' => 'Tài khoản Google không có email hợp lệ'], 400);
    }

    $user = queryOne("SELECT * FROM users WHERE google_id = ? OR email = ? LIMIT 1", [$googleId, $email]);

    if ($user && !(int)$user['is_active']) {
        jsonResponse(['success' => false, 'message' => 'Tài khoản đã bị khóa'], 403);
    }

    if ($user) {
        $updateData = [
            'google_id' => $googleId,
            'email_verified' => 1,
        ];
        if (empty($user['avatar_url']) && !empty($googleUser['picture'])) {
            $updateData['avatar_url'] = $googleUser['picture'];
        }
        updateRow('users', $user['id'], $updateData);
        $userId = (int)$user['id'];
    } else {
        $nameParts = splitGoogleName($googleUser['name'] ?? '');
        $userId = insertRow('users', [
            'ugid' => uniqid('google-', true),
            'email' => $email,
            'password_hash' => null,
            'first_name' => $googleUser['given_name'] ?? $nameParts['first_name'],
            'last_name' => $googleUser['family_name'] ?? $nameParts['last_name'],
            'avatar_url' => $googleUser['picture'] ?? null,
            'role' => 'customer',
            'is_active' => 1,
            'email_verified' => 1,
            'google_id' => $googleId,
        ]);
    }

    mergeSessionCartIntoUser($userId);

    $userData = queryOne("SELECT id, ugid, email, first_name, last_name, phone, role, avatar_url FROM users WHERE id = ?", [$userId]);
    $token = generateToken($userId);

    jsonResponse(['success' => true, 'message' => 'Đăng nhập Google thành công', 'data' => ['user' => $userData, 'token' => $token]]);
}

function verifyGoogleCredential($credential) {
    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential);
    $body = null;

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $body = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        if ($status !== 200) {
            return null;
        }
    } else {
        $body = @file_get_contents($url);
    }

    $payload = $body ? json_decode($body, true) : null;
    if (!$payload || empty($payload['sub']) || empty($payload['email'])) {
        return null;
    }

    $configuredClientId = getenv('GOOGLE_CLIENT_ID') ?: getenv('VITE_GOOGLE_CLIENT_ID') ?: '';
    if ($configuredClientId && ($payload['aud'] ?? '') !== $configuredClientId) {
        return null;
    }

    if (($payload['email_verified'] ?? 'false') !== 'true' && ($payload['email_verified'] ?? false) !== true) {
        return null;
    }

    return $payload;
}

function splitGoogleName($name) {
    $name = trim($name);
    if (!$name) {
        return ['first_name' => 'Google', 'last_name' => 'User'];
    }
    $parts = preg_split('/\s+/', $name);
    $firstName = array_shift($parts) ?: 'Google';
    return [
        'first_name' => $firstName,
        'last_name' => $parts ? implode(' ', $parts) : '',
    ];
}

function mergeSessionCartIntoUser($userId) {
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? null;
    if (!$sessionId) {
        return;
    }

    $sessionItems = queryAll("SELECT * FROM cart_items WHERE session_id = ?", [$sessionId]);
    foreach ($sessionItems as $item) {
        $existing = queryOne(
            "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
            [$userId, $item['product_id']]
        );
        if ($existing) {
            executeSql(
                "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
                [$item['quantity'], $existing['id']]
            );
            executeSql("DELETE FROM cart_items WHERE id = ?", [$item['id']]);
        } else {
            executeSql(
                "UPDATE cart_items SET user_id = ?, session_id = NULL WHERE id = ?",
                [$userId, $item['id']]
            );
        }
    }
}
?>

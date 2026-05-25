<?php
/**
 * ROUTER XÁC THỰC — src/api/routes/auth.php
 *
 * Vị trí trong kiến trúc:
 *   index.php  →  handleAuth()  →  auth.controller.php  (logic xử lý thực sự)
 *
 * Luồng dữ liệu:
 *   HTTP Request /api/v1/auth/<action>
 *     → index.php dispatch vào handleAuth($method, $pathParts)
 *       → handleAuth() đọc $pathParts[1] làm $action
 *         → require auth.controller.php (chỉ load 1 lần nhờ require_once)
 *           → gọi hàm controller tương ứng (register, login, googleLogin, ...)
 *
 * Ánh xạ endpoint → hàm controller:
 *   POST /auth/register         → register()
 *   POST /auth/login            → login()
 *   POST /auth/google           → googleLogin()
 *   POST /auth/logout           → logout()
 *   POST /auth/forgot-password  → forgotPassword()
 *   POST /auth/reset-password   → resetPassword()
 *   GET  /auth/me               → getMe()
 *   PUT  /auth/me               → updateMe()
 *   PUT  /auth/password         → changePassword()
 */

// src/api/routes/auth.php
/**
 * Entry point cho tất cả request tới /api/v1/auth/*.
 * Input:  $method (string) — HTTP method; $pathParts (array) — phân đoạn URL.
 * Output: gọi hàm controller phù hợp → jsonResponse (exit trong controller).
 * Gọi từ: index.php khi $endpoint === 'auth'.
 */
function handleAuth($method, $pathParts) {
    $action = $pathParts[1] ?? '';
    switch ($method) {
        case 'POST':
            if ($action === 'register') {
                require_once __DIR__ . '/../controllers/auth/auth.controller.php';
                register();
            } elseif ($action === 'login') {
                require_once __DIR__ . '/../controllers/auth/auth.controller.php';
                login();
            } elseif ($action === 'google') {
                require_once __DIR__ . '/../controllers/auth/auth.controller.php';
                googleLogin();
            } elseif ($action === 'logout') {
                require_once __DIR__ . '/../controllers/auth/auth.controller.php';
                logout();
            } elseif ($action === 'forgot-password') {
                require_once __DIR__ . '/../controllers/auth/auth.controller.php';
                forgotPassword();
            } elseif ($action === 'reset-password') {
                require_once __DIR__ . '/../controllers/auth/auth.controller.php';
                resetPassword();
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Không tìm thấy thao tác']);
            }
            break;
        case 'GET':
            if ($action === 'me') {
                require_once __DIR__ . '/../controllers/auth/auth.controller.php';
                getMe();
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Không tìm thấy thao tác']);
            }
            break;
        case 'PUT':
            if ($action === 'me') {
                require_once __DIR__ . '/../controllers/auth/auth.controller.php';
                updateMe();
            } elseif ($action === 'password') {
                require_once __DIR__ . '/../controllers/auth/auth.controller.php';
                changePassword();
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Không tìm thấy thao tác']);
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Phương thức không được hỗ trợ']);
    }
}
?>

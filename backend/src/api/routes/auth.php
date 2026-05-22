<?php
// src/api/routes/auth.php
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

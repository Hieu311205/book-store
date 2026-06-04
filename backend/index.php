<?php
/**
 * ENTRY POINT CHÍNH CỦA BACKEND — index.php
 *
 * Kiến trúc tổng thể:
 *   HTTP Request (từ trình duyệt/frontend)
 *     → index.php  (nhận, xác thực CORS, rate-limit, parse URL)
 *       → switch($endpoint)  (dispatch dựa trên segment đầu tiên của path)
 *         → src/api/routes/<tên>.php  (route handler cụ thể)
 *           → src/api/controllers/<nhóm>/<tên>.controller.php  (logic xử lý)
 *             → helpers.php / database.php  (tiện ích & truy vấn DB)
 *               → MySQL  (lưu trữ dữ liệu)
 *
 * Luồng dữ liệu chính:
 *   1. Request vào → kiểm tra CORS origin → gắn header CORS.
 *   2. Nếu là OPTIONS preflight → trả về 200 ngay, không xử lý thêm.
 *   3. Khởi động session → đếm số request trong cửa sổ thời gian → rate-limit 429.
 *   4. Parse REQUEST_URI → lấy segment đầu làm $endpoint.
 *   5. switch($endpoint) → require file route tương ứng → gọi handle*().
 *   6. Mọi lỗi chưa bắt → set_exception_handler trả JSON 500.
 */
require_once __DIR__ . '/helpers.php';
$config = include __DIR__ . '/config.php';

// Suppress PHP error output — log only, never echo to response
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Global exception handler — catch uncaught exceptions and return JSON
set_exception_handler(function (Throwable $e) {
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi máy chủ nội bộ',
        'debug'   => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

// --- CORS ---
// So sánh origin của request với danh sách được phép trong config.php
// Nếu khớp → echo đúng origin đó (hỗ trợ nhiều domain); nếu không → dùng origin đầu tiên mặc định
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $config['cors']['origin'];
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    header('Access-Control-Allow-Origin: ' . ($allowedOrigins[0] ?? '*'));
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-session-id');
header('Content-Type: application/json; charset=utf-8');

// Preflight OPTIONS — trình duyệt gửi trước khi thực hiện request thật
// Trả về 200 ngay để browser biết CORS được chấp nhận, không cần xử lý thêm
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- RATE LIMITING dựa trên PHP session ---
// Lưu mảng timestamp các request trong session → loại bỏ timestamp cũ hơn windowMs
// Nếu vượt quá config['rateLimit']['max'] trong cửa sổ thời gian → 429
session_start();
$now = time();
$windowStart = $now - ($config['rateLimit']['windowMs'] / 1000);
if (!isset($_SESSION['requests'])) {
    $_SESSION['requests'] = [];
}
// Loại bỏ các request nằm ngoài cửa sổ thời gian để cửa sổ trượt (sliding window)
$_SESSION['requests'] = array_filter($_SESSION['requests'], function($time) use ($windowStart) {
    return $time > $windowStart;
});
if (count($_SESSION['requests']) >= $config['rateLimit']['max']) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Ban thao tac qua nhanh. Vui long thu lai sau.']);
    exit;
}
$_SESSION['requests'][] = $now;

// --- ROUTING ---
// Parse URL → lấy phần path thuần (bỏ query string)
// Cắt bỏ tiền tố /api/v1 (8 ký tự) → còn lại path con
// Phân tách theo '/' → $pathParts[0] là endpoint chính
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if (strpos($requestUri, '/api/v1') === 0) {
    $path = substr($requestUri, 8);
    $pathParts = explode('/', trim($path, '/'));
    $endpoint = $pathParts[0] ?? '';

    // Dispatch: mỗi case load file route và gọi handler tương ứng
    // $pathParts được truyền xuống để route handler tự parse sub-path (vd: /products/123)
    switch ($endpoint) {
        case 'auth':
            require_once __DIR__ . '/src/api/routes/auth.php';
            handleAuth($method, $pathParts);
            break;
        case 'products':
            require_once __DIR__ . '/src/api/routes/products.php';
            handleProducts($method, $pathParts);
            break;
        case 'categories':
            require_once __DIR__ . '/src/api/routes/categories.php';
            handleCategories($method, $pathParts);
            break;
        case 'sliders':
            require_once __DIR__ . '/src/api/routes/sliders.php';
            handleSliders($method, $pathParts);
            break;
        case 'settings':
            require_once __DIR__ . '/src/api/routes/settings.php';
            handlePublicSettings($method, $pathParts);
            break;
        case 'cart':
            require_once __DIR__ . '/src/api/routes/cart.php';
            handleCart($method, $pathParts);
            break;
        case 'orders':
            require_once __DIR__ . '/src/api/routes/orders.php';
            handleOrders($method, $pathParts);
            break;
        case 'reviews':
            require_once __DIR__ . '/src/api/routes/reviews.php';
            handleReviews($method, $pathParts);
            break;
        case 'otp':
            require_once __DIR__ . '/src/api/routes/otp.php';
            handleOtp($method, $pathParts);
            break;
        case 'wallet':
            require_once __DIR__ . '/src/api/routes/wallet.php';
            handleWallet($method, $pathParts);
            break;
        case 'users':
            require_once __DIR__ . '/src/api/routes/users.php';
            handleUsers($method, $pathParts);
            break;
        case 'authors':
            require_once __DIR__ . '/src/api/routes/authors.php';
            handleAuthors($method, $pathParts);
            break;
        case 'publishers':
            require_once __DIR__ . '/src/api/routes/publishers.php';
            handlePublishers($method, $pathParts);
            break;
        case 'admin':
            require_once __DIR__ . '/src/api/routes/admin.php';
            handleAdmin($method, $pathParts);
            break;
        case 'health':
            // Endpoint kiểm tra sức khoẻ hệ thống — dùng bởi monitoring/load-balancer
            echo json_encode([
                'success' => true,
                'message' => 'API dang hoat dong',
                'database' => testConnection() ? 'connected' : 'disconnected',
                'timestamp' => date('c'),
            ], JSON_UNESCAPED_UNICODE);
            break;
        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Khong tim thay API']);
    }
} else {
    // Request không bắt đầu bằng /api/v1 → trả thông tin cơ bản về API
    echo json_encode([
        'success' => true,
        'message' => 'API dang hoat dong',
        'version' => '1.0.0',
        'docs' => '/api/v1/health',
    ]);
}
?>

<?php
require_once __DIR__ . '/helpers.php';
$config = include __DIR__ . '/config.php';

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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();
$now = time();
$windowStart = $now - ($config['rateLimit']['windowMs'] / 1000);
if (!isset($_SESSION['requests'])) {
    $_SESSION['requests'] = [];
}
$_SESSION['requests'] = array_filter($_SESSION['requests'], function($time) use ($windowStart) {
    return $time > $windowStart;
});
if (count($_SESSION['requests']) >= $config['rateLimit']['max']) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Ban thao tac qua nhanh. Vui long thu lai sau.']);
    exit;
}
$_SESSION['requests'][] = $now;

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if (strpos($requestUri, '/api/v1') === 0) {
    $path = substr($requestUri, 8);
    $pathParts = explode('/', trim($path, '/'));
    $endpoint = $pathParts[0] ?? '';

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
        case 'users':
            require_once __DIR__ . '/src/api/routes/users.php';
            handleUsers($method, $pathParts);
            break;
        case 'admin':
            require_once __DIR__ . '/src/api/routes/admin.php';
            handleAdmin($method, $pathParts);
            break;
        case 'health':
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
    echo json_encode([
        'success' => true,
        'message' => 'API dang hoat dong',
        'version' => '1.0.0',
        'docs' => '/api/v1/health',
    ]);
}
?>

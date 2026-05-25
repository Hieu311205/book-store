<?php
/**
 * KẾT NỐI CƠ SỞ DỮ LIỆU — database.php
 *
 * Vị trí trong kiến trúc:
 *   config.php  →  database.php  →  helpers.php  →  mọi route/controller
 *
 * Luồng dữ liệu:
 *   1. helpers.php require_once file này ở dòng đầu tiên.
 *   2. database.php đọc thông tin kết nối từ config.php ($config['db']).
 *   3. Khởi tạo đối tượng PDO → lưu vào biến global $pdo.
 *   4. Tất cả hàm trong helpers.php (queryAll, queryOne, ...) truy cập $pdo qua `global $pdo`.
 *   5. Nếu kết nối thất bại → trả JSON lỗi 500 ngay, không tiếp tục xử lý request.
 *
 * Cấu hình PDO quan trọng:
 *   - ERRMODE_EXCEPTION: mọi lỗi SQL ném PDOException → dễ bắt bằng try/catch.
 *   - FETCH_ASSOC: kết quả trả về là mảng kết hợp (key = tên cột), không dùng index số.
 *   - EMULATE_PREPARES = false: dùng prepared statement thật của MySQL, an toàn hơn.
 */
require_once __DIR__ . '/config.php';

$config = include __DIR__ . '/config.php';

try {
    // Kiểm tra extension trước để báo lỗi rõ ràng thay vì "class PDO not found"
    if (!extension_loaded('pdo_mysql')) {
        throw new PDOException('PHP extension pdo_mysql is not installed or not enabled.');
    }

    // Tạo DSN (Data Source Name) từ config — charset utf8mb4 hỗ trợ emoji và tiếng Việt
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        $config['db']['host'],
        $config['db']['port'],
        $config['db']['database'],
        $config['db']['charset']
    );

    // $pdo là biến global — được dùng xuyên suốt toàn bộ ứng dụng qua `global $pdo`
    $pdo = new PDO(
        $dsn,
        $config['db']['username'],
        $config['db']['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    // Kết nối thất bại → dừng ngay, trả JSON lỗi, không để lỗi PHP raw lộ ra ngoài
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Khong the ket noi co so du lieu MySQL',
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Kiểm tra kết nối DB còn sống không.
 * Input: không có. Output: bool — true nếu DB phản hồi, false nếu không.
 * Được gọi từ: index.php endpoint /health để giám sát trạng thái hệ thống.
 */
function testConnection() {
    global $pdo;

    try {
        $pdo->query('SELECT 1');
        return true;
    } catch (PDOException $e) {
        return false;
    }
}
?>

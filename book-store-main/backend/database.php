<?php
require_once __DIR__ . '/config.php';

$config = include __DIR__ . '/config.php';

try {
    if (!extension_loaded('pdo_mysql')) {
        throw new PDOException('PHP extension pdo_mysql is not installed or not enabled.');
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        $config['db']['host'],
        $config['db']['port'],
        $config['db']['database'],
        $config['db']['charset']
    );

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
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Khong the ket noi co so du lieu MySQL',
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

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

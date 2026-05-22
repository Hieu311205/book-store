<?php
// config.php
$env = getenv('APP_ENV') ?: 'development';
$envFile = $env === 'production' ? 'production.env' : 'development.env';

// Load environment variables (simple implementation, in production use a library)
if (file_exists(__DIR__ . '/' . $envFile)) {
    $lines = file(__DIR__ . '/' . $envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            putenv("$key=$value");
        }
    }
}

$config = [
    'appEnv' => getenv('APP_ENV') ?: 'development',
    'port' => (int)(getenv('PORT') ?: 5000),

    'db' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => getenv('DB_PORT') ?: '3306',
        'database' => getenv('DB_NAME') ?: 'bookstore',
        'username' => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASSWORD') ?: '',
        'charset' => getenv('DB_CHARSET') ?: 'utf8mb4',
    ],

    'jwt' => [
        'secret' => getenv('JWT_SECRET') ?: 'default-secret-key',
        'expiresIn' => getenv('JWT_EXPIRES_IN') ?: '7d',
    ],

    'cors' => [
        'origin' => getenv('CORS_ORIGIN') ? explode(',', getenv('CORS_ORIGIN')) : ['http://localhost:3000', 'http://localhost:3001'],
    ],

    'rateLimit' => [
        'windowMs' => (int)(getenv('RATE_LIMIT_WINDOW_MS') ?: 900000),
        'max' => (int)(getenv('RATE_LIMIT_MAX_REQUESTS') ?: ($env === 'production' ? 100 : 1000)),
    ],

    'upload' => [
        'maxFileSize' => (int)(getenv('MAX_FILE_SIZE') ?: 5242880),
        'path' => getenv('UPLOAD_PATH') ?: './uploads',
    ],
];

return $config;
?>

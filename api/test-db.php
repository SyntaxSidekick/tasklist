<?php
// Test database connection
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

try {
    // Load database config
    $config = require __DIR__ . '/config/database.php';
    
    // Create connection
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    
    // Test query - count tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Test query - count users
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $userCount = $stmt->fetch()['count'];
    
    echo json_encode([
        'success' => true,
        'message' => '✅ Database connection successful!',
        'database' => $config['database'],
        'tables' => count($tables),
        'table_names' => $tables,
        'users_count' => $userCount
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}

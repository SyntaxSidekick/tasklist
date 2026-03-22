<?php
// Debug password verification
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load database config
$config = require __DIR__ . '/config/database.php';
$dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
$db = new PDO($dsn, $config['username'], $config['password'], $config['options']);

// Get user
$stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute(['test@example.com']);
$user = $stmt->fetch();

$password = 'password123';

header('Content-Type: application/json');
echo json_encode([
    'user_found' => !empty($user),
    'email' => $user['email'] ?? 'not found',
    'hash_from_db' => $user['password_hash'] ?? 'not found',
    'hash_length' => strlen($user['password_hash'] ?? ''),
    'password_to_test' => $password,
    'password_verify_result' => password_verify($password, $user['password_hash'] ?? ''),
    'hash_info' => password_get_info($user['password_hash'] ?? ''),
], JSON_PRETTY_PRINT);

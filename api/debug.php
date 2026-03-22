<?php
// Debug API requests
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

echo json_encode([
    'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'],
    'REQUEST_URI' => $_SERVER['REQUEST_URI'],
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'],
    'PATH_INFO' => $_SERVER['PATH_INFO'] ?? 'not set',
    'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? '',
    'HTTP_HOST' => $_SERVER['HTTP_HOST'],
    'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'],
    'getallheaders' => getallheaders(),
    'php_input' => file_get_contents('php://input'),
    'mod_rewrite' => function_exists('apache_get_modules') && in_array('mod_rewrite', apache_get_modules()) ? 'enabled' : 'unknown'
], JSON_PRETTY_PRINT);

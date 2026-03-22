<?php
// Start output buffering to prevent any output before JSON
ob_start();

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Set to 1 for development
ini_set('log_errors', 1);

// Set timezone
date_default_timezone_set('UTC');

// CORS headers
$config = require __DIR__ . '/config/app.php';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $config['cors_origins'])) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Autoload core classes
spl_autoload_register(function ($class) {
    $paths = [
        __DIR__ . '/core/' . $class . '.php',
        __DIR__ . '/controllers/' . $class . '.php',
        __DIR__ . '/models/' . $class . '.php',
    ];
    
    foreach ($paths as $path) {
        if (file_exists($path)) {
            require_once $path;
            return;
        }
    }
});

// Initialize router
$router = new Router();

// Health check
$router->get('/health', function() {
    Response::success(['status' => 'ok', 'timestamp' => time()]);
});

// Auth routes
$router->post('/auth/register', 'AuthController@register');
$router->post('/auth/login', 'AuthController@login');
$router->post('/auth/logout', 'AuthController@logout');
$router->get('/auth/me', 'AuthController@me');

// User routes
$router->get('/users/profile', 'UserController@getProfile');
$router->put('/users/profile', 'UserController@updateProfile');

// Project routes
$router->get('/projects', 'ProjectController@index');
$router->post('/projects', 'ProjectController@store');
$router->get('/projects/{id}', 'ProjectController@show');
$router->put('/projects/{id}', 'ProjectController@update');
$router->delete('/projects/{id}', 'ProjectController@delete');
$router->post('/projects/{id}/reorder', 'ProjectController@reorder');

// Section routes
$router->get('/projects/{projectId}/sections', 'SectionController@index');
$router->post('/projects/{projectId}/sections', 'SectionController@store');
$router->put('/sections/{id}', 'SectionController@update');
$router->delete('/sections/{id}', 'SectionController@delete');

// Task routes
$router->get('/tasks', 'TaskController@index');
$router->get('/tasks/today', 'TaskController@today');
$router->get('/tasks/upcoming', 'TaskController@upcoming');
$router->post('/tasks', 'TaskController@store');
$router->get('/tasks/{id}', 'TaskController@show');
$router->put('/tasks/{id}', 'TaskController@update');
$router->patch('/tasks/{id}/complete', 'TaskController@complete');
$router->patch('/tasks/{id}/uncomplete', 'TaskController@uncomplete');
$router->delete('/tasks/{id}', 'TaskController@delete');
$router->post('/tasks/reorder', 'TaskController@reorder');

// Label routes
$router->get('/labels', 'LabelController@index');
$router->post('/labels', 'LabelController@store');
$router->put('/labels/{id}', 'LabelController@update');
$router->delete('/labels/{id}', 'LabelController@delete');

// Reminder routes
$router->get('/reminders/upcoming', 'ReminderController@upcoming');
$router->post('/tasks/{taskId}/reminders', 'ReminderController@store');
$router->delete('/reminders/{id}', 'ReminderController@delete');

// Pomodoro routes
$router->get('/pomodoro/stats', 'PomodoroController@stats');
$router->post('/pomodoro/sessions', 'PomodoroController@store');
$router->get('/pomodoro/sessions', 'PomodoroController@index');

// Notification routes
$router->get('/notifications', 'NotificationController@index');
$router->patch('/notifications/{id}/read', 'NotificationController@markAsRead');
$router->post('/notifications/read-all', 'NotificationController@markAllAsRead');
$router->delete('/notifications/{id}', 'NotificationController@delete');

// Dispatch the request
try {
    $router->dispatch();
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    Response::error('Internal server error', 500);
}

// Clean output buffer and ensure valid JSON is sent
if (ob_get_length()) {
    ob_end_flush();
}

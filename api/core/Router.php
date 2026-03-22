<?php

class Router {
    private $routes = [];
    
    public function get($path, $handler) {
        $this->addRoute('GET', $path, $handler);
    }
    
    public function post($path, $handler) {
        $this->addRoute('POST', $path, $handler);
    }
    
    public function put($path, $handler) {
        $this->addRoute('PUT', $path, $handler);
    }
    
    public function patch($path, $handler) {
        $this->addRoute('PATCH', $path, $handler);
    }
    
    public function delete($path, $handler) {
        $this->addRoute('DELETE', $path, $handler);
    }
    
    private function addRoute($method, $path, $handler) {
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $path);
        $pattern = '#^' . $pattern . '$#';
        
        $this->routes[] = [
            'method' => $method,
            'pattern' => $pattern,
            'handler' => $handler,
            'path' => $path
        ];
    }
    
    public function dispatch() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Remove base path - handles both /api and /folder-name/api
        $path = preg_replace('#^.*/api#', '', $path);
        
        // Default to / if path is empty
        if (empty($path)) {
            $path = '/';
        }
        
        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }
            
            if (preg_match($route['pattern'], $path, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                
                if (is_callable($route['handler'])) {
                    call_user_func($route['handler'], $params);
                    return;
                } else {
                    list($controller, $method) = explode('@', $route['handler']);
                    
                    if (class_exists($controller) && method_exists($controller, $method)) {
                        $instance = new $controller();
                        call_user_func([$instance, $method], $params);
                        return;
                    }
                }
            }
        }
        
        Response::notFound('Endpoint not found');
    }
}

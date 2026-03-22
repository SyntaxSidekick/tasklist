<?php

class Request {
    public static function getBody() {
        $body = file_get_contents('php://input');
        return json_decode($body, true) ?? [];
    }
    
    public static function get($key, $default = null) {
        $body = self::getBody();
        return $body[$key] ?? $_GET[$key] ?? $default;
    }
    
    public static function all() {
        return array_merge($_GET, self::getBody());
    }
    
    public static function query($key, $default = null) {
        return $_GET[$key] ?? $default;
    }
    
    public static function header($key) {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $key));
        return $_SERVER[$key] ?? null;
    }
    
    public static function method() {
        return $_SERVER['REQUEST_METHOD'];
    }
    
    public static function ip() {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            return $_SERVER['HTTP_X_FORWARDED_FOR'];
        }
        return $_SERVER['REMOTE_ADDR'];
    }
}

<?php

class Auth {
    public static function getCurrentUser() {
        $payload = JWT::getFromCookie();
        
        if (!$payload || !isset($payload['user_id'])) {
            return null;
        }
        
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id, email, name, avatar, timezone, theme FROM users WHERE id = ?");
        $stmt->execute([$payload['user_id']]);
        
        return $stmt->fetch();
    }
    
    public static function requireAuth() {
        $user = self::getCurrentUser();
        
        if (!$user) {
            Response::unauthorized('Authentication required');
        }
        
        return $user;
    }
    
    public static function hashPassword($password) {
        $config = require __DIR__ . '/../config/app.php';
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => $config['bcrypt_cost']]);
    }
    
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
}

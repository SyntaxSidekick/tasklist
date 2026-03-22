<?php

class AuthController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function register() {
        $data = Request::all();
        
        $validator = Validator::make($data, [
            'email' => 'required|email',
            'password' => 'required|min:8',
            'name' => 'required|min:2|max:100'
        ]);
        
        if (!$validator->validate()) {
            Response::error('Validation failed', 422, $validator->errors());
        }
        
        // Check if email exists
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        
        if ($stmt->fetch()) {
            Response::error('Email already registered', 409);
        }
        
        // Create user
        $passwordHash = Auth::hashPassword($data['password']);
        
        $stmt = $this->db->prepare("
            INSERT INTO users (email, password_hash, name, theme) 
            VALUES (?, ?, ?, 'system')
        ");
        
        $stmt->execute([
            $data['email'],
            $passwordHash,
            $data['name']
        ]);
        
        $userId = $this->db->lastInsertId();
        
        // Create default Inbox project
        $stmt = $this->db->prepare("
            INSERT INTO projects (user_id, name, color, order_index) 
            VALUES (?, 'Inbox', '#A7D08C', 0)
        ");
        $stmt->execute([$userId]);
        
        // Generate JWT
        $token = JWT::encode(['user_id' => $userId]);
        JWT::setCookie($token);
        
        // Get user data
        $stmt = $this->db->prepare("SELECT id, email, name, avatar, timezone, theme FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        Response::success([
            'user' => $user,
            'token' => $token
        ], 'Registration successful', 201);
    }
    
    public function login() {
        $data = Request::all();
        
        $validator = Validator::make($data, [
            'email' => 'required|email',
            'password' => 'required'
        ]);
        
        if (!$validator->validate()) {
            Response::error('Validation failed', 422, $validator->errors());
        }
        
        // Find user
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch();
        
        if (!$user || !Auth::verifyPassword($data['password'], $user['password_hash'])) {
            Response::error('Invalid credentials', 401);
        }
        
        // Generate JWT
        $token = JWT::encode(['user_id' => $user['id']]);
        JWT::setCookie($token);
        
        // Remove password from response
        unset($user['password_hash']);
        
        Response::success([
            'user' => $user,
            'token' => $token
        ], 'Login successful');
    }
    
    public function logout() {
        JWT::clearCookie();
        Response::success(null, 'Logged out successfully');
    }
    
    public function me() {
        $user = Auth::requireAuth();
        Response::success(['user' => $user]);
    }
}

<?php

class UserController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function getProfile() {
        $user = Auth::requireAuth();
        Response::success(['user' => $user]);
    }
    
    public function updateProfile() {
        $user = Auth::requireAuth();
        $data = Request::all();
        
        $validator = Validator::make($data, [
            'name' => 'min:2|max:100',
            'timezone' => 'max:50',
            'theme' => 'in:light,dark,system'
        ]);
        
        if (!$validator->validate()) {
            Response::error('Validation failed', 422, $validator->errors());
        }
        
        $updates = [];
        $params = [];
        
        if (isset($data['name'])) {
            $updates[] = 'name = ?';
            $params[] = $data['name'];
        }
        
        if (isset($data['timezone'])) {
            $updates[] = 'timezone = ?';
            $params[] = $data['timezone'];
        }
        
        if (isset($data['theme'])) {
            $updates[] = 'theme = ?';
            $params[] = $data['theme'];
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }
        
        $params[] = $user['id'];
        
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        // Get updated user
        $stmt = $this->db->prepare("SELECT id, email, name, avatar, timezone, theme FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $updatedUser = $stmt->fetch();
        
        Response::success(['user' => $updatedUser], 'Profile updated');
    }
}

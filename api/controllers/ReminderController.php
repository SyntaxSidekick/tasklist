<?php

class ReminderController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function upcoming() {
        $user = Auth::requireAuth();
        $now = date('Y-m-d H:i:s');
        $next30Minutes = date('Y-m-d H:i:s', strtotime('+30 minutes'));
        
        $stmt = $this->db->prepare("
            SELECT r.*, t.title as task_title, t.priority
            FROM reminders r
            INNER JOIN tasks t ON t.id = r.task_id
            WHERE t.user_id = ? 
              AND r.is_sent = 0 
              AND r.remind_at BETWEEN ? AND ?
            ORDER BY r.remind_at ASC
        ");
        $stmt->execute([$user['id'], $now, $next30Minutes]);
        $reminders = $stmt->fetchAll();
        
        // Mark as sent
        if (!empty($reminders)) {
            $reminderIds = array_column($reminders, 'id');
            $placeholders = implode(',', array_fill(0, count($reminderIds), '?'));
            $stmt = $this->db->prepare("UPDATE reminders SET is_sent = 1 WHERE id IN ($placeholders)");
            $stmt->execute($reminderIds);
        }
        
        Response::success(['reminders' => $reminders]);
    }
    
    public function store($params) {
        $user = Auth::requireAuth();
        $taskId = $params['taskId'];
        $data = Request::all();
        
        // Verify task ownership
        $stmt = $this->db->prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?");
        $stmt->execute([$taskId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Task not found');
        }
        
        $validator = Validator::make($data, [
            'remind_at' => 'required'
        ]);
        
        if (!$validator->validate()) {
            Response::error('Validation failed', 422, $validator->errors());
        }
        
        $stmt = $this->db->prepare("INSERT INTO reminders (task_id, remind_at) VALUES (?, ?)");
        $stmt->execute([$taskId, $data['remind_at']]);
        
        $reminderId = $this->db->lastInsertId();
        
        $stmt = $this->db->prepare("SELECT * FROM reminders WHERE id = ?");
        $stmt->execute([$reminderId]);
        $reminder = $stmt->fetch();
        
        Response::success(['reminder' => $reminder], 'Reminder created', 201);
    }
    
    public function delete($params) {
        $user = Auth::requireAuth();
        $reminderId = $params['id'];
        
        // Verify ownership via task
        $stmt = $this->db->prepare("
            SELECT r.id 
            FROM reminders r
            INNER JOIN tasks t ON t.id = r.task_id
            WHERE r.id = ? AND t.user_id = ?
        ");
        $stmt->execute([$reminderId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Reminder not found');
        }
        
        $stmt = $this->db->prepare("DELETE FROM reminders WHERE id = ?");
        $stmt->execute([$reminderId]);
        
        Response::success(null, 'Reminder deleted');
    }
}

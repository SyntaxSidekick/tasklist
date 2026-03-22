<?php

class PomodoroController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function stats() {
        $user = Auth::requireAuth();
        $period = Request::query('period', 'week'); // day, week, month
        
        $dateCondition = "";
        switch ($period) {
            case 'day':
                $dateCondition = "DATE(started_at) = CURDATE()";
                break;
            case 'week':
                $dateCondition = "YEARWEEK(started_at) = YEARWEEK(NOW())";
                break;
            case 'month':
                $dateCondition = "YEAR(started_at) = YEAR(NOW()) AND MONTH(started_at) = MONTH(NOW())";
                break;
        }
        
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(*) as total_sessions,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_sessions,
                SUM(CASE WHEN completed = 1 THEN duration_minutes ELSE 0 END) as total_minutes
            FROM pomodoro_sessions
            WHERE user_id = ? AND $dateCondition
        ");
        $stmt->execute([$user['id']]);
        $stats = $stmt->fetch();
        
        Response::success(['stats' => $stats]);
    }
    
    public function index() {
        $user = Auth::requireAuth();
        $limit = Request::query('limit', 20);
        
        $stmt = $this->db->prepare("
            SELECT ps.*, t.title as task_title
            FROM pomodoro_sessions ps
            LEFT JOIN tasks t ON t.id = ps.task_id
            WHERE ps.user_id = ?
            ORDER BY ps.started_at DESC
            LIMIT ?
        ");
        $stmt->execute([$user['id'], (int)$limit]);
        $sessions = $stmt->fetchAll();
        
        Response::success(['sessions' => $sessions]);
    }
    
    public function store() {
        $user = Auth::requireAuth();
        $data = Request::all();
        
        $validator = Validator::make($data, [
            'duration_minutes' => 'required|numeric',
            'completed' => 'required|in:0,1'
        ]);
        
        if (!$validator->validate()) {
            Response::error('Validation failed', 422, $validator->errors());
        }
        
        // Verify task ownership if task_id provided
        if (isset($data['task_id'])) {
            $stmt = $this->db->prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?");
            $stmt->execute([$data['task_id'], $user['id']]);
            
            if (!$stmt->fetch()) {
                Response::error('Task not found', 404);
            }
        }
        
        $stmt = $this->db->prepare("
            INSERT INTO pomodoro_sessions (user_id, task_id, duration_minutes, completed, started_at, completed_at) 
            VALUES (?, ?, ?, ?, NOW(), ?)
        ");
        
        $completedAt = $data['completed'] ? date('Y-m-d H:i:s') : null;
        
        $stmt->execute([
            $user['id'],
            $data['task_id'] ?? null,
            $data['duration_minutes'],
            $data['completed'],
            $completedAt
        ]);
        
        $sessionId = $this->db->lastInsertId();
        
        $stmt = $this->db->prepare("SELECT * FROM pomodoro_sessions WHERE id = ?");
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch();
        
        Response::success(['session' => $session], 'Session saved', 201);
    }
}

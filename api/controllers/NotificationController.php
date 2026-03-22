<?php

class NotificationController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function index() {
        $user = Auth::requireAuth();
        $unreadOnly = Request::query('unread_only', 0);
        $limit = Request::query('limit', 50);
        
        $sql = "SELECT * FROM notifications WHERE user_id = ?";
        $params = [$user['id']];
        
        if ($unreadOnly) {
            $sql .= " AND is_read = 0";
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT ?";
        $params[] = (int)$limit;
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $notifications = $stmt->fetchAll();
        
        // Get unread count
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$user['id']]);
        $unreadCount = $stmt->fetch()['count'];
        
        Response::success([
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ]);
    }
    
    public function markAsRead($params) {
        $user = Auth::requireAuth();
        $notificationId = $params['id'];
        
        $stmt = $this->db->prepare("SELECT id FROM notifications WHERE id = ? AND user_id = ?");
        $stmt->execute([$notificationId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Notification not found');
        }
        
        $stmt = $this->db->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
        $stmt->execute([$notificationId]);
        
        Response::success(null, 'Notification marked as read');
    }
    
    public function markAllAsRead() {
        $user = Auth::requireAuth();
        
        $stmt = $this->db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$user['id']]);
        
        Response::success(null, 'All notifications marked as read');
    }
    
    public function delete($params) {
        $user = Auth::requireAuth();
        $notificationId = $params['id'];
        
        $stmt = $this->db->prepare("SELECT id FROM notifications WHERE id = ? AND user_id = ?");
        $stmt->execute([$notificationId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Notification not found');
        }
        
        $stmt = $this->db->prepare("DELETE FROM notifications WHERE id = ?");
        $stmt->execute([$notificationId]);
        
        Response::success(null, 'Notification deleted');
    }
}

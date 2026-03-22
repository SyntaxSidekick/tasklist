<?php

class SectionController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function index($params) {
        $user = Auth::requireAuth();
        $projectId = $params['projectId'];
        
        // Verify project ownership
        $stmt = $this->db->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$projectId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Project not found');
        }
        
        $stmt = $this->db->prepare("
            SELECT s.*, COUNT(t.id) as task_count
            FROM sections s
            LEFT JOIN tasks t ON t.section_id = s.id AND t.completed = 0
            WHERE s.project_id = ?
            GROUP BY s.id
            ORDER BY s.order_index ASC
        ");
        $stmt->execute([$projectId]);
        $sections = $stmt->fetchAll();
        
        Response::success(['sections' => $sections]);
    }
    
    public function store($params) {
        $user = Auth::requireAuth();
        $projectId = $params['projectId'];
        $data = Request::all();
        
        // Verify project ownership
        $stmt = $this->db->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$projectId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Project not found');
        }
        
        $validator = Validator::make($data, [
            'name' => 'required|min:1|max:255'
        ]);
        
        if (!$validator->validate()) {
            Response::error('Validation failed', 422, $validator->errors());
        }
        
        // Get max order_index
        $stmt = $this->db->prepare("SELECT MAX(order_index) as max_order FROM sections WHERE project_id = ?");
        $stmt->execute([$projectId]);
        $result = $stmt->fetch();
        $orderIndex = ($result['max_order'] ?? 0) + 1;
        
        $stmt = $this->db->prepare("INSERT INTO sections (project_id, name, order_index) VALUES (?, ?, ?)");
        $stmt->execute([$projectId, $data['name'], $orderIndex]);
        
        $sectionId = $this->db->lastInsertId();
        
        $stmt = $this->db->prepare("SELECT * FROM sections WHERE id = ?");
        $stmt->execute([$sectionId]);
        $section = $stmt->fetch();
        
        Response::success(['section' => $section], 'Section created', 201);
    }
    
    public function update($params) {
        $user = Auth::requireAuth();
        $sectionId = $params['id'];
        $data = Request::all();
        
        // Verify ownership via project
        $stmt = $this->db->prepare("
            SELECT s.id 
            FROM sections s
            INNER JOIN projects p ON p.id = s.project_id
            WHERE s.id = ? AND p.user_id = ?
        ");
        $stmt->execute([$sectionId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Section not found');
        }
        
        if (isset($data['name'])) {
            $stmt = $this->db->prepare("UPDATE sections SET name = ? WHERE id = ?");
            $stmt->execute([$data['name'], $sectionId]);
        }
        
        $stmt = $this->db->prepare("SELECT * FROM sections WHERE id = ?");
        $stmt->execute([$sectionId]);
        $section = $stmt->fetch();
        
        Response::success(['section' => $section], 'Section updated');
    }
    
    public function delete($params) {
        $user = Auth::requireAuth();
        $sectionId = $params['id'];
        
        $stmt = $this->db->prepare("
            SELECT s.id 
            FROM sections s
            INNER JOIN projects p ON p.id = s.project_id
            WHERE s.id = ? AND p.user_id = ?
        ");
        $stmt->execute([$sectionId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Section not found');
        }
        
        $stmt = $this->db->prepare("DELETE FROM sections WHERE id = ?");
        $stmt->execute([$sectionId]);
        
        Response::success(null, 'Section deleted');
    }
}

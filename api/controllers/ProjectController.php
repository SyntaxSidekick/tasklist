<?php

class ProjectController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function index() {
        $user = Auth::requireAuth();
        
        $stmt = $this->db->prepare("
            SELECT p.*, 
                   COUNT(DISTINCT t.id) as task_count,
                   COUNT(DISTINCT CASE WHEN t.completed = 0 THEN t.id END) as active_task_count
            FROM projects p
            LEFT JOIN tasks t ON t.project_id = p.id
            WHERE p.user_id = ?
            GROUP BY p.id
            ORDER BY p.order_index ASC, p.created_at ASC
        ");
        $stmt->execute([$user['id']]);
        
        $projects = $stmt->fetchAll();
        
        Response::success(['projects' => $projects]);
    }
    
    public function store() {
        $user = Auth::requireAuth();
        $data = Request::all();
        
        $validator = Validator::make($data, [
            'name' => 'required|min:1|max:255',
            'color' => 'max:7'
        ]);
        
        if (!$validator->validate()) {
            Response::error('Validation failed', 422, $validator->errors());
        }
        
        // Get max order_index
        $stmt = $this->db->prepare("SELECT MAX(order_index) as max_order FROM projects WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $result = $stmt->fetch();
        $orderIndex = ($result['max_order'] ?? 0) + 1;
        
        $stmt = $this->db->prepare("
            INSERT INTO projects (user_id, name, color, icon, view_style, order_index) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $user['id'],
            $data['name'],
            $data['color'] ?? '#A7D08C',
            $data['icon'] ?? null,
            $data['view_style'] ?? 'list',
            $orderIndex
        ]);
        
        $projectId = $this->db->lastInsertId();
        
        $stmt = $this->db->prepare("SELECT * FROM projects WHERE id = ?");
        $stmt->execute([$projectId]);
        $project = $stmt->fetch();
        
        Response::success(['project' => $project], 'Project created', 201);
    }
    
    public function show($params) {
        $user = Auth::requireAuth();
        $projectId = $params['id'];
        
        $stmt = $this->db->prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$projectId, $user['id']]);
        $project = $stmt->fetch();
        
        if (!$project) {
            Response::notFound('Project not found');
        }
        
        Response::success(['project' => $project]);
    }
    
    public function update($params) {
        $user = Auth::requireAuth();
        $projectId = $params['id'];
        $data = Request::all();
        
        // Verify ownership
        $stmt = $this->db->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$projectId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Project not found');
        }
        
        $updates = [];
        $updateParams = [];
        
        if (isset($data['name'])) {
            $updates[] = 'name = ?';
            $updateParams[] = $data['name'];
        }
        
        if (isset($data['color'])) {
            $updates[] = 'color = ?';
            $updateParams[] = $data['color'];
        }
        
        if (isset($data['icon'])) {
            $updates[] = 'icon = ?';
            $updateParams[] = $data['icon'];
        }
        
        if (isset($data['is_favorite'])) {
            $updates[] = 'is_favorite = ?';
            $updateParams[] = $data['is_favorite'] ? 1 : 0;
        }
        
        if (isset($data['view_style'])) {
            $updates[] = 'view_style = ?';
            $updateParams[] = $data['view_style'];
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }
        
        $updateParams[] = $projectId;
        
        $sql = "UPDATE projects SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($updateParams);
        
        $stmt = $this->db->prepare("SELECT * FROM projects WHERE id = ?");
        $stmt->execute([$projectId]);
        $project = $stmt->fetch();
        
        Response::success(['project' => $project], 'Project updated');
    }
    
    public function delete($params) {
        $user = Auth::requireAuth();
        $projectId = $params['id'];
        
        $stmt = $this->db->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$projectId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Project not found');
        }
        
        $stmt = $this->db->prepare("DELETE FROM projects WHERE id = ?");
        $stmt->execute([$projectId]);
        
        Response::success(null, 'Project deleted');
    }
    
    public function reorder($params) {
        $user = Auth::requireAuth();
        $projectId = $params['id'];
        $data = Request::all();
        
        if (!isset($data['order_index'])) {
            Response::error('order_index is required', 400);
        }
        
        $stmt = $this->db->prepare("UPDATE projects SET order_index = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$data['order_index'], $projectId, $user['id']]);
        
        Response::success(null, 'Project reordered');
    }
}

<?php

class LabelController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function index() {
        $user = Auth::requireAuth();
        
        $stmt = $this->db->prepare("
            SELECT l.*, COUNT(DISTINCT tl.task_id) as task_count
            FROM labels l
            LEFT JOIN task_labels tl ON tl.label_id = l.id
            WHERE l.user_id = ?
            GROUP BY l.id
            ORDER BY l.name ASC
        ");
        $stmt->execute([$user['id']]);
        $labels = $stmt->fetchAll();
        
        Response::success(['labels' => $labels]);
    }
    
    public function store() {
        $user = Auth::requireAuth();
        $data = Request::all();
        
        $validator = Validator::make($data, [
            'name' => 'required|min:1|max:100',
            'color' => 'max:7'
        ]);
        
        if (!$validator->validate()) {
            Response::error('Validation failed', 422, $validator->errors());
        }
        
        $stmt = $this->db->prepare("INSERT INTO labels (user_id, name, color) VALUES (?, ?, ?)");
        $stmt->execute([
            $user['id'],
            $data['name'],
            $data['color'] ?? '#A7D08C'
        ]);
        
        $labelId = $this->db->lastInsertId();
        
        $stmt = $this->db->prepare("SELECT * FROM labels WHERE id = ?");
        $stmt->execute([$labelId]);
        $label = $stmt->fetch();
        
        Response::success(['label' => $label], 'Label created', 201);
    }
    
    public function update($params) {
        $user = Auth::requireAuth();
        $labelId = $params['id'];
        $data = Request::all();
        
        $stmt = $this->db->prepare("SELECT id FROM labels WHERE id = ? AND user_id = ?");
        $stmt->execute([$labelId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Label not found');
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
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }
        
        $updateParams[] = $labelId;
        
        $sql = "UPDATE labels SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($updateParams);
        
        $stmt = $this->db->prepare("SELECT * FROM labels WHERE id = ?");
        $stmt->execute([$labelId]);
        $label = $stmt->fetch();
        
        Response::success(['label' => $label], 'Label updated');
    }
    
    public function delete($params) {
        $user = Auth::requireAuth();
        $labelId = $params['id'];
        
        $stmt = $this->db->prepare("SELECT id FROM labels WHERE id = ? AND user_id = ?");
        $stmt->execute([$labelId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Label not found');
        }
        
        $stmt = $this->db->prepare("DELETE FROM labels WHERE id = ?");
        $stmt->execute([$labelId]);
        
        Response::success(null, 'Label deleted');
    }
}

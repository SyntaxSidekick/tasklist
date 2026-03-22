<?php

class TaskController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    private function getTaskQuery() {
        return "
            SELECT t.*, 
                   p.name as project_name, 
                   p.color as project_color,
                   GROUP_CONCAT(DISTINCT l.id) as label_ids,
                   GROUP_CONCAT(DISTINCT l.name) as label_names,
                   COUNT(DISTINCT st.id) as subtask_count,
                   COUNT(DISTINCT CASE WHEN st.completed = 1 THEN st.id END) as completed_subtask_count
            FROM tasks t
            LEFT JOIN projects p ON p.id = t.project_id
            LEFT JOIN task_labels tl ON tl.task_id = t.id
            LEFT JOIN labels l ON l.id = tl.label_id
            LEFT JOIN tasks st ON st.parent_task_id = t.id
        ";
    }
    
    public function index() {
        $user = Auth::requireAuth();
        $projectId = Request::query('project_id');
        $sectionId = Request::query('section_id');
        $completed = Request::query('completed', 0);
        
        $sql = $this->getTaskQuery();
        $where = ["t.user_id = ?", "t.parent_task_id IS NULL"];
        $params = [$user['id']];
        
        if ($projectId) {
            $where[] = "t.project_id = ?";
            $params[] = $projectId;
        }
        
        if ($sectionId) {
            $where[] = "t.section_id = ?";
            $params[] = $sectionId;
        }
        
        $where[] = "t.completed = ?";
        $params[] = $completed;
        
        $sql .= " WHERE " . implode(' AND ', $where);
        $sql .= " GROUP BY t.id ORDER BY t.order_index ASC, t.created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $tasks = $stmt->fetchAll();
        
        // Process recurrence for incomplete tasks
        $tasks = $this->processRecurringTasks($tasks, $user['id']);
        
        Response::success(['tasks' => $tasks]);
    }
    
    public function today() {
        $user = Auth::requireAuth();
        $today = date('Y-m-d');
        
        $sql = $this->getTaskQuery();
        $sql .= " WHERE t.user_id = ? AND t.completed = 0 AND t.parent_task_id IS NULL 
                  AND t.due_date <= ?
                  GROUP BY t.id 
                  ORDER BY t.order_index ASC, t.priority ASC, t.due_date ASC, t.due_time ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$user['id'], $today]);
        $tasks = $stmt->fetchAll();
        
        $tasks = $this->processRecurringTasks($tasks, $user['id']);
        
        Response::success(['tasks' => $tasks]);
    }
    
    public function upcoming() {
        $user = Auth::requireAuth();
        $today = date('Y-m-d');
        $nextWeek = date('Y-m-d', strtotime('+7 days'));
        
        $sql = $this->getTaskQuery();
        $sql .= " WHERE t.user_id = ? AND t.completed = 0 AND t.parent_task_id IS NULL 
                  AND t.due_date BETWEEN ? AND ?
                  GROUP BY t.id 
                  ORDER BY t.order_index ASC, t.due_date ASC, t.priority ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$user['id'], $today, $nextWeek]);
        $tasks = $stmt->fetchAll();
        
        $tasks = $this->processRecurringTasks($tasks, $user['id']);
        
        Response::success(['tasks' => $tasks]);
    }
    
    public function store() {
        $user = Auth::requireAuth();
        $data = Request::all();
        
        $validator = Validator::make($data, [
            'title' => 'required|min:1|max:500',
            'priority' => 'in:1,2,3,4'
        ]);
        
        if (!$validator->validate()) {
            Response::error('Validation failed', 422, $validator->errors());
        }
        
        // Get order_index
        $orderIndex = 0;
        if (isset($data['project_id'])) {
            $stmt = $this->db->prepare("SELECT MAX(order_index) as max_order FROM tasks WHERE project_id = ?");
            $stmt->execute([$data['project_id']]);
            $result = $stmt->fetch();
            $orderIndex = ($result['max_order'] ?? 0) + 1;
        }
        
        $stmt = $this->db->prepare("
            INSERT INTO tasks (
                user_id, project_id, section_id, parent_task_id, title, description, 
                priority, due_date, due_time, order_index, recurrence_rule
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $user['id'],
            $data['project_id'] ?? null,
            $data['section_id'] ?? null,
            $data['parent_task_id'] ?? null,
            $data['title'],
            $data['description'] ?? null,
            $data['priority'] ?? 4,
            $data['due_date'] ?? null,
            $data['due_time'] ?? null,
            $orderIndex,
            isset($data['recurrence_rule']) ? json_encode($data['recurrence_rule']) : null
        ]);
        
        $taskId = $this->db->lastInsertId();
        
        // Handle labels
        if (isset($data['label_ids']) && is_array($data['label_ids'])) {
            foreach ($data['label_ids'] as $labelId) {
                $stmt = $this->db->prepare("INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)");
                $stmt->execute([$taskId, $labelId]);
            }
        }
        
        $stmt = $this->db->prepare($this->getTaskQuery() . " WHERE t.id = ? GROUP BY t.id");
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();
        
        Response::success(['task' => $task], 'Task created', 201);
    }
    
    public function show($params) {
        $user = Auth::requireAuth();
        $taskId = $params['id'];
        
        $sql = $this->getTaskQuery() . " WHERE t.id = ? AND t.user_id = ? GROUP BY t.id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$taskId, $user['id']]);
        $task = $stmt->fetch();
        
        if (!$task) {
            Response::notFound('Task not found');
        }
        
        // Get subtasks
        $stmt = $this->db->prepare("SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY order_index ASC");
        $stmt->execute([$taskId]);
        $task['subtasks'] = $stmt->fetchAll();
        
        Response::success(['task' => $task]);
    }
    
    public function update($params) {
        $user = Auth::requireAuth();
        $taskId = $params['id'];
        $data = Request::all();
        
        // Verify ownership
        $stmt = $this->db->prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?");
        $stmt->execute([$taskId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Task not found');
        }
        
        $updates = [];
        $updateParams = [];
        
        $allowedFields = ['title', 'description', 'priority', 'due_date', 'due_time', 'project_id', 'section_id'];
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updates[] = "$field = ?";
                $updateParams[] = $data[$field];
            }
        }
        
        if (isset($data['recurrence_rule'])) {
            $updates[] = 'recurrence_rule = ?';
            $updateParams[] = is_array($data['recurrence_rule']) ? json_encode($data['recurrence_rule']) : $data['recurrence_rule'];
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
        }
        
        $updateParams[] = $taskId;
        
        $sql = "UPDATE tasks SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($updateParams);
        
        // Handle labels
        if (isset($data['label_ids'])) {
            $stmt = $this->db->prepare("DELETE FROM task_labels WHERE task_id = ?");
            $stmt->execute([$taskId]);
            
            if (is_array($data['label_ids'])) {
                foreach ($data['label_ids'] as $labelId) {
                    $stmt = $this->db->prepare("INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)");
                    $stmt->execute([$taskId, $labelId]);
                }
            }
        }
        
        $stmt = $this->db->prepare($this->getTaskQuery() . " WHERE t.id = ? GROUP BY t.id");
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();
        
        Response::success(['task' => $task], 'Task updated');
    }
    
    public function complete($params) {
        $user = Auth::requireAuth();
        $taskId = $params['id'];
        
        $stmt = $this->db->prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?");
        $stmt->execute([$taskId, $user['id']]);
        $task = $stmt->fetch();
        
        if (!$task) {
            Response::notFound('Task not found');
        }
        
        // Mark as completed
        $stmt = $this->db->prepare("UPDATE tasks SET completed = 1, completed_at = NOW() WHERE id = ?");
        $stmt->execute([$taskId]);
        
        // Handle recurring tasks
        if ($task['recurrence_rule']) {
            $this->createNextRecurringTask($task);
        }
        
        $stmt = $this->db->prepare($this->getTaskQuery() . " WHERE t.id = ? GROUP BY t.id");
        $stmt->execute([$taskId]);
        $updatedTask = $stmt->fetch();
        
        Response::success(['task' => $updatedTask], 'Task completed');
    }
    
    public function uncomplete($params) {
        $user = Auth::requireAuth();
        $taskId = $params['id'];
        
        $stmt = $this->db->prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?");
        $stmt->execute([$taskId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Task not found');
        }
        
        $stmt = $this->db->prepare("UPDATE tasks SET completed = 0, completed_at = NULL WHERE id = ?");
        $stmt->execute([$taskId]);
        
        $stmt = $this->db->prepare($this->getTaskQuery() . " WHERE t.id = ? GROUP BY t.id");
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();
        
        Response::success(['task' => $task], 'Task reopened');
    }
    
    public function delete($params) {
        $user = Auth::requireAuth();
        $taskId = $params['id'];
        
        $stmt = $this->db->prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?");
        $stmt->execute([$taskId, $user['id']]);
        
        if (!$stmt->fetch()) {
            Response::notFound('Task not found');
        }
        
        $stmt = $this->db->prepare("DELETE FROM tasks WHERE id = ?");
        $stmt->execute([$taskId]);
        
        Response::success(null, 'Task deleted');
    }
    
    public function reorder() {
        $user = Auth::requireAuth();
        $data = Request::all();
        
        if (!isset($data['tasks']) || !is_array($data['tasks'])) {
            Response::error('tasks array is required', 400);
        }
        
        foreach ($data['tasks'] as $taskData) {
            if (isset($taskData['id']) && isset($taskData['order_index'])) {
                $stmt = $this->db->prepare("UPDATE tasks SET order_index = ? WHERE id = ? AND user_id = ?");
                $stmt->execute([$taskData['order_index'], $taskData['id'], $user['id']]);
            }
        }
        
        Response::success(null, 'Tasks reordered');
    }
    
    private function processRecurringTasks($tasks, $userId) {
        // This would generate future instances of recurring tasks
        // For now, return as-is
        return $tasks;
    }
    
    private function createNextRecurringTask($task) {
        $recurrenceRule = json_decode($task['recurrence_rule'], true);
        if (!$recurrenceRule || !isset($recurrenceRule['type'])) {
            return;
        }
        
        $nextDueDate = $this->calculateNextDueDate($task['due_date'], $recurrenceRule);
        
        if ($nextDueDate) {
            $stmt = $this->db->prepare("
                INSERT INTO tasks (
                    user_id, project_id, section_id, title, description, 
                    priority, due_date, due_time, recurrence_rule, recurrence_parent_id, order_index
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $task['user_id'],
                $task['project_id'],
                $task['section_id'],
                $task['title'],
                $task['description'],
                $task['priority'],
                $nextDueDate,
                $task['due_time'],
                $task['recurrence_rule'],
                $task['id'],
                $task['order_index']
            ]);
        }
    }
    
    private function calculateNextDueDate($currentDate, $recurrenceRule) {
        if (!$currentDate) {
            return null;
        }
        
        $date = new DateTime($currentDate);
        $interval = $recurrenceRule['interval'] ?? 1;
        
        switch ($recurrenceRule['type']) {
            case 'daily':
                $date->modify("+{$interval} days");
                break;
            case 'weekly':
                $date->modify("+{$interval} weeks");
                break;
            case 'monthly':
                $date->modify("+{$interval} months");
                break;
            case 'yearly':
                $date->modify("+{$interval} years");
                break;
            default:
                return null;
        }
        
        return $date->format('Y-m-d');
    }
}

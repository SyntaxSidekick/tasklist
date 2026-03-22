-- Create test user and default Inbox project
-- Test user credentials: test@example.com / password123

-- Insert test user (password: password123)
INSERT INTO `users` (`email`, `password_hash`, `name`, `timezone`, `theme`, `email_verified`) 
VALUES (
    'test@example.com',
    '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIq.Km8pTG', -- password123
    'Test User',
    'UTC',
    'dark',
    1
);

-- Get the user ID
SET @user_id = LAST_INSERT_ID();

-- Create default Inbox project for the test user
INSERT INTO `projects` (`user_id`, `name`, `color`, `icon`, `is_favorite`, `order_index`) 
VALUES (
    @user_id,
    'Inbox',
    '#A7D08C',
    'inbox',
    1,
    0
);

-- Create a sample project
INSERT INTO `projects` (`user_id`, `name`, `color`, `icon`, `order_index`) 
VALUES (
    @user_id,
    'Work',
    '#3B82F6',
    'briefcase',
    1
);

-- Get project IDs
SET @inbox_id = (SELECT id FROM projects WHERE user_id = @user_id AND name = 'Inbox' LIMIT 1);
SET @work_id = (SELECT id FROM projects WHERE user_id = @user_id AND name = 'Work' LIMIT 1);

-- Add sample tasks
INSERT INTO `tasks` (`user_id`, `project_id`, `title`, `description`, `priority`, `due_date`, `completed`, `order_index`) 
VALUES 
    (@user_id, @inbox_id, 'Welcome to Sintacks!', 'This is your first task. Try completing it by clicking the checkbox.', 1, CURDATE(), 0, 0),
    (@user_id, @inbox_id, 'Create a new project', 'Click the + button in the Projects page to create your own project.', 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 0, 1),
    (@user_id, @work_id, 'Review quarterly goals', 'Prepare for next team meeting', 3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 0, 0);

-- Add a sample label
INSERT INTO `labels` (`user_id`, `name`, `color`) 
VALUES (@user_id, 'Important', '#EF4444');

SELECT CONCAT('✅ Test user created successfully!') AS status;
SELECT CONCAT('📧 Email: test@example.com') AS credentials;
SELECT CONCAT('🔑 Password: password123') AS password;

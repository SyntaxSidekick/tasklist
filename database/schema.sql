-- Sintacks Task Manager Database Schema
-- For MySQL 5.7+

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `timezone` VARCHAR(50) DEFAULT 'UTC',
  `theme` ENUM('light', 'dark', 'system') DEFAULT 'system',
  `email_verified` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- PROJECTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `color` VARCHAR(7) DEFAULT '#A7D08C',
  `icon` VARCHAR(50) DEFAULT NULL,
  `is_favorite` TINYINT(1) DEFAULT 0,
  `view_style` ENUM('list', 'board') DEFAULT 'list',
  `order_index` INT(11) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_user_order` (`user_id`, `order_index`),
  CONSTRAINT `fk_projects_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- SECTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS `sections` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` INT(11) UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `order_index` INT(11) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `idx_project_order` (`project_id`, `order_index`),
  CONSTRAINT `fk_sections_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- LABELS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS `labels` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `color` VARCHAR(7) DEFAULT '#A7D08C',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_labels_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TASKS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) UNSIGNED NOT NULL,
  `project_id` INT(11) UNSIGNED DEFAULT NULL,
  `section_id` INT(11) UNSIGNED DEFAULT NULL,
  `parent_task_id` INT(11) UNSIGNED DEFAULT NULL,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `priority` TINYINT(1) DEFAULT 4 COMMENT '1=P1 (highest), 4=P4 (lowest)',
  `due_date` DATE DEFAULT NULL,
  `due_time` TIME DEFAULT NULL,
  `completed` TINYINT(1) DEFAULT 0,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `order_index` INT(11) DEFAULT 0,
  `recurrence_rule` VARCHAR(255) DEFAULT NULL COMMENT 'JSON: {type: daily|weekly|monthly, interval: 1, days: []}',
  `recurrence_parent_id` INT(11) UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `project_id` (`project_id`),
  KEY `section_id` (`section_id`),
  KEY `parent_task_id` (`parent_task_id`),
  KEY `idx_user_completed` (`user_id`, `completed`),
  KEY `idx_user_due` (`user_id`, `due_date`),
  KEY `idx_project_order` (`project_id`, `order_index`),
  CONSTRAINT `fk_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_parent` FOREIGN KEY (`parent_task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TASK_LABELS TABLE (Many-to-Many)
-- ==========================================
CREATE TABLE IF NOT EXISTS `task_labels` (
  `task_id` INT(11) UNSIGNED NOT NULL,
  `label_id` INT(11) UNSIGNED NOT NULL,
  PRIMARY KEY (`task_id`, `label_id`),
  KEY `label_id` (`label_id`),
  CONSTRAINT `fk_task_labels_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_task_labels_label` FOREIGN KEY (`label_id`) REFERENCES `labels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- REMINDERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS `reminders` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` INT(11) UNSIGNED NOT NULL,
  `remind_at` DATETIME NOT NULL,
  `is_sent` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `idx_remind_at` (`remind_at`, `is_sent`),
  CONSTRAINT `fk_reminders_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- POMODORO_SESSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS `pomodoro_sessions` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) UNSIGNED NOT NULL,
  `task_id` INT(11) UNSIGNED DEFAULT NULL,
  `duration_minutes` INT(11) DEFAULT 25,
  `completed` TINYINT(1) DEFAULT 0,
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `task_id` (`task_id`),
  KEY `idx_user_date` (`user_id`, `started_at`),
  CONSTRAINT `fk_pomodoro_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pomodoro_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) UNSIGNED NOT NULL,
  `type` VARCHAR(50) NOT NULL COMMENT 'task_due, task_completed, reminder, etc.',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT DEFAULT NULL,
  `task_id` INT(11) UNSIGNED DEFAULT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `task_id` (`task_id`),
  KEY `idx_user_unread` (`user_id`, `is_read`, `created_at`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- INSERT DEFAULT DATA
-- ==========================================

-- Insert default project for new users (handled in application layer)

COMMIT;

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ami_super_app;
USE ami_super_app;

-- Health entries table
CREATE TABLE IF NOT EXISTS health_entries (
    id VARCHAR(255) PRIMARY KEY,
    type ENUM('weight', 'morning_bp', 'evening_bp', 'workout') NOT NULL,
    value DECIMAL(10,2),
    systolic INT,
    diastolic INT,
    arm ENUM('right', 'left'),
    timestamp DATETIME NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Work domains table
CREATE TABLE IF NOT EXISTS work_domains (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    bg_color VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    domain_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES work_domains(id) ON DELETE CASCADE
);

-- Weekly status table
CREATE TABLE IF NOT EXISTS weekly_statuses (
    id VARCHAR(255) PRIMARY KEY,
    member_id VARCHAR(255) NOT NULL,
    week_start DATE NOT NULL,
    current_week TEXT,
    next_week TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member_week (member_id, week_start)
);

-- Insert default work domains
INSERT IGNORE INTO work_domains (id, name, icon_name, color, bg_color) VALUES
('platform-security', 'Platform Security', 'shield', 'text-blue-600', 'bg-blue-100'),
('threat-protection', 'Threat Protection', 'alert-triangle', 'text-red-600', 'bg-red-100'),
('compliance', 'Compliance', 'file-check', 'text-green-600', 'bg-green-100'),
('advanced-protection', 'Advanced Protection', 'zap', 'text-purple-600', 'bg-purple-100');

-- Create indexes for better performance
CREATE INDEX idx_health_entries_type ON health_entries(type);
CREATE INDEX idx_health_entries_timestamp ON health_entries(timestamp);
CREATE INDEX idx_health_entries_type_timestamp ON health_entries(type, timestamp);
CREATE INDEX idx_team_members_domain ON team_members(domain_id);
CREATE INDEX idx_weekly_statuses_member_week ON weekly_statuses(member_id, week_start); 
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ami_super_app;
USE ami_super_app;

-- Health entries table
CREATE TABLE IF NOT EXISTS health_entries (
    id VARCHAR(255) PRIMARY KEY,
    date DATE NOT NULL,
    weight DECIMAL(5,2),
    bpAMRight VARCHAR(255),
    bpAMLeft VARCHAR(255),
    bpAMTime TIME,
    bpAMNotes TEXT,
    bpPMRight VARCHAR(255),
    bpPMLeft VARCHAR(255),
    bpPMTime TIME,
    bpPMNotes TEXT,
    workout VARCHAR(255),
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
    planned TEXT,
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
('advanced-protection', 'Advanced Protection', 'zap', 'text-purple-600', 'bg-purple-100'),

('rnd', 'R&D', 'flask-conical', 'text-orange-600', 'bg-orange-100');

-- Insert default team members
INSERT IGNORE INTO team_members (id, name, email, domain_id) VALUES
-- Advanced Protection
('asaf-adv', 'Asaf', 'asaf@company.com', 'advanced-protection'),
('nirgi-adv', 'Nirgi', 'nirgi@company.com', 'advanced-protection'),
('yogev-adv', 'Yogev', 'yogev@company.com', 'advanced-protection'),

-- Platform Security
('guy-k-platform', 'Guy K', 'guy.k@company.com', 'platform-security'),
('guy-h-platform', 'Guy H', 'guy.h@company.com', 'platform-security'),
('michael-platform', 'Michael', 'michael@company.com', 'platform-security'),
('ben-l-platform', 'Ben L', 'ben.l@company.com', 'platform-security'),
('aharon-platform', 'Aharon', 'aharon@company.com', 'platform-security'),

-- Compliance
('vlad-compliance', 'Vlad', 'vlad@company.com', 'compliance'),
('stevan-compliance', 'Stevan', 'stevan@company.com', 'compliance'),
('vlada-compliance', 'Vlada', 'vlada@company.com', 'compliance'),
('milos-compliance', 'Milos', 'milos@company.com', 'compliance'),
('rade-compliance', 'Rade', 'rade@company.com', 'compliance'),

-- Threat Protection
('muhammad-threat', 'Muhammad', 'muhammad@company.com', 'threat-protection'),
('or-threat', 'Or', 'or@company.com', 'threat-protection'),

-- R&D
('shani-qa', 'Shani', 'shani@company.com', 'rnd'),

-- R&D
('dudi-rnd', 'Dudi', 'dudi@company.com', 'rnd'),
('ben-l-rnd', 'Ben L', 'ben.l@company.com', 'rnd');

-- Create indexes for better performance
CREATE INDEX idx_health_entries_date ON health_entries(date);
CREATE INDEX idx_team_members_domain ON team_members(domain_id);
CREATE INDEX idx_weekly_statuses_member_week ON weekly_statuses(member_id, week_start); 
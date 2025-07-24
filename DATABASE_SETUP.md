# Database Setup Guide

This guide will help you set up the MySQL database for the Ami Super App.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed

## Quick Setup

1. **Start the database**
   ```bash
   npm run db:start
   ```

2. **Wait for database to be ready** (about 30 seconds)

3. **Set up environment variables**
   ```bash
   # Create .env.local file with these values:
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=superapp_user
   DB_PASSWORD=superapp_pass
   DB_NAME=ami_super_app
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Initialize database tables**
   ```bash
   npm run setup-db
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

## Database Configuration

### Docker Compose
The `docker-compose.yml` file sets up:
- MySQL 8.0 container
- Database: `ami_super_app`
- User: `superapp_user`
- Password: `superapp_pass`
- Port: `3306`

### Database Schema

#### Health Entries Table
```sql
CREATE TABLE health_entries (
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
```

#### Work Domains Table
```sql
CREATE TABLE work_domains (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    bg_color VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Team Members Table
```sql
CREATE TABLE team_members (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    domain_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES work_domains(id) ON DELETE CASCADE
);
```

#### Weekly Status Table
```sql
CREATE TABLE weekly_statuses (
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
```

## Useful Commands

### Database Management
```bash
# Start database
npm run db:start

# Stop database
npm run db:stop

# Reset database (delete all data)
npm run db:reset

# Setup database tables
npm run setup-db
```

### Docker Commands
```bash
# View database logs
docker-compose logs mysql

# Access MySQL shell
docker-compose exec mysql mysql -u superapp_user -p ami_super_app

# Backup database
docker-compose exec mysql mysqldump -u superapp_user -p ami_super_app > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u superapp_user -p ami_super_app < backup.sql
```

## Troubleshooting

### Database Connection Issues
1. **Check if Docker is running**
   ```bash
   docker ps
   ```

2. **Check database logs**
   ```bash
   docker-compose logs mysql
   ```

3. **Verify environment variables**
   - Ensure `.env.local` exists with correct database credentials
   - Check that `DB_HOST=localhost` and `DB_PORT=3306`

### Port Conflicts
If port 3306 is already in use:
1. Stop other MySQL instances
2. Or change the port in `docker-compose.yml`:
   ```yaml
   ports:
     - "3307:3306"  # Use port 3307 instead
   ```

### Permission Issues
If you get permission errors:
```bash
# On Linux/Mac, you might need to run with sudo
sudo docker-compose up -d
```

## Data Migration

### From localStorage to Database
If you have existing data in localStorage:

1. **Export localStorage data**
   ```javascript
   // In browser console
   console.log(JSON.stringify(localStorage.getItem('healthEntries')));
   console.log(JSON.stringify(localStorage.getItem('workStatusDomains')));
   ```

2. **Import via API**
   - Use the CSV import feature for health data
   - Manually recreate work status data

## Production Deployment

For production deployment:

1. **Use a managed MySQL service** (AWS RDS, Google Cloud SQL, etc.)
2. **Update environment variables** with production database credentials
3. **Set up proper backups**
4. **Configure connection pooling** for better performance
5. **Use SSL connections** for security

## Security Considerations

- Change default passwords in production
- Use environment variables for sensitive data
- Enable SSL/TLS for database connections
- Regular database backups
- Monitor database access logs 
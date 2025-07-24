# 🚀 AWS Lightsail Deployment Guide

This guide will help you deploy your AMI Super App to AWS Lightsail.

## Prerequisites

1. **AWS Account**: You need an active AWS account
2. **AWS CLI**: Install and configure AWS CLI on your local machine
3. **Docker**: Ensure Docker is installed on your Lightsail instance
4. **Domain (Optional)**: A domain name for your application

## Step 1: Create a Lightsail Instance

### 1.1 Launch a Container Instance
1. Go to AWS Lightsail Console
2. Click "Create instance"
3. Choose "Container" as the platform
4. Select a region close to your users
5. Choose "Linux/Unix" platform
6. Select "Container" blueprint
7. Choose your instance plan (recommended: 2GB RAM, 1 vCPU minimum)
8. Name your instance (e.g., "ami-super-app")
9. Click "Create instance"

### 1.2 Connect to Your Instance
```bash
# Download the SSH key from Lightsail console
# Then connect via SSH
ssh -i ~/.ssh/your-key.pem ubuntu@your-instance-ip
```

## Step 2: Prepare Your Instance

### 2.1 Install Docker and Docker Compose
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes to take effect
exit
# SSH back in
```

### 2.2 Install Git
```bash
sudo apt install git -y
```

## Step 3: Deploy Your Application

### 3.1 Clone Your Repository
```bash
git clone https://github.com/yourusername/ami-super-app.git
cd ami-super-app
```

### 3.2 Create Production Environment File
```bash
cp env.production.example .env.production
nano .env.production
```

**Fill in your production values:**
```bash
# Database Configuration
DB_ROOT_PASSWORD=your_very_secure_root_password
DB_USER=superapp_user
DB_PASSWORD=your_very_secure_db_password
DB_NAME=ami_super_app

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### 3.3 Deploy the Application
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

## Step 4: Configure Firewall and Networking

### 4.1 Configure Lightsail Firewall
1. Go to your Lightsail instance
2. Click on "Networking" tab
3. Add these firewall rules:
   - **HTTP (80)**: Allow from anywhere
   - **HTTPS (443)**: Allow from anywhere (if using SSL)
   - **Custom (3000)**: Allow from anywhere (for direct app access)

### 4.2 Access Your Application
Your app will be available at:
- `http://your-lightsail-ip:3000`

## Step 5: Set Up Domain and SSL (Optional)

### 5.1 Configure Domain
1. Point your domain to your Lightsail instance IP
2. Add a DNS A record: `yourdomain.com` → `your-lightsail-ip`

### 5.2 Set Up SSL with Nginx
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ami-super-app
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/ami-super-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 6: Monitoring and Maintenance

### 6.1 Check Application Status
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f mysql
```

### 6.2 Backup Database
```bash
# Create backup script
nano backup-db.sh
```

**Add this content:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec ami-super-app-mysql mysqldump -u root -p$DB_ROOT_PASSWORD ami_super_app > backup_$DATE.sql
```

### 6.3 Update Application
```bash
# Pull latest changes
git pull origin main

# Redeploy
./scripts/deploy.sh
```

## Troubleshooting

### Common Issues

1. **Port 3000 not accessible**
   - Check Lightsail firewall rules
   - Verify container is running: `docker ps`

2. **Database connection issues**
   - Check environment variables in `.env.production`
   - Verify MySQL container is healthy: `docker logs ami-super-app-mysql`

3. **Email not working**
   - Verify Gmail app password is correct
   - Check email environment variables

### Useful Commands
```bash
# Restart services
docker-compose -f docker-compose.prod.yml restart

# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Access MySQL directly
docker exec -it ami-super-app-mysql mysql -u root -p

# Check disk space
df -h

# Monitor system resources
htop
```

## Security Considerations

1. **Strong Passwords**: Use strong, unique passwords for database
2. **Firewall**: Only open necessary ports
3. **SSL**: Always use HTTPS in production
4. **Updates**: Keep your instance and Docker images updated
5. **Backups**: Regular database backups
6. **Monitoring**: Set up basic monitoring and alerts

## Cost Optimization

- **Instance Size**: Start with 2GB RAM, scale up if needed
- **Storage**: Monitor usage, delete old backups
- **Bandwidth**: Monitor data transfer costs
- **Snapshots**: Use snapshots for backups instead of running additional storage

## Support

If you encounter issues:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify all environment variables are set correctly
3. Ensure all ports are open in Lightsail firewall
4. Check that your domain DNS is pointing to the correct IP

Your AMI Super App should now be running in the cloud! 🎉 
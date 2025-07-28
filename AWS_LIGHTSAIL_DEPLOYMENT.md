# AWS Lightsail Container Service Deployment Guide

This guide will help you deploy your Super App to AWS Lightsail Container Service using Docker.

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   # Install AWS CLI (if not already installed)
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Configure AWS CLI
   aws configure
   ```

2. **Docker installed**
   ```bash
   # Install Docker (if not already installed)
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

3. **Environment variables configured**
   - Copy `env.production.example` to `.env.production`
   - Fill in your production values

## Quick Deployment

### 1. Build the Docker Image

```bash
# Build locally first to test
./scripts/build-docker.sh

# Or build manually
docker build -t ami-super-app .
```

### 2. Deploy to Lightsail

```bash
# Deploy using the automated script
./scripts/deploy-lightsail.sh
```

## Manual Deployment Steps

### 1. Create Lightsail Container Service

```bash
aws lightsail create-container-service \
    --service-name ami-super-app-service \
    --power small \
    --scale 1
```

### 2. Build and Push Image

```bash
# Build the image
docker build -t ami-super-app .

# Push to Lightsail
aws lightsail push-container-image \
    --service-name ami-super-app-service \
    --label ami-super-app \
    --image ami-super-app:latest
```

### 3. Deploy the Container

```bash
aws lightsail create-container-service-deployment \
    --service-name ami-super-app-service \
    --containers '{
        "ami-super-app-container": {
            "image": ":ami-super-app.ami-super-app-service.1",
            "ports": {
                "3000": "HTTP"
            },
            "environment": {
                "NODE_ENV": "production",
                "DB_HOST": "your-db-host",
                "DB_PORT": "3306",
                "DB_USER": "your-db-user",
                "DB_PASSWORD": "your-db-password",
                "DB_NAME": "your-db-name"
            }
        }
    }' \
    --public-endpoint '{
        "containerName": "ami-super-app-container",
        "containerPort": 3000,
        "healthCheck": {
            "healthyThreshold": 2,
            "unhealthyThreshold": 2,
            "timeoutSeconds": 2,
            "intervalSeconds": 5,
            "path": "/",
            "successCodes": "200-499"
        }
    }'
```

## Environment Variables

Create a `.env.production` file with the following variables:

```env
# Database Configuration
DB_ROOT_PASSWORD=your_secure_root_password_here
DB_USER=superapp_user
DB_PASSWORD=your_secure_db_password_here
DB_NAME=ami_super_app

# Email Configuration (for health log export feature)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password

# Optional: Custom domain (if you have one)
# DOMAIN=yourdomain.com
```

## Database Setup

### Option 1: Use Lightsail Database (Recommended)

1. Create a Lightsail database instance
2. Use the provided endpoint and credentials
3. Update your environment variables

### Option 2: Use External Database

- AWS RDS
- External MySQL server
- Any MySQL-compatible database

## Monitoring and Logs

### Check Service Status

```bash
aws lightsail get-container-services --service-name ami-super-app-service
```

### View Logs

```bash
aws lightsail get-container-log --service-name ami-super-app-service --container-name ami-super-app-container
```

### Scale the Service

```bash
aws lightsail create-container-service-deployment \
    --service-name ami-super-app-service \
    --scale 2
```

## Troubleshooting

### Common Issues

1. **Build fails**: Check Dockerfile and .dockerignore
2. **Container won't start**: Check environment variables and database connectivity
3. **Health check fails**: Verify the application is listening on port 3000

### Debug Commands

```bash
# Check container status
aws lightsail get-container-services --service-name ami-super-app-service

# View recent deployments
aws lightsail get-container-services --service-name ami-super-app-service --query 'containerServices[0].currentDeployment'

# Check logs
aws lightsail get-container-log --service-name ami-super-app-service --container-name ami-super-app-container
```

## Cost Optimization

- Use `small` power for development/testing
- Use `medium` or `large` for production
- Consider auto-scaling based on traffic
- Monitor usage in AWS Console

## Security Considerations

1. Use strong passwords for database
2. Enable HTTPS (Lightsail provides this automatically)
3. Keep environment variables secure
4. Regularly update dependencies
5. Monitor access logs

## Backup and Recovery

1. **Database**: Set up automated backups
2. **Application**: Use version control (Git)
3. **Configuration**: Store environment variables securely
4. **Data**: Export health data regularly

## Support

For issues with:
- **AWS Lightsail**: Check AWS documentation
- **Application**: Check logs and error messages
- **Database**: Verify connectivity and credentials 
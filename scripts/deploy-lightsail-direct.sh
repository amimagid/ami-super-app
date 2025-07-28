#!/bin/bash

echo "🚀 Deploying AMI Super App to AWS Lightsail Container Service (Direct Method)..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found. Please create it with your production environment variables."
    exit 1
fi

# Load environment variables
source .env.production

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Set variables
REGION="eu-central-1"
SERVICE_NAME="ami-super-app"
CONTAINER_NAME="ami-super-app"

echo "📦 Building Docker image..."
docker build -t $CONTAINER_NAME .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

# Create container service if it doesn't exist
echo "🔍 Checking if container service exists..."
if ! aws lightsail get-container-services --region $REGION --service-name $SERVICE_NAME &> /dev/null; then
    echo "📋 Creating Lightsail Container Service..."
    aws lightsail create-container-service \
        --region $REGION \
        --service-name $SERVICE_NAME \
        --power "small" \
        --scale 1
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create container service"
        exit 1
    fi
    
    echo "⏳ Waiting for service to be ready..."
    sleep 30
else
    echo "✅ Container service already exists"
fi

echo "📤 Deploying directly to Lightsail Container Service..."
aws lightsail create-container-service-deployment \
    --region $REGION \
    --service-name $SERVICE_NAME \
    --containers '{
        "ami-super-app": {
            "image": "'$CONTAINER_NAME'",
            "ports": {
                "3000": "HTTP"
            },
            "environment": {
                "NODE_ENV": "production",
                "DB_HOST": "'$DB_HOST'",
                "DB_PORT": "3306",
                "DB_USER": "'$DB_USER'",
                "DB_PASSWORD": "'$DB_PASSWORD'",
                "DB_NAME": "'$DB_NAME'",
                "EMAIL_USER": "'$EMAIL_USER'",
                "EMAIL_PASS": "'$EMAIL_PASS'"
            }
        }
    }' \
    --public-endpoint '{
        "containerName": "ami-super-app",
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

if [ $? -eq 0 ]; then
    echo "✅ Deployment initiated successfully!"
    echo "🌐 Your app will be available at: https://$SERVICE_NAME.$REGION.cs.amazonlightsail.com"
    echo "⏳ Check deployment status with: aws lightsail get-container-services --region $REGION"
else
    echo "❌ Deployment failed"
    exit 1
fi 
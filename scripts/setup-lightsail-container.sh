#!/bin/bash

echo "🔧 Setting up AWS Lightsail Container Service..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    echo "💡 Run: aws configure"
    exit 1
fi

REGION="eu-central-1"
SERVICE_NAME="ami-super-app"

echo "📋 Creating Lightsail Container Service..."
aws lightsail create-container-service \
    --region $REGION \
    --service-name $SERVICE_NAME \
    --power small \
    --scale 1

if [ $? -eq 0 ]; then
    echo "✅ Container service created successfully!"
    echo "⏳ Service is being created. This may take a few minutes."
    echo "🔍 Check status with: aws lightsail get-container-services --region $REGION"
    echo "🚀 Once ready, deploy with: ./scripts/deploy-lightsail-container.sh"
else
    echo "❌ Failed to create container service"
    echo "💡 The service might already exist. Check with: aws lightsail get-container-services --region $REGION"
fi 
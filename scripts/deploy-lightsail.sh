#!/bin/bash

# Deploy to AWS Lightsail Container Service
# This script builds the Docker image and pushes it to Lightsail

set -e

# Configuration
PROJECT_NAME="ami-super-app"
REGION="us-east-1"  # Change this to your preferred region
SERVICE_NAME="ami-super-app-service"
CONTAINER_NAME="ami-super-app-container"

echo "🚀 Starting deployment to AWS Lightsail Container Service..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not authenticated. Please run 'aws configure' first."
    exit 1
fi

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t $PROJECT_NAME .

# Tag the image for Lightsail
echo "🏷️  Tagging image for Lightsail..."
aws lightsail create-container-service-deployment \
    --service-name $SERVICE_NAME \
    --containers "{
        \"$CONTAINER_NAME\": {
            \"image\": \"$PROJECT_NAME:latest\",
            \"ports\": {
                \"3000\": \"HTTP\"
            },
            \"environment\": {
                \"NODE_ENV\": \"production\"
            }
        }
    }" \
    --public-endpoint "{
        \"containerName\": \"$CONTAINER_NAME\",
        \"containerPort\": 3000,
        \"healthCheck\": {
            \"healthyThreshold\": 2,
            \"unhealthyThreshold\": 2,
            \"timeoutSeconds\": 2,
            \"intervalSeconds\": 5,
            \"path\": \"/\",
            \"successCodes\": \"200-499\"
        }
    }"

echo "✅ Deployment initiated successfully!"
echo "🌐 Your application will be available at: https://$SERVICE_NAME.$REGION.cs.amazonlightsail.com"
echo "📊 Monitor deployment status with: aws lightsail get-container-services --service-name $SERVICE_NAME" 
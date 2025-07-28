#!/bin/bash

# Build Docker image for local testing
# This script builds the Docker image locally

set -e

PROJECT_NAME="ami-super-app"

echo "🔨 Building Docker image for $PROJECT_NAME..."

# Build the image
docker build -t $PROJECT_NAME .

echo "✅ Docker image built successfully!"
echo "🐳 Image name: $PROJECT_NAME"
echo ""
echo "To run the container locally:"
echo "docker run -p 3000:3000 --env-file .env.production $PROJECT_NAME"
echo ""
echo "To push to AWS Lightsail:"
echo "./scripts/deploy-lightsail.sh" 
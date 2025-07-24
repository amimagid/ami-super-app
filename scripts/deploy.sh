#!/bin/bash

echo "🚀 Deploying AMI Super App to AWS Lightsail..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found. Please create it with your production environment variables."
    exit 1
fi

# Load environment variables
source .env.production

# Build and start the production containers
echo "📦 Building and starting production containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if containers are running
echo "🔍 Checking container status..."
docker-compose -f docker-compose.prod.yml ps

# Setup database schema
echo "🗄️ Setting up database schema..."
docker exec ami-super-app npm run setup-db

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be available at: http://your-lightsail-ip:3000" 
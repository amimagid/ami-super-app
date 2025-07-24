#!/bin/bash

echo "🚀 Starting AMI Super App..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start the database
echo "📦 Starting MySQL database..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 15

# Check if database is accessible
echo "🔍 Checking database connection..."
if docker exec ami-super-app-mysql mysql -u root -psuperapp123 -e "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database is ready!"
else
    echo "❌ Database is not ready yet. Waiting a bit more..."
    sleep 10
fi

# Setup database schema (if needed)
echo "🗄️  Setting up database schema..."
npm run setup-db

# Start the Next.js development server
echo "🌐 Starting Next.js development server..."
npm run dev 
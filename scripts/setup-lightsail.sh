#!/bin/bash

echo "🔧 Setting up AWS Lightsail instance for AMI Super App..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
echo "👤 Adding user to docker group..."
sudo usermod -aG docker ubuntu

# Install Docker Compose
echo "📋 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "📚 Installing Git..."
sudo apt install git -y

# Install htop for monitoring
echo "📊 Installing monitoring tools..."
sudo apt install htop -y

# Create app directory
echo "📁 Creating application directory..."
mkdir -p /home/ubuntu/apps
cd /home/ubuntu/apps

echo "✅ Lightsail instance setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Logout and SSH back in for docker group changes to take effect"
echo "2. Clone your repository: git clone https://github.com/yourusername/ami-super-app.git"
echo "3. Follow the deployment guide in AWS_LIGHTSAIL_DEPLOYMENT.md"
echo ""
echo "🔑 Don't forget to:"
echo "- Configure your .env.production file"
echo "- Set up firewall rules in Lightsail console"
echo "- Configure your domain (optional)" 
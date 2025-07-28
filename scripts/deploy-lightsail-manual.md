# Manual Deployment to AWS Lightsail Container Service

Since the automated deployment scripts are having issues with the image push, here's a manual step-by-step guide:

## Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Lightsail CLI plugin** installed
3. **Docker image built** locally
4. **Environment variables** set up in `.env.production`

## Step 1: Install Lightsail CLI Plugin

```bash
# Install the Lightsail CLI plugin
curl "https://s3.us-west-2.amazonaws.com/lightsailctl/latest/linux-amd64/lightsailctl" -o "lightsailctl"
sudo mv "lightsailctl" "/usr/local/bin/lightsailctl"
sudo chmod +x /usr/local/bin/lightsailctl
```

## Step 2: Build Docker Image

```bash
docker build -t ami-super-app .
```

## Step 3: Create Container Service (if not exists)

```bash
aws lightsail create-container-service \
    --region eu-central-1 \
    --service-name ami-super-app \
    --power "small" \
    --scale 1
```

## Step 4: Deploy Using Lightsail CLI Plugin

```bash
# Create deployment configuration
cat > containers.json << EOF
{
  "ami-super-app": {
    "image": "ami-super-app",
    "ports": {
      "3000": "HTTP"
    },
    "environment": {
      "NODE_ENV": "production",
      "DB_HOST": "your-db-host",
      "DB_PORT": "3306",
      "DB_USER": "your-db-user",
      "DB_PASSWORD": "your-db-password",
      "DB_NAME": "your-db-name",
      "EMAIL_USER": "your-email-user",
      "EMAIL_PASS": "your-email-pass"
    }
  }
}
EOF

# Create public endpoint configuration
cat > public-endpoint.json << EOF
{
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
}
EOF

# Deploy using the plugin
lightsailctl deploy \
    --region eu-central-1 \
    --service-name ami-super-app \
    --containers containers.json \
    --public-endpoint public-endpoint.json
```

## Step 5: Check Deployment Status

```bash
aws lightsail get-container-services --region eu-central-1
```

## Alternative: Use AWS Console

1. Go to AWS Lightsail Console
2. Navigate to Container Services
3. Create a new container service
4. Upload your Docker image
5. Configure environment variables
6. Deploy

## Troubleshooting

- **Image push issues**: Use the AWS Console method instead
- **Permission errors**: Ensure your AWS credentials have Lightsail permissions
- **Service not found**: Create the container service first
- **Environment variables**: Make sure `.env.production` is properly configured

## Access Your App

Once deployed, your app will be available at:
`https://ami-super-app.eu-central-1.cs.amazonlightsail.com` 
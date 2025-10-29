#!/bin/bash

echo "🚀 Community Centers Platform AWS Deployment - Simple Version"
echo "============================================="
echo ""
echo "This script will guide you through manual AWS setup steps"
echo "and then deploy your application automatically."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
read -p "Enter your deployment name [community-centers]: " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-community-centers}

read -p "Enter AWS region [us-east-1]: " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -sp "Enter a secure database password: " DB_PASSWORD
echo ""

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

echo ""
echo -e "${GREEN}✓ Configuration ready${NC}"
echo ""

# Manual AWS Console Steps
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}STEP 1: Create RDS Database (AWS Console)${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "1. Open: https://console.aws.amazon.com/rds/"
echo "2. Click 'Create database'"
echo "3. Configuration:"
echo "   - Engine: PostgreSQL"
echo "   - Templates: Free tier"
echo "   - DB instance identifier: ${PROJECT_NAME}-db"
echo "   - Master username: dbadmin"
echo "   - Master password: [use your password]"
echo "   - DB instance class: db.t3.micro"
echo "   - Storage: 20 GB (free tier eligible)"
echo "   - Public access: Yes (we'll restrict later)"
echo "   - Initial database name: ${PROJECT_NAME//-/}"
echo "4. Click 'Create database'"
echo "5. Wait 5-10 minutes for it to be available"
echo ""
read -p "Press Enter when database is created and available..."

echo ""
read -p "Enter the RDS endpoint (from RDS console): " RDS_ENDPOINT
echo ""

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}STEP 2: Create EC2 Instance (AWS Console)${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "1. Open: https://console.aws.amazon.com/ec2/"
echo "2. Click 'Launch Instance'"
echo "3. Configuration:"
echo "   - Name: ${PROJECT_NAME}-server"
echo "   - AMI: Ubuntu Server 22.04 LTS"
echo "   - Instance type: t2.micro (free tier)"
echo "   - Key pair: Create new '${PROJECT_NAME}-key' (download .pem file)"
echo "   - Security group: Create new"
echo "     - Allow SSH (port 22) from your IP"
echo "     - Allow HTTP (port 80) from anywhere"
echo "     - Allow HTTPS (port 443) from anywhere"
echo "     - Allow Custom TCP (port 8080) from anywhere"
echo "   - Storage: 8 GB (free tier)"
echo "4. Click 'Launch Instance'"
echo "5. Download the .pem key file to ~/.ssh/"
echo ""
read -p "Press Enter when EC2 instance is running..."

echo ""
read -p "Enter the EC2 public IP address: " EC2_IP
read -p "Enter the path to your .pem key file [~/.ssh/${PROJECT_NAME}-key.pem]: " KEY_PATH
KEY_PATH=${KEY_PATH:-~/.ssh/${PROJECT_NAME}-key.pem}

# Expand tilde
KEY_PATH="${KEY_PATH/#\~/$HOME}"

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}STEP 3: Configure Security Groups${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "1. Go to EC2 Console → Security Groups"
echo "2. Find the RDS security group"
echo "3. Edit Inbound Rules → Add Rule:"
echo "   - Type: PostgreSQL"
echo "   - Port: 5432"
echo "   - Source: [Select the EC2 security group]"
echo "4. Save rules"
echo ""
read -p "Press Enter when security groups are configured..."

# Set key permissions
chmod 400 "$KEY_PATH"

echo ""
echo -e "${GREEN}Starting automated deployment...${NC}"
echo ""

# Create deployment files
TEMP_DIR=$(mktemp -d)
rsync -av --exclude='.git' --exclude='bin' --exclude='.env' \
    --exclude='*.log' --exclude='.DS_Store' \
    ./go-backend/ $TEMP_DIR/ 2>/dev/null

# Create .env file for Go backend
cat > $TEMP_DIR/.env << ENV_EOF
DATABASE_URL=postgresql://dbadmin:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${PROJECT_NAME//-/}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=168h
PORT=8080
NODE_ENV=production
FRONTEND_URL=http://${EC2_IP}
ENV_EOF

# Wait for SSH to be ready
echo "⏳ Waiting for SSH to be ready..."
for i in {1..30}; do
    if ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@${EC2_IP} 'exit' 2>/dev/null; then
        echo -e "${GREEN}✓ SSH connection successful${NC}"
        break
    fi
    echo "   Attempt $i/30..."
    sleep 5
done

# Setup server
echo ""
echo "📦 Installing software on server..."

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ubuntu@${EC2_IP} 'bash -s' << 'SETUP_EOF'
set -e

# Update system
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq

# Install Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker ubuntu
fi

# Install Nginx
sudo apt-get install -y nginx

# Install git and postgresql-client
sudo apt-get install -y git postgresql-client

echo "✓ Server setup complete"
SETUP_EOF

echo -e "${GREEN}✓ Server configured${NC}"

# Deploy application
echo ""
echo "🚀 Deploying application..."

# Copy files to server
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r $TEMP_DIR ubuntu@${EC2_IP}:~/app

# Build and run Docker container
ssh -i "$KEY_PATH" ubuntu@${EC2_IP} 'bash -s' << 'DEPLOY_EOF'
cd ~/app

# Stop and remove existing container if exists
docker stop community-centers 2>/dev/null || true
docker rm community-centers 2>/dev/null || true

# Build Docker image
docker build -t community-centers:latest .

# Run container
docker run -d \
    --name community-centers \
    --env-file .env \
    -p 8080:8080 \
    --restart unless-stopped \
    community-centers:latest

# Wait for container
sleep 5

# Check status
docker ps | grep community-centers
DEPLOY_EOF

echo -e "${GREEN}✓ Application deployed${NC}"

# Configure Nginx
echo ""
echo "🌐 Configuring Nginx..."

ssh -i "$KEY_PATH" ubuntu@${EC2_IP} 'bash -s' << 'NGINX_EOF'
sudo tee /etc/nginx/sites-available/community-centers > /dev/null << 'CONF'
server {
    listen 80;
    server_name _;
    client_max_body_size 100M;

    # SSE-friendly timeouts
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;

        # SSE headers
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;

        # Standard headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /healthz {
        proxy_pass http://localhost:8080/healthz;
        access_log off;
    }
}
CONF

sudo ln -sf /etc/nginx/sites-available/community-centers /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
NGINX_EOF

echo -e "${GREEN}✓ Nginx configured${NC}"

# Clean up
rm -rf $TEMP_DIR

# Save deployment info
cat > deployment-info.txt << INFO_EOF
Community Centers Platform Deployment Information
==================================================

Deployment Name: ${PROJECT_NAME}
AWS Region: ${AWS_REGION}

EC2 Public IP: ${EC2_IP}
SSH Key: ${KEY_PATH}

RDS Endpoint: ${RDS_ENDPOINT}
Database Name: ${PROJECT_NAME//-/}
Database User: dbadmin
Database Password: ${DB_PASSWORD}

JWT Secret: ${JWT_SECRET}

Application URL: http://${EC2_IP}
API Base URL: http://${EC2_IP}/api
Health Check: http://${EC2_IP}/healthz

Access Commands:
================
SSH to server:
  ssh -i ${KEY_PATH} ubuntu@${EC2_IP}

View logs:
  ssh -i ${KEY_PATH} ubuntu@${EC2_IP} 'docker logs -f community-centers'

Restart app:
  ssh -i ${KEY_PATH} ubuntu@${EC2_IP} 'docker restart community-centers'

Stop app:
  ssh -i ${KEY_PATH} ubuntu@${EC2_IP} 'docker stop community-centers'

Start app:
  ssh -i ${KEY_PATH} ubuntu@${EC2_IP} 'docker start community-centers'

Update app:
  ./update-app.sh

INFO_EOF

# Create update script
cat > update-app.sh << 'UPDATE_EOF'
#!/bin/bash
EC2_IP=$(grep "EC2 Public IP:" deployment-info.txt | cut -d: -f2 | xargs)
KEY_PATH=$(grep "SSH Key:" deployment-info.txt | cut -d: -f2 | xargs)

echo "🔄 Updating application..."

TEMP_DIR=$(mktemp -d)
rsync -av --exclude='.git' --exclude='bin' --exclude='.env' \
    --exclude='*.log' --exclude='.DS_Store' \
    ./go-backend/ $TEMP_DIR/ 2>/dev/null

scp -i "$KEY_PATH" -r $TEMP_DIR/* ubuntu@${EC2_IP}:~/app/

ssh -i "$KEY_PATH" ubuntu@${EC2_IP} 'bash -s' << 'SSH_EOF'
cd ~/app
docker build -t community-centers:latest .
docker stop community-centers
docker rm community-centers
docker run -d \
    --name community-centers \
    --env-file .env \
    -p 8080:8080 \
    --restart unless-stopped \
    community-centers:latest
SSH_EOF

rm -rf $TEMP_DIR
echo "✅ Update complete!"
UPDATE_EOF

chmod +x update-app.sh

# Test deployment
echo ""
echo "🧪 Testing deployment..."
sleep 5

if curl -s http://${EC2_IP}/healthz | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed. Checking logs...${NC}"
    ssh -i "${KEY_PATH}" ubuntu@${EC2_IP} 'docker logs --tail 50 community-centers'
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Application URL: ${BLUE}http://${EC2_IP}${NC}"
echo -e "API Base URL: ${BLUE}http://${EC2_IP}/api${NC}"
echo -e "Health check: ${BLUE}http://${EC2_IP}/healthz${NC}"
echo ""
echo -e "Deployment info saved to: ${YELLOW}deployment-info.txt${NC}"
echo ""
echo "Quick commands:"
echo "  View logs:     ssh -i ${KEY_PATH} ubuntu@${EC2_IP} 'docker logs -f community-centers'"
echo "  SSH to server: ssh -i ${KEY_PATH} ubuntu@${EC2_IP}"
echo "  Update app:    ./update-app.sh"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Save deployment-info.txt securely - it contains credentials${NC}"
echo ""
echo "Next steps:"
echo "1. Update frontend VITE_API_URL to: http://${EC2_IP}/api"
echo "2. Deploy frontend to Vercel or cPanel"
echo "3. Configure domain name (optional)"
echo "4. Set up SSL with Let's Encrypt (recommended for production)"
echo ""

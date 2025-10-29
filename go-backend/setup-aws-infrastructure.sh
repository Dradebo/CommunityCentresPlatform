#!/bin/bash
set -e

# AWS Infrastructure Setup Script
# This script creates all necessary AWS resources for the backend
# Run this ONCE before first deployment

AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PROJECT_NAME="community-centers"

echo "========================================="
echo "AWS Infrastructure Setup"
echo "========================================="
echo "Region: $AWS_REGION"
echo "Account: $AWS_ACCOUNT_ID"
echo "Project: $PROJECT_NAME"
echo "========================================="

# Step 1: Create ECR Repository
echo "📦 Creating ECR repository..."
aws ecr create-repository \
  --repository-name ${PROJECT_NAME}-backend \
  --region ${AWS_REGION} \
  --tags Key=Project,Value=${PROJECT_NAME} \
  || echo "Repository already exists"

# Step 2: Create ECS Cluster
echo "🏗️  Creating ECS cluster..."
aws ecs create-cluster \
  --cluster-name ${PROJECT_NAME}-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1,base=1 \
  --tags key=Project,value=${PROJECT_NAME} \
  --region ${AWS_REGION} \
  || echo "Cluster already exists"

# Step 3: Create CloudWatch Log Group
echo "📝 Creating CloudWatch log group..."
aws logs create-log-group \
  --log-group-name /ecs/${PROJECT_NAME}-backend \
  --region ${AWS_REGION} \
  || echo "Log group already exists"

# Step 4: Generate and store secrets
echo "🔐 Setting up AWS Secrets Manager..."

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -base64 32)
  echo "Generated JWT_SECRET: $JWT_SECRET"
fi

# Prompt for database URL
read -p "Enter DATABASE_URL (postgresql://user:pass@host:5432/db): " DATABASE_URL

# Store database URL secret
aws secretsmanager create-secret \
  --name ccp/database-url \
  --description "PostgreSQL connection string for Community Centers Platform" \
  --secret-string "$DATABASE_URL" \
  --tags Key=Project,Value=${PROJECT_NAME} \
  --region ${AWS_REGION} \
  2>/dev/null || \
aws secretsmanager update-secret \
  --secret-id ccp/database-url \
  --secret-string "$DATABASE_URL" \
  --region ${AWS_REGION}

# Store JWT secret
aws secretsmanager create-secret \
  --name ccp/jwt-secret \
  --description "JWT signing secret for Community Centers Platform" \
  --secret-string "$JWT_SECRET" \
  --tags Key=Project,Value=${PROJECT_NAME} \
  --region ${AWS_REGION} \
  2>/dev/null || \
aws secretsmanager update-secret \
  --secret-id ccp/jwt-secret \
  --secret-string "$JWT_SECRET" \
  --region ${AWS_REGION}

echo ""
echo "========================================="
echo "✅ Infrastructure setup complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Manually create:"
echo "   - VPC with public/private subnets (if not exists)"
echo "   - Security groups for ALB, ECS, and RDS"
echo "   - RDS PostgreSQL instance"
echo "   - Application Load Balancer"
echo "   - Target group for backend (port 8080)"
echo "   - IAM roles: ecsTaskExecutionRole, ecsTaskRole"
echo ""
echo "2. Update ecs-task-definition.json with:"
echo "   - AWS_ACCOUNT_ID: $AWS_ACCOUNT_ID"
echo "   - AWS_REGION: $AWS_REGION"
echo "   - FRONTEND_URL: your frontend domain"
echo ""
echo "3. Register task definition:"
echo "   aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json"
echo ""
echo "4. Create ECS service (see AWS-DEPLOYMENT.md)"
echo ""
echo "5. Run ./deploy-aws.sh to deploy"
echo "========================================="

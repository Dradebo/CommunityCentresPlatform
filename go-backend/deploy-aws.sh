#!/bin/bash
set -e

# AWS Deployment Script for Community Centers Platform Go Backend
# Usage: ./deploy-aws.sh [environment]
# Example: ./deploy-aws.sh production

ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO_NAME="community-centers-backend"
ECS_CLUSTER="community-centers-cluster"
ECS_SERVICE="backend-service"

echo "========================================="
echo "AWS Deployment Script"
echo "========================================="
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo "Account: $AWS_ACCOUNT_ID"
echo "========================================="

# Step 1: Build Docker image
echo "📦 Building Docker image..."
docker build -t ${ECR_REPO_NAME}:latest .

# Step 2: Tag image
echo "🏷️  Tagging image..."
docker tag ${ECR_REPO_NAME}:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:latest

docker tag ${ECR_REPO_NAME}:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:$(git rev-parse --short HEAD)

# Step 3: Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Step 4: Push to ECR
echo "⬆️  Pushing image to ECR..."
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:$(git rev-parse --short HEAD)

# Step 5: Update ECS service
echo "🚀 Updating ECS service..."
aws ecs update-service \
  --cluster ${ECS_CLUSTER} \
  --service ${ECS_SERVICE} \
  --force-new-deployment \
  --region ${AWS_REGION}

# Step 6: Wait for deployment
echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster ${ECS_CLUSTER} \
  --services ${ECS_SERVICE} \
  --region ${AWS_REGION}

echo "========================================="
echo "✅ Deployment completed successfully!"
echo "========================================="
echo "Service: ${ECS_SERVICE}"
echo "Cluster: ${ECS_CLUSTER}"
echo "Image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:latest"
echo "========================================="

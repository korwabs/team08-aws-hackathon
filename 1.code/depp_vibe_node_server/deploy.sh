#!/bin/bash

# 변수 설정
PROJECT_NAME="chat-transcribe"
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🚀 Starting deployment process..."

# 1. Terraform 인프라 배포
echo "📦 Deploying infrastructure with Terraform..."
cd terraform
terraform init
terraform plan
terraform apply -auto-approve

# ECR 리포지토리 URL 가져오기
ECR_REPO=$(terraform output -raw ecr_repository_url)
cd ..

# 2. Docker 이미지 빌드 및 푸시
echo "🐳 Building and pushing Docker image..."

# ECR 로그인
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# Docker 이미지 빌드
docker build -t $PROJECT_NAME .
docker tag $PROJECT_NAME:latest $ECR_REPO:latest

# ECR에 푸시
docker push $ECR_REPO:latest

# 3. ECS 서비스 업데이트
echo "🔄 Updating ECS service..."
aws ecs update-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service ${PROJECT_NAME}-service \
    --force-new-deployment \
    --region $AWS_REGION

echo "✅ Deployment completed!"
echo "🌐 Application will be available at: http://$(cd terraform && terraform output -raw load_balancer_dns)"

#!/bin/bash

# 변수 설정
PROJECT_NAME="langgraph-prd"
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
APP_DIR="../../1.code/langgraph"

echo "🚀 Starting LangGraph deployment process..."

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

# Dockerfile 생성 (LangGraph 프로젝트용)
cat > $APP_DIR/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 출력 디렉토리 생성
RUN mkdir -p prd_outputs

# 포트 노출
EXPOSE 8000

# 애플리케이션 실행
CMD ["python", "main.py"]
EOF

# Docker 이미지 빌드 (x86_64 플랫폼용)
cd $APP_DIR
docker build --platform linux/amd64 -t $PROJECT_NAME .
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
echo "🌐 HTTPS API endpoint: $(cd ../../2.iac/langgraph_deploy/terraform && terraform output -raw api_endpoint)"
echo "📚 API Documentation: $(cd ../../2.iac/langgraph_deploy/terraform && terraform output -raw api_endpoint)/docs"
echo ""
echo "📋 Available endpoints:"
echo "  HTTPS (CloudFront): $(cd ../../2.iac/langgraph_deploy/terraform && terraform output -raw api_endpoint)"
echo "  HTTP (ALB Direct):  $(cd ../../2.iac/langgraph_deploy/terraform && terraform output -raw http_endpoint)"

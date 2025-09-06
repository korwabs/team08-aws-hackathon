#!/bin/bash

PROJECT_NAME="langgraph-prd"
AWS_REGION="us-east-1"

echo "🗑️  Starting resource cleanup..."

# 1. ECS 서비스 스케일 다운
echo "📉 Scaling down ECS service..."
aws ecs update-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service ${PROJECT_NAME}-service \
    --desired-count 0 \
    --region $AWS_REGION

# 2. Terraform 리소스 삭제
echo "🔥 Destroying infrastructure with Terraform..."
cd terraform
terraform destroy -auto-approve
cd ..

echo "✅ Cleanup completed!"

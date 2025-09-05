#!/bin/bash

echo "🗑️  Destroying infrastructure..."

# ECR 이미지 삭제
echo "Deleting ECR images..."
aws ecr batch-delete-image \
    --repository-name chat-transcribe-app \
    --image-ids imageTag=latest \
    --region us-east-1 2>/dev/null || true

# Terraform destroy
cd terraform
terraform destroy -auto-approve

echo "✅ Infrastructure destroyed!"

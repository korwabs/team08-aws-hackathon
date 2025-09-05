#!/bin/bash

echo "🛑 Stopping ECS service..."

# ECS 서비스 중단 (desired count를 0으로 설정)
aws ecs update-service \
    --cluster chat-transcribe-cluster \
    --service chat-transcribe-service \
    --desired-count 0 \
    --region us-east-1

echo "✅ ECS service stopped (desired count set to 0)"

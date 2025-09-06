# LangGraph PRD Generator - AWS 배포

LangGraph PRD 생성 에이전트를 AWS ECS Fargate에 배포하는 Terraform 구성입니다.

## 아키텍처

- **ECS Fargate**: 컨테이너화된 FastAPI 애플리케이션
- **Application Load Balancer**: HTTP 트래픽 분산
- **S3**: PRD 파일 저장소
- **Amazon Bedrock**: Claude 모델 연동
- **ECR**: Docker 이미지 저장소

## 배포 전 준비사항

### 1. AWS CLI 설정
```bash
aws configure
```

### 2. Terraform 설치
```bash
# macOS
brew install terraform

# 또는 다운로드: https://www.terraform.io/downloads
```

### 3. Docker 설치
```bash
# macOS
brew install docker
```

## 배포 방법

### HTTPS 설정 (권장)

도메인이 있는 경우 HTTPS로 배포:

```bash
# terraform.tfvars 파일 생성
echo 'domain_name = "api.yourdomain.com"' > terraform/terraform.tfvars

# 배포 실행
./deploy.sh
```

**주의:** 도메인의 DNS 설정에서 ACM 인증서 검증을 위한 CNAME 레코드를 추가해야 합니다.

### HTTP 배포 (테스트용)

도메인 없이 HTTP로 배포:

```bash
./deploy.sh
```

### 1. 자동 배포 (권장)
```bash
./deploy.sh
```

### 2. 수동 배포
```bash
# 1. 인프라 배포
cd terraform
terraform init
terraform apply

# 2. Docker 이미지 빌드 및 푸시
ECR_REPO=$(terraform output -raw ecr_repository_url)
cd ../../1.code/langgraph

# Dockerfile 생성 (deploy.sh에서 자동 생성됨)
docker build --platform linux/amd64 -t langgraph-prd .
docker tag langgraph-prd:latest $ECR_REPO:latest
docker push $ECR_REPO:latest

# 3. ECS 서비스 업데이트
aws ecs update-service \
    --cluster langgraph-prd-cluster \
    --service langgraph-prd-service \
    --force-new-deployment
```

## 배포 후 확인

### API 엔드포인트
```bash
# 로드 밸런서 DNS 확인
cd terraform
terraform output load_balancer_dns

# API 테스트
curl http://<load-balancer-dns>/health
```

### Swagger UI 접속
```
http://<load-balancer-dns>/docs
```

## API 사용법

### PRD 생성
```bash
curl -X POST "http://<load-balancer-dns>/generate-prd" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_summary": "쇼핑몰 관리자 페이지 개발 요구사항",
    "image_url": "https://s3.amazonaws.com/bucket/design.png",
    "html_url": "https://s3.amazonaws.com/bucket/template.html"
  }'
```

### PRD 파일 조회
```bash
curl "http://<load-balancer-dns>/prd/PRD_20250906_110856.md"
```

## 환경 변수

배포 시 다음 환경 변수가 자동으로 설정됩니다:

- `AWS_REGION`: us-east-1
- `BEDROCK_MODEL_ID`: us.anthropic.claude-sonnet-4-20250514-v1:0
- `MODEL_TEMPERATURE`: 0
- `MAX_TOKENS`: 4096
- `DEBUG`: false
- `LOG_LEVEL`: INFO
- `S3_BUCKET_NAME`: 자동 생성된 S3 버킷명

## 리소스 정리

```bash
./destroy.sh
```

## 비용 예상

**월 예상 비용 (최소 사용량 기준):**
- ECS Fargate (0.25 vCPU, 0.5GB): ~$10
- Application Load Balancer: ~$16
- S3 (1GB 저장): ~$0.02
- Bedrock API 호출: 사용량에 따라 변동
- **총 예상: ~$26/월** (Bedrock 제외)

## 문제 해결

### 1. 배포 실패 시
```bash
# 로그 확인
aws logs describe-log-groups --log-group-name-prefix "/ecs/langgraph-prd"

# ECS 서비스 상태 확인
aws ecs describe-services \
    --cluster langgraph-prd-cluster \
    --services langgraph-prd-service
```

### 2. Bedrock 권한 오류
- IAM 역할에 `bedrock-runtime:InvokeModel` 권한이 있는지 확인
- Bedrock 모델이 해당 리전에서 사용 가능한지 확인

### 3. S3 접근 오류
- IAM 역할에 S3 버킷 권한이 있는지 확인
- 버킷 정책 확인

## 보안 고려사항

- ECS Task Role을 통한 AWS 서비스 접근 (하드코딩된 자격증명 없음)
- S3 버킷 퍼블릭 액세스 차단
- VPC 내 프라이빗 서브넷 사용 가능 (필요 시)
- ALB를 통한 HTTPS 설정 가능 (도메인 있을 시)

## 모니터링

- **CloudWatch Logs**: `/ecs/langgraph-prd-app`
- **ECS 메트릭**: CPU, 메모리 사용률
- **ALB 메트릭**: 요청 수, 응답 시간

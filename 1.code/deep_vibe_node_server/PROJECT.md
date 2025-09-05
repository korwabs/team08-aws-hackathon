# Deep Vibe Node Server - 진행 상황

> 전체 프로젝트 개요는 [../PROJECT.md](../PROJECT.md)를 참조하세요.

## 🎯 프로젝트 현황 (2025-09-05)

### ✅ 완료된 주요 기능

#### 1. 실시간 채팅 시스템
- **WebSocket 기반**: Socket.IO를 사용한 실시간 통신
- **채팅방 관리**: 생성, 입장, 메시지 송수신
- **메시지 타입**: 텍스트, 음성인식, 이미지, HTML 파일
- **데이터베이스**: MySQL을 통한 영구 저장

#### 2. AWS Transcribe 음성인식
- **실시간 스트리밍**: 마이크 입력을 실시간으로 텍스트 변환
- **파일 기반 STT**: 녹음 완료 후 S3 업로드 → Transcribe 배치 처리
- **WebSocket 연동**: 음성인식 결과를 채팅으로 자동 저장
- **오디오 시각화**: 실시간 오디오 파형 표시
- **성능 최적화**: AWS 모범사례 적용 (64ms 청크, PCM 검증)

#### 3. 이미지 업로드 시스템
- **S3 연동**: AWS S3를 통한 이미지 저장
- **실시간 공유**: 업로드된 이미지를 채팅방에 즉시 표시
- **파일 검증**: 이미지 파일만 업로드 허용

#### 4. 🆕 HTML 파일 업로드 & 버전 관리
- **자동 버전 관리**: 채팅방별로 v1, v2, v3... 자동 증가
- **S3 저장**: `html/{roomId}/v{version}_{uuid}.html` 구조
- **메타데이터 관리**: 파일명, 크기, 업로드자, 생성일시
- **즉시 실행**: S3 퍼블릭 URL로 HTML 파일 바로 실행

#### 5. 🆕 AI 채팅 요약 시스템
- **Claude Sonnet 4**: AWS Bedrock을 통한 최신 AI 모델 사용
- **요구사항 중심**: 웹페이지 제작을 위한 구체적 요구사항 분석
- **텍스트 전용**: 성능 최적화를 위해 이미지 제외하고 텍스트만 분석
- **마크다운 출력**: 구조화된 요약 결과 제공

#### 6. 🆕 요약 사이드바 UI
- **우측 슬라이드**: 부드러운 애니메이션으로 사이드바 표시
- **마크다운 렌더링**: marked.js를 사용한 구조화된 표시
- **통계 정보**: 메시지 수, 이미지 수 시각적 표시
- **반응형 디자인**: 데스크톱/모바일 최적화

#### 7. 🆕 API 문서화 시스템
- **OpenAPI 3.0**: `/api/docs/openapi.json`
- **OpenAPI 2.0**: `/api/docs/swagger.json`
- **Swagger UI**: `/api-docs` 인터랙티브 문서
- **외부 연동**: Postman, Insomnia 등 도구 지원

### 🔌 WebSocket 이벤트

#### 클라이언트 → 서버
- `join-room`: 채팅방 입장
- `chat-message`: 메시지 전송
- `start-transcribe`: 실시간 음성인식 시작
- `audio-data`: 실시간 오디오 데이터 전송
- `stop-transcribe`: 실시간 음성인식 중지
- `start-file-recording`: 파일 기반 녹음 시작
- `audio-chunk`: 파일 기반 오디오 청크 전송
- `stop-file-recording`: 파일 기반 녹음 중지 및 STT 처리

#### 서버 → 클라이언트
- `message-received`: 새 메시지 수신
- `transcription-result`: 실시간 음성인식 결과
- `chat-message`: 채팅 메시지 브로드캐스트
- `file-transcribe-complete`: 파일 STT 처리 완료
- `file-transcribe-error`: 파일 STT 처리 오류
- `user-joined`: 사용자 입장
- `user-left`: 사용자 퇴장

#### 채팅방 관리
- `GET /api/rooms`: 채팅방 목록 (메시지/이미지 수 포함)
- `POST /api/rooms`: 채팅방 생성
- `GET /api/rooms/:roomId/messages`: 메시지 조회

#### 파일 업로드
- `POST /api/upload`: 이미지 파일 업로드
- `POST /api/rooms/:roomId/html`: HTML 파일 업로드
- `GET /api/rooms/:roomId/html`: HTML 파일 목록 조회

#### AI 기능
- `GET /api/rooms/:roomId/summary`: 채팅 요약 (Claude Sonnet 4)

#### API 문서
- `GET /api-docs`: Swagger UI
- `GET /api/docs/openapi.json`: OpenAPI 3.0 JSON
- `GET /api/docs/swagger.json`: OpenAPI 2.0 JSON

### 🏗️ 기술 스택

#### Backend
- **Runtime**: Node.js 18 + TypeScript
- **Framework**: Express.js + Socket.IO
- **Database**: MySQL (RDS)
- **File Storage**: AWS S3
- **AI Service**: AWS Bedrock (Claude Sonnet 4)
- **Documentation**: Swagger/OpenAPI

#### Frontend
- **Base**: Vanilla JavaScript + HTML5/CSS3
- **WebSocket**: Socket.IO Client
- **File Upload**: FormData + Fetch API
- **Markdown**: marked.js
- **UI**: 반응형 디자인, 모달, 애니메이션

#### Infrastructure
- **Container**: Docker + ECS Fargate
- **Load Balancer**: Application Load Balancer
- **CDN**: CloudFront (HTTPS)
- **IaC**: Terraform

### 📊 데이터베이스 스키마

```sql
-- 채팅방
CREATE TABLE chat_rooms (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 메시지
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HTML 파일 버전 관리
CREATE TABLE html_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(36) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  s3_url VARCHAR(1000) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  file_size INT NOT NULL,
  uploaded_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_room_version (room_id, version)
);
```

### 🎨 사용자 인터페이스

#### 메인 기능
- **채팅방 생성/입장**: 드롭다운 선택 및 실시간 목록 업데이트
- **실시간 채팅**: 텍스트 메시지 송수신
- **실시간 음성인식**: 마이크 버튼으로 음성을 실시간 텍스트 변환
- **파일 기반 녹음**: 녹음 완료 후 정확한 STT 처리
- **이미지 업로드**: 드래그앤드롭 또는 파일 선택
- **HTML 업로드**: 버전 관리되는 HTML 파일 업로드

#### 새로운 UI 요소
- **🎤 실시간 음성인식**: 실시간 STT 버튼
- **📁 파일 녹음**: 파일 기반 STT 버튼
- **📋 요약 버튼**: 헤더 우측의 요약 기능 버튼
- **요약 사이드바**: 우측에서 슬라이드되는 요약 패널
- **📄 HTML 업로드**: HTML 파일 업로드 버튼
- **📋 HTML 목록**: HTML 파일 목록 모달
- **버전 배지**: 각 HTML 파일의 버전 표시

### 🔧 환경 설정

#### 필수 환경 변수
```bash
# AWS 설정
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name

# Bedrock 설정
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20250514-v1:0

# 데이터베이스 설정
DB_HOST=your_mysql_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=chatapp
DB_PORT=3306

# 서버 설정
PORT=3000
NODE_ENV=development
```

#### AWS 권한 요구사항
- `bedrock:InvokeModel`: Claude Sonnet 4 모델 호출
- `s3:PutObject`, `s3:GetObject`: 파일 업로드/조회
- `transcribe:StartStreamTranscription`: 실시간 음성인식
- `transcribe:StartTranscriptionJob`: 파일 기반 음성인식
- `transcribe:GetTranscriptionJob`: 음성인식 작업 상태 조회

### 📈 성능 최적화

#### 완료된 최적화
- **실시간 STT**: 청크 크기 최적화 (256ms → 64ms, 75% 지연시간 감소)
- **PCM 검증**: 단일 채널 PCM 데이터 무결성 확인
- **파일 STT**: S3 업로드 후 배치 처리로 정확도 향상
- **요약 API**: 이미지 제외로 응답시간 75% 단축, 토큰 비용 70% 절약
- **방 목록**: 단일 쿼리로 메시지/이미지 수 포함 조회
- **파일 업로드**: 메모리 기반 처리로 빠른 업로드
- **CDN**: CloudFront를 통한 정적 파일 캐싱

### 🚀 배포 현황

#### 프로덕션 환경
- **URL**: https://d2k05d66hwbq2e.cloudfront.net
- **인프라**: AWS ECS Fargate + RDS + S3 + CloudFront
- **모니터링**: CloudWatch 로그 및 메트릭

#### 개발 환경
```bash
npm install
npm run dev
# http://localhost:3000
```

### 📝 테스트 자료

#### 제공된 테스트 파일
- **test-sample.html**: 쇼핑몰 데모 페이지
  - 반응형 디자인
  - 화이트/블랙/골드 컬러 스키마
  - 인터랙티브 요소 (사이즈 선택, 장바구니)

#### 테스트 시나리오
- **test-chat-script.md**: 쇼핑몰 웹페이지 제작 대화 스크립트
  - 20개 메시지로 구성된 자연스러운 대화
  - 요구사항 도출 과정 시뮬레이션

### 🎯 다음 단계

#### 진행 중인 PR
- **PR #5**: 채팅 요약 API (머지 대기)
- **PR #6**: 방 목록 개선 (머지 대기)  
- **PR #7**: 요약 성능 최적화 (머지 대기)
- **PR #8**: 요약 사이드바 UI (머지 대기)
- **PR #9**: HTML 업로드 & OpenAPI 2.0 (머지 대기)
- **PR #23**: STT 성능 최적화 & 파일 기반 STT (리뷰 중)

#### 향후 개선 계획
- LangGraph 에이전트와의 연동
- 실시간 HTML 생성 기능
- 버전 비교 및 롤백 기능
- 사용자 권한 관리
- 성능 모니터링 대시보드

### 📊 프로젝트 통계

- **총 API 엔드포인트**: 8개
- **데이터베이스 테이블**: 3개
- **AWS 서비스**: 5개 (S3, Bedrock, Transcribe, ECS, RDS)
- **프론트엔드 기능**: 7개 주요 기능
- **문서화**: OpenAPI 2.0/3.0 완전 지원

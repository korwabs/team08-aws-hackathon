# AWS Bedrock Claude Sonnet 4 채팅 요약 API 구현

## 개요
AWS Bedrock Claude Sonnet 4를 사용하여 채팅방의 대화 내용과 이미지를 분석하고, 웹페이지 제작 에이전트를 위한 요구사항 중심의 상세한 요약을 제공하는 API를 구현했습니다.

## 구현된 기능

### 1. 새로운 API 엔드포인트
```
GET /api/rooms/:roomId/summary
```

### 2. 주요 기능
- **채팅 이력 조회**: 특정 채팅방의 모든 텍스트 및 이미지 메시지 조회
- **이미지 분석**: S3에서 이미지를 가져와 Claude에 함께 전달하여 분석
- **요구사항 중심 요약**: 웹페이지 제작을 위한 구체적인 요구사항 정리
- **멀티모달 분석**: 텍스트와 이미지를 함께 분석하여 종합적인 요약 제공

### 3. 응답 형식
```json
{
  "summary": "웹페이지 제작을 위한 상세한 요구사항 분석 결과",
  "messageCount": 15,
  "imageCount": 3
}
```

## 기술적 구현 사항

### 1. 사용된 AWS 서비스
- **AWS Bedrock**: Claude Sonnet 4 모델 (Cross-region inference)
- **Amazon S3**: 이미지 파일 저장 및 조회
- **MySQL**: 채팅 메시지 및 메타데이터 저장

### 2. 모델 설정
```typescript
// Cross-region inference profile 사용
modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0'
```

### 3. 멀티모달 입력 구성
- 텍스트 메시지: 시간순 정렬된 대화 내용
- 이미지 메시지: S3에서 base64로 변환하여 Claude에 전달
- 구조화된 프롬프트: 요구사항 분석에 특화된 지시사항

### 4. 요약 출력 구조
1. **주요 요구사항**: 기능, 디자인, 기술스택 등
2. **세부 사항 및 제약조건**: 구체적인 구현 요구사항
3. **우선순위 및 중요도**: 개발 순서 및 중요도 분석
4. **이미지 관련 요구사항**: 업로드된 이미지 기반 요구사항

## 파일 구조

### 새로 추가된 파일
- `src/services/chat-summary.ts`: 채팅 요약 서비스 구현

### 수정된 파일
- `package.json`: AWS Bedrock Runtime SDK 의존성 추가
- `src/server.ts`: 요약 API 엔드포인트 및 서비스 연동
- `.env.example`: Bedrock 모델 설정 추가

## 환경 설정

### 1. 필요한 환경 변수
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20250514-v1:0
```

### 2. AWS 권한 요구사항
- `bedrock:InvokeModel`: Claude Sonnet 4 모델 호출
- `s3:GetObject`: 이미지 파일 조회
- Bedrock Model Access에서 Claude Sonnet 4 액세스 승인 필요

## 사용 방법

### 1. 개발환경 실행
```bash
npm install
npm run dev
```

### 2. API 호출 예시
```bash
curl http://localhost:3000/api/rooms/{roomId}/summary
```

## 특징

### 1. 웹페이지 제작 특화
- 일반적인 요약이 아닌 웹페이지 제작 에이전트를 위한 구조화된 요구사항 분석
- 기능, 디자인, 기술스택 등을 체계적으로 분류하여 제공

### 2. 멀티모달 분석
- 텍스트와 이미지를 함께 분석하여 더 정확한 요구사항 파악
- 이미지에서 UI/UX 요구사항, 디자인 참고사항 등을 추출

### 3. 상세한 분석
- 응답 길이 제한 없이 상세한 요구사항 정리
- 우선순위와 중요도까지 포함한 종합적인 분석

## 향후 개선 방향
- 다양한 이미지 포맷 지원 확대
- 요약 결과 캐싱을 통한 성능 최적화
- 요구사항 템플릿 커스터마이징 기능

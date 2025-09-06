# PRD 생성 에이전트

아이디어 회의 요약 데이터를 기반으로 완전한 PRD(Product Requirements Document)를 자동 생성하는 에이전트입니다.

## 주요 기능

- 대화 요약 정보를 기반으로 한 PRD 자동 생성
- 기존 HTML 파일 수정 요구사항 정의
- 참조 이미지 기반 CSS 스타일 가이드 생성
- 동적 데이터 생성을 위한 LLM API 연동 코드 포함
- HTML 에이전트 실행 가이드 제공
- **FastAPI 기반 REST API 제공**

## 입력 데이터

1. **대화 요약 정보** (필수): 아이디어 회의에서 도출된 요구사항
2. **PRD URL** (옵션): 기존 PRD 파일 참조용
3. **S3 이미지 URL** (옵션): CSS 스타일 참조용 이미지
4. **S3 HTML URL** (옵션): 수정할 기존 HTML 파일

## 시나리오별 처리

- **이미지만 존재**: 이미지와 유사한 CSS 스타일로 HTML 생성
- **HTML만 존재**: 기존 HTML 파일 수정
- **둘 다 존재**: HTML을 이미지 스타일로 수정
- **둘 다 없음**: 새로운 HTML 생성

## 사용법

### 1. FastAPI 서버 실행 (권장)

#### 설치
```bash
pip install -r requirements.txt
```

#### 서버 시작
```bash
python start_server.py
```

#### API 호출
```bash
# PRD 생성
curl -X POST "http://localhost:8000/generate-prd" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_summary": "쇼핑몰 관리자 페이지 개발",
    "image_url": "https://s3.amazonaws.com/bucket/design.png",
    "html_url": "https://s3.amazonaws.com/bucket/template.html"
  }'

# PRD 내용 조회
curl "http://localhost:8000/prd/PRD_20250906_110856.md"
```

#### API 문서
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 2. 명령행 실행
```bash
python run_prd_agent.py "대화요약내용" [prd_url] [image_url] [html_url]
```

### 3. JSON 파일 사용
```bash
python run_prd_agent.py --json test_input.json
```

### 4. Python 코드에서 직접 사용
```python
from prd_agent import PRDAgent

agent = PRDAgent()
prd_file = agent.generate_prd(
    conversation_summary="요구사항 요약",
    image_url="https://s3.amazonaws.com/bucket/image.png",
    html_url="https://s3.amazonaws.com/bucket/file.html"
)
```

## API 엔드포인트

### POST /generate-prd
PRD 파일 생성

**Request Body:**
```json
{
  "conversation_summary": "string (required)",
  "prd_url": "string (optional)",
  "image_url": "string (optional)", 
  "html_url": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "file_path": "prd_outputs/PRD_20250906_110856.md",
  "message": "PRD 파일이 성공적으로 생성되었습니다."
}
```

### GET /prd/{filename}
PRD 파일 내용 조회

**Response:**
```json
{
  "filename": "PRD_20250906_110856.md",
  "content": "# Product Requirements Document..."
}
```

### GET /health
서버 상태 확인

## 출력 결과

생성된 PRD는 `prd_outputs/` 폴더에 `.md` 파일로 저장되며, 다음 섹션들을 포함합니다:

- 프로젝트 개요
- 요구사항 분석
- 기술적 구현 사항
- HTML 에이전트 실행 가이드
- 데이터 처리 요구사항
- 품질 보증 체크리스트

## 특징

### 동적 데이터 생성
PRD에는 데이터 조회/생성 기능이 있는 HTML 요소마다 LLM API를 호출하여 맞춤형 데이터를 생성하는 코드가 자동으로 포함됩니다.

### 리소스 조회 API
HTML/이미지 URL이 제공된 경우, 해당 리소스를 조회하는 API 호출 가이드가 포함됩니다.

### 완전한 구현 가이드
HTML 에이전트가 바로 실행할 수 있는 상세한 기술적 구현 지침을 제공합니다.

## 파일 구조

```
langgraph/
├── prd_agent.py          # 메인 PRD 생성 에이전트
├── run_prd_agent.py      # 실행 스크립트
├── test_input.json       # 테스트용 입력 데이터
├── README.md             # 사용 가이드
└── prd_outputs/          # 생성된 PRD 파일들
```

## 테스트 실행

```bash
# 테스트 JSON 파일로 실행
python run_prd_agent.py --json test_input.json

# 직접 파라미터로 실행
python run_prd_agent.py "쇼핑몰 관리자 페이지 개발" None "https://s3.amazonaws.com/bucket/design.png" None
```

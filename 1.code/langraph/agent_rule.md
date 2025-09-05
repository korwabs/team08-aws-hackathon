# agent_rule.md

해당 파일은 ../1.code/PROJECT.md 에 정의된 서비스를 만들기 위한 에이전트 코드의 rule을 정의한 파일입니다.

## 프로젝트 개요

AWS Bedrock claude-opus-4-1 모델을 사용하여 특화된 에이전트들의 순차적 워크플로우를 통해 HTML 애플리케이션을 구축하는 Python 기반 LangGraph 에이전트 시스템입니다.

## 설치 및 설정 방법

### 사전 요구사항

- Python 3.x
- Bedrock 액세스를 위한 AWS 자격증명 설정

### 설치

```bash
pip install -r requirements.txt
cp .env.example .env
# Bedrock 액세스를 위한 AWS 자격증명 설정
```

### 애플리케이션 실행

```bash
python main.py
```

## 아키텍처 규칙

### 핵심 워크플로우

다음 순차적 에이전트 패턴을 반드시 따라야 합니다:

1. PRD 생성기 → 2. HTML 생성기 → 3. 코드 리뷰어 → 4. HTML 테스터

### 상태 관리 패턴

모든 에이전트는 반드시:

- `state` 딕셔너리를 매개변수로 받아야 함
- 업데이트된 `state` 딕셔너리를 반환해야 함
- 공유 상태 필드 사용: `input_data`, `prd`, `html_code`, `reviewed_html`, `test_result`, `messages`
- `messages` 배열에 작업 로그 기록

### 에이전트 구현 규칙

`agents/{agent_name}/agent.py`의 각 에이전트는 반드시:

- AWS Bedrock claude-opus-4-1 모델 사용
- 일관된 결과를 위해 `temperature=0` 설정
- 필수 import: `from langchain_aws import ChatBedrock` 및 `from langchain.schema import HumanMessage`
- 한국어 프롬프트 템플릿 사용
- 적절한 상태 필드와 메시지 배열 업데이트

## 파일 구조 규칙

```
agents/
├── prd_generator/agent.py    # Product Requirements Document 생성
├── html_generator/agent.py   # 완전한 HTML5 코드 생성
├── code_reviewer/agent.py    # 코드 검토 및 개선사항 제안
└── html_tester/agent.py      # 최종 HTML 출력 테스트
```

## 코딩 표준

### 필수 Import 문

```python
from langchain_aws import ChatBedrock
from langchain.schema import HumanMessage
```

### 에이전트 함수 템플릿

```python
def agent_function(state):
    llm = ChatBedrock(
        model_id="anthropic.claude-opus-4-1-20250805-v1:0",
        region_name="us-east-1"
    )
    prompt = f"한국어 프롬프트 템플릿: {state.get('field', '')}"
    response = llm.invoke([HumanMessage(content=prompt)])
    state["target_field"] = response.content
    state["messages"].append(f"작업 완료: {len(response.content)} 문자")
    return state
```

### 환경 설정

- 필수: AWS 자격증명 설정 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION)
- 실제 AWS 자격증명을 저장소에 커밋하지 말 것
- 템플릿으로 `.env.example` 사용

## 워크플로우 규칙

### main.py 요구사항

- 각 모듈에서 모든 에이전트 함수를 import
- StateGraph를 사용하여 워크플로우 생성
- 진입점을 "prd_generator"로 설정 ("summarizer"가 아님)
- 에이전트를 순차적으로 연결: prd_generator → html_generator → code_reviewer → html_tester → END
- 컴파일된 워크플로우 반환

### 상태 초기화

```python
initial_state = {
    "input_data": "",
    "prd": "",
    "html_code": "",
    "reviewed_html": "",
    "test_result": "",
    "messages": []
}
```

## 에이전트별 규칙

### PRD 생성기

- input_data를 직접 처리 (요약 단계 없음)
- 포괄적인 Product Requirements Document 생성
- 포함 사항: 제품 개요, 기능 요구사항, 사용자 스토리, 기술적 요구사항, UI/UX 가이드라인

### HTML 생성기

- 완전한 HTML5 문서 구조 생성
- 인라인 CSS 및 JavaScript 포함
- 반응형 디자인 및 접근성 보장
- 최신 웹 표준 준수

### 코드 리뷰어

- 생성된 HTML의 개선사항 검토
- 모범 사례, 접근성 및 성능 확인
- 구체적인 향상 방안 제공

### HTML 테스터

- 최종 HTML 코드 실행 테스트
- 기능성 및 사용자 경험 검증
- 테스트 결과 및 발견된 문제점 보고

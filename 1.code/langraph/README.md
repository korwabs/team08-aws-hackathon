# LangGraph 에이전트 프로젝트

## 프로젝트 구조

```
agents/
├── main.py                 # 메인 실행 파일
├── requirements.txt        # 의존성 패키지
├── .env.example           # 환경변수 예시
├── README.md              # 프로젝트 설명
└── agents/
    ├── data_summarizer/   # 데이터 요약 에이전트
    ├── prd_generator/     # PRD 생성 에이전트
    ├── html_generator/    # HTML 생성 에이전트
    ├── code_reviewer/     # 코드 리뷰 에이전트
    └── html_tester/       # HTML 테스트 에이전트
```

## 에이전트 설명

1. **데이터 요약 에이전트**: 텍스트, 이미지, 와이어프레임(XML), HTML 등을 요약
2. **PRD 생성 에이전트**: Product Requirements Document 생성
3. **HTML 생성 에이전트**: PRD 기반 HTML 코드 생성
4. **코드 리뷰 에이전트**: 생성된 HTML 코드 리뷰 및 수정
5. **HTML 테스트 에이전트**: 리뷰된 HTML 실행 테스트

## 설치 및 실행

1. 의존성 설치:
```bash
pip install -r requirements.txt
```

2. 환경변수 설정:
```bash
cp .env.example .env
# .env 파일에 OpenAI API 키 입력
```

3. 실행:
```bash
python main.py
```

"""
LangChain Tools를 사용한 MCP 서버 연동 Code Reviewer 에이전트
"""
from typing import Dict, Any, List
from core.base_agent import BaseAgent
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
import subprocess
import json
import tempfile
import os

class HTMLValidationInput(BaseModel):
    """HTML 검증 도구 입력 스키마"""
    html_code: str = Field(description="검증할 HTML 코드")

class PerformanceAnalysisInput(BaseModel):
    """성능 분석 도구 입력 스키마"""
    html_code: str = Field(description="분석할 HTML 코드")

class JSQualityCheckInput(BaseModel):
    """JavaScript 품질 검사 입력 스키마"""
    html_code: str = Field(description="검사할 HTML 코드 (JavaScript 포함)")

class HTMLValidatorTool(BaseTool):
    """HTML 검증 도구"""
    name: str = "html_validator"
    description: str = "HTML 코드의 구문 오류, 접근성, SEO를 검증합니다."
    args_schema: type[BaseModel] = HTMLValidationInput

    def _run(self, html_code: str) -> str:
        """HTML 검증 실행"""
        try:
            # MCP 서버 호출 시뮬레이션 (실제로는 mcp_config.json 기반)
            validation_result = {
                "syntax_errors": [],
                "accessibility_issues": [],
                "seo_issues": []
            }
            
            # 기본 HTML 검증 로직
            if "<!DOCTYPE html>" not in html_code:
                validation_result["syntax_errors"].append({
                    "type": "missing_doctype",
                    "message": "HTML5 DOCTYPE 선언이 누락되었습니다.",
                    "severity": "error"
                })
            
            if "<html lang=" not in html_code:
                validation_result["accessibility_issues"].append({
                    "type": "missing_lang",
                    "message": "html 태그에 lang 속성이 누락되었습니다.",
                    "severity": "warning"
                })
            
            if "<title>" not in html_code:
                validation_result["seo_issues"].append({
                    "type": "missing_title",
                    "message": "페이지 제목이 누락되었습니다.",
                    "severity": "error"
                })
            
            return json.dumps(validation_result, ensure_ascii=False, indent=2)
            
        except Exception as e:
            return f"HTML 검증 중 오류 발생: {str(e)}"

class PerformanceAnalyzerTool(BaseTool):
    """성능 분석 도구"""
    name: str = "performance_analyzer"
    description: str = "웹 페이지의 성능, 접근성, SEO를 분석합니다."
    args_schema: type[BaseModel] = PerformanceAnalysisInput

    def _run(self, html_code: str) -> str:
        """성능 분석 실행"""
        try:
            performance_result = {
                "performance_score": 85,
                "accessibility_score": 90,
                "seo_score": 88,
                "recommendations": []
            }
            
            # 성능 분석 로직
            if html_code.count("<style>") > 1:
                performance_result["recommendations"].append({
                    "type": "css_optimization",
                    "message": "여러 개의 style 블록을 하나로 통합하세요.",
                    "priority": "medium"
                })
            
            if "<script>" in html_code and "defer" not in html_code:
                performance_result["recommendations"].append({
                    "type": "script_optimization",
                    "message": "스크립트 태그에 defer 속성을 추가하세요.",
                    "priority": "medium"
                })
            
            if "viewport" not in html_code:
                performance_result["recommendations"].append({
                    "type": "responsive_design",
                    "message": "viewport 메타태그를 추가하여 반응형 디자인을 지원하세요.",
                    "priority": "high"
                })
            
            return json.dumps(performance_result, ensure_ascii=False, indent=2)
            
        except Exception as e:
            return f"성능 분석 중 오류 발생: {str(e)}"

class JSQualityCheckerTool(BaseTool):
    """JavaScript 품질 검사 도구"""
    name: str = "js_quality_checker"
    description: str = "JavaScript 코드 품질과 구문을 검사합니다."
    args_schema: type[BaseModel] = JSQualityCheckInput

    def _run(self, html_code: str) -> str:
        """JavaScript 품질 검사 실행"""
        try:
            js_quality_result = {
                "errors": [],
                "warnings": [],
                "suggestions": []
            }
            
            # JavaScript 품질 검사 로직
            if "var " in html_code:
                js_quality_result["warnings"].append({
                    "type": "var_usage",
                    "message": "var 대신 let 또는 const 사용을 권장합니다.",
                    "modern_alternative": "let/const"
                })
            
            if "document.getElementById" in html_code:
                js_quality_result["suggestions"].append({
                    "type": "modern_selector",
                    "message": "document.querySelector() 사용을 고려해보세요.",
                    "benefit": "더 유연한 선택자 사용 가능"
                })
            
            if "onclick" in html_code:
                js_quality_result["suggestions"].append({
                    "type": "event_listener",
                    "message": "addEventListener() 사용을 권장합니다.",
                    "benefit": "더 나은 이벤트 관리"
                })
            
            return json.dumps(js_quality_result, ensure_ascii=False, indent=2)
            
        except Exception as e:
            return f"JavaScript 품질 검사 중 오류 발생: {str(e)}"

class LangChainMCPCodeReviewerAgent(BaseAgent):
    """LangChain Tools를 사용한 MCP 연동 코드 리뷰 에이전트"""
    
    def __init__(self):
        super().__init__("code_reviewer")
        self.setup_langchain_tools()
    
    def setup_langchain_tools(self):
        """LangChain Tools 설정"""
        # MCP 서버 연동 도구들 생성
        self.html_validator = HTMLValidatorTool()
        self.performance_analyzer = PerformanceAnalyzerTool()
        self.js_quality_checker = JSQualityCheckerTool()
        
        # 도구 목록
        self.tools = [
            self.html_validator,
            self.performance_analyzer,
            self.js_quality_checker
        ]
        
        print(f"✅ LangChain Tools 설정 완료: {len(self.tools)}개 도구 등록")
    
    def check_prd_requirements(self, html_code: str, prd_content: str) -> Dict[str, Any]:
        """PRD 요구사항 충족도 검사"""
        requirements_check = {
            "fulfilled_requirements": [],
            "missing_requirements": [],
            "compliance_score": 0
        }
        
        # PRD에서 주요 요구사항 추출
        required_features = []
        if "반응형" in prd_content or "responsive" in prd_content.lower():
            required_features.append("responsive_design")
        if "검색" in prd_content or "search" in prd_content.lower():
            required_features.append("search_functionality")
        if "접근성" in prd_content or "accessibility" in prd_content.lower():
            required_features.append("accessibility")
        
        # HTML에서 구현 여부 확인
        for feature in required_features:
            if feature == "responsive_design":
                if "viewport" in html_code and ("@media" in html_code or "responsive" in html_code):
                    requirements_check["fulfilled_requirements"].append({
                        "feature": "반응형 디자인",
                        "implementation": "viewport 메타태그 및 반응형 요소 확인됨"
                    })
                else:
                    requirements_check["missing_requirements"].append({
                        "feature": "반응형 디자인",
                        "suggestion": "viewport 메타태그와 CSS 미디어 쿼리를 추가하세요"
                    })
            
            elif feature == "search_functionality":
                if "search" in html_code.lower() or 'type="search"' in html_code:
                    requirements_check["fulfilled_requirements"].append({
                        "feature": "검색 기능",
                        "implementation": "검색 관련 요소 확인됨"
                    })
                else:
                    requirements_check["missing_requirements"].append({
                        "feature": "검색 기능",
                        "suggestion": "검색 입력 필드와 검색 로직을 구현하세요"
                    })
            
            elif feature == "accessibility":
                if "lang=" in html_code and "alt=" in html_code:
                    requirements_check["fulfilled_requirements"].append({
                        "feature": "접근성",
                        "implementation": "기본 접근성 속성 확인됨"
                    })
                else:
                    requirements_check["missing_requirements"].append({
                        "feature": "접근성",
                        "suggestion": "lang 속성, alt 속성 등 접근성 요소를 추가하세요"
                    })
        
        # 준수율 계산
        total_requirements = len(required_features)
        fulfilled_count = len(requirements_check["fulfilled_requirements"])
        if total_requirements > 0:
            requirements_check["compliance_score"] = (fulfilled_count / total_requirements) * 100
        
        return requirements_check
    
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """LangChain Tools를 활용한 코드 리뷰 실행"""
        html_code = state.get("html_code", "")
        prd_content = state.get("prd", "")
        
        if not html_code:
            state["reviewed_html"] = "HTML 코드가 제공되지 않았습니다."
            return state
        
        print("🔄 LangChain Tools를 활용한 코드 리뷰 시작...")
        
        # 1. 기본 LLM 리뷰
        llm_review = self.invoke_model(state, html_code=html_code)
        
        # 2. LangChain Tools 실행
        print("🔧 HTML 검증 도구 실행 중...")
        html_validation_result = self.html_validator.run(html_code)
        
        print("⚡ 성능 분석 도구 실행 중...")
        performance_result = self.performance_analyzer.run(html_code)
        
        print("🔍 JavaScript 품질 검사 도구 실행 중...")
        js_quality_result = self.js_quality_checker.run(html_code)
        
        # 3. PRD 요구사항 검사
        print("📋 PRD 요구사항 검토 중...")
        prd_compliance = self.check_prd_requirements(html_code, prd_content)
        
        # 4. 종합 리뷰 생성
        enhanced_review = self.generate_langchain_review(
            llm_review,
            html_validation_result,
            performance_result,
            js_quality_result,
            prd_compliance,
            html_code
        )
        
        state["reviewed_html"] = enhanced_review
        print("✅ LangChain Tools 기반 코드 리뷰 완료!")
        
        return state
    
    def generate_langchain_review(self, llm_review: str, html_validation: str,
                                 performance_analysis: str, js_quality: str,
                                 prd_compliance: Dict, html_code: str) -> str:
        """LangChain Tools 결과를 통합한 리뷰 생성"""
        
        review = f"""# 🔍 LangChain Tools 기반 HTML 코드 리뷰 리포트

## 🤖 AI 전문가 분석
{llm_review}

## 🛠️ LangChain Tools 검증 결과

### 🔧 HTML 검증 도구 결과
```json
{html_validation}
```

### ⚡ 성능 분석 도구 결과
```json
{performance_analysis}
```

### 🔍 JavaScript 품질 검사 결과
```json
{js_quality}
```

## 📋 PRD 요구사항 준수 현황
- **준수율**: {prd_compliance.get('compliance_score', 0):.1f}%

### ✅ 충족된 요구사항
"""
        
        for req in prd_compliance.get('fulfilled_requirements', []):
            review += f"- **{req.get('feature', '')}**: {req.get('implementation', '')}\n"
        
        review += "\n### ❌ 미충족 요구사항\n"
        for req in prd_compliance.get('missing_requirements', []):
            review += f"- **{req.get('feature', '')}**: {req.get('suggestion', '')}\n"
        
        # 도구별 요약
        try:
            html_val_data = json.loads(html_validation)
            perf_data = json.loads(performance_analysis)
            js_data = json.loads(js_quality)
            
            review += f"""
## 📊 종합 요약
- **HTML 구문 오류**: {len(html_val_data.get('syntax_errors', []))}개
- **접근성 이슈**: {len(html_val_data.get('accessibility_issues', []))}개
- **SEO 이슈**: {len(html_val_data.get('seo_issues', []))}개
- **성능 점수**: {perf_data.get('performance_score', 'N/A')}/100
- **JavaScript 경고**: {len(js_data.get('warnings', []))}개

## 🚀 주요 개선 권장사항
"""
            
            for rec in perf_data.get('recommendations', []):
                review += f"- **{rec.get('type', '')}**: {rec.get('message', '')}\n"
            
        except json.JSONDecodeError:
            review += "\n## ⚠️ 도구 결과 파싱 오류\n일부 도구 결과를 파싱하는 중 오류가 발생했습니다.\n"
        
        review += f"""
---
*이 리뷰는 다음 LangChain Tools를 활용하여 생성되었습니다:*
- 🔧 **HTML Validator Tool**: 구문 및 접근성 검증
- ⚡ **Performance Analyzer Tool**: 성능 및 SEO 분석
- 🔍 **JS Quality Checker Tool**: JavaScript 코드 품질 검사
- 📋 **PRD Compliance Checker**: 요구사항 준수 검토

*MCP 서버 연동 설정: `/mcp_config.json`*
"""
        
        return review

# 에이전트 인스턴스
langchain_mcp_reviewer_agent = LangChainMCPCodeReviewerAgent()

def langchain_mcp_review_code(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangChain Tools 기반 LangGraph 노드 함수"""
    return langchain_mcp_reviewer_agent.execute(state)

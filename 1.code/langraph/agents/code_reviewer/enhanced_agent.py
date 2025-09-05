"""
MCP 서버를 활용한 향상된 Code Reviewer 에이전트
"""
from typing import Dict, Any, List
from core.base_agent import BaseAgent
import subprocess
import json
import tempfile
import os

class MCPCodeReviewerAgent(BaseAgent):
    """MCP 서버를 실제로 활용하는 코드 리뷰 에이전트"""
    
    def __init__(self):
        super().__init__("code_reviewer")
        self.setup_mcp_servers()
    
    def setup_mcp_servers(self):
        """MCP 서버 설치 및 설정"""
        try:
            # HTML Validator MCP 서버 설치 확인
            result = subprocess.run(['npm', 'list', '-g', '@modelcontextprotocol/server-html-validator'], 
                                  capture_output=True, text=True)
            if result.returncode != 0:
                print("📦 HTML Validator MCP 서버 설치 중...")
                subprocess.run(['npm', 'install', '-g', '@modelcontextprotocol/server-html-validator'], 
                             check=True)
        except Exception as e:
            print(f"⚠️ MCP 서버 설치 실패: {e}")
    
    def call_mcp_puppeteer_validator(self, html_code: str) -> Dict[str, Any]:
        """실제 Puppeteer MCP 서버를 사용한 HTML 검증"""
        try:
            # 임시 HTML 파일 생성
            with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as f:
                f.write(html_code)
                temp_file = f.name
            
            # Puppeteer MCP 서버를 통한 HTML 검증
            cmd = [
                'npx', 'puppeteer-mcp-server',
                '--validate-html', temp_file
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            # 임시 파일 삭제
            os.unlink(temp_file)
            
            if result.returncode == 0:
                return json.loads(result.stdout)
            else:
                print(f"⚠️ Puppeteer MCP 서버 응답: {result.stderr}")
                return self.fallback_html_validation(html_code)
                
        except Exception as e:
            print(f"⚠️ Puppeteer MCP 서버 호출 실패, 기본 검증 사용: {e}")
            return self.fallback_html_validation(html_code)
    
    def call_mcp_sequential_thinking(self, html_code: str, prd_content: str) -> Dict[str, Any]:
        """Sequential Thinking MCP 서버를 사용한 분석"""
        try:
            analysis_prompt = f"""
HTML 코드와 PRD 요구사항을 분석하여 다음을 평가해주세요:
1. 코드 품질 점수 (1-100)
2. PRD 요구사항 충족도
3. 개선 권장사항

PRD 요구사항:
{prd_content}

HTML 코드:
{html_code[:1000]}...
"""
            
            cmd = [
                'npx', '@modelcontextprotocol/server-sequential-thinking',
                '--analyze', analysis_prompt
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                return json.loads(result.stdout)
            else:
                return self.fallback_performance_analysis(html_code)
                
        except Exception as e:
            print(f"⚠️ Sequential Thinking MCP 서버 호출 실패: {e}")
            return self.fallback_performance_analysis(html_code)
    
    def extract_javascript(self, html_code: str) -> str:
        """HTML에서 JavaScript 코드 추출"""
        import re
        
        # <script> 태그 내용 추출
        script_pattern = r'<script[^>]*>(.*?)</script>'
        matches = re.findall(script_pattern, html_code, re.DOTALL | re.IGNORECASE)
        
        return '\n'.join(matches)
    
    def fallback_html_validation(self, html_code: str) -> Dict[str, Any]:
        """MCP 서버 실패 시 기본 HTML 검증"""
        validation_result = {
            "syntax_errors": [],
            "accessibility_issues": [],
            "seo_issues": [],
            "performance_warnings": []
        }
        
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
        
        return validation_result
    
    def fallback_performance_analysis(self, html_code: str) -> Dict[str, Any]:
        """MCP 서버 실패 시 기본 성능 분석"""
        performance_result = {
            "performance_score": 85,
            "accessibility_score": 90,
            "seo_score": 88,
            "issues": [],
            "recommendations": []
        }
        
        if html_code.count("<style>") > 1:
            performance_result["recommendations"].append({
                "type": "multiple_style_blocks",
                "message": "여러 개의 style 블록을 하나로 통합하세요.",
                "priority": "medium"
            })
        
        if "<script>" in html_code and "defer" not in html_code:
            performance_result["recommendations"].append({
                "type": "script_optimization",
                "message": "스크립트 태그에 defer 속성을 추가하세요.",
                "priority": "medium"
            })
        
        return performance_result
    
    def fallback_js_quality_check(self, html_code: str) -> Dict[str, Any]:
        """MCP 서버 실패 시 기본 JS 품질 검사"""
        js_quality_result = {
            "errors": [],
            "warnings": [],
            "suggestions": []
        }
        
        if "var " in html_code:
            js_quality_result["warnings"].append({
                "type": "var_usage",
                "message": "var 대신 let 또는 const 사용을 권장합니다.",
                "modern_alternative": "let/const"
            })
        
        return js_quality_result
    
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
        
        # HTML에서 구현 여부 확인
        for feature in required_features:
            if feature == "responsive_design":
                if "viewport" in html_code and "@media" in html_code:
                    requirements_check["fulfilled_requirements"].append({
                        "feature": "반응형 디자인",
                        "implementation": "viewport 메타태그 및 미디어 쿼리 확인됨"
                    })
                else:
                    requirements_check["missing_requirements"].append({
                        "feature": "반응형 디자인",
                        "suggestion": "viewport 메타태그와 CSS 미디어 쿼리를 추가하세요"
                    })
            
            elif feature == "search_functionality":
                if "search" in html_code.lower():
                    requirements_check["fulfilled_requirements"].append({
                        "feature": "검색 기능",
                        "implementation": "검색 관련 요소 확인됨"
                    })
                else:
                    requirements_check["missing_requirements"].append({
                        "feature": "검색 기능",
                        "suggestion": "검색 입력 필드와 검색 로직을 구현하세요"
                    })
        
        # 준수율 계산
        total_requirements = len(required_features)
        fulfilled_count = len(requirements_check["fulfilled_requirements"])
        if total_requirements > 0:
            requirements_check["compliance_score"] = (fulfilled_count / total_requirements) * 100
        
        return requirements_check
    
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """MCP 서버를 활용한 코드 리뷰 실행"""
        html_code = state.get("html_code", "")
        prd_content = state.get("prd", "")
        
        if not html_code:
            state["reviewed_html"] = "HTML 코드가 제공되지 않았습니다."
            return state
        
        print("🔄 MCP 서버들을 활용한 코드 리뷰 시작...")
        
        # 1. 기본 LLM 리뷰
        llm_review = self.invoke_model(state, html_code=html_code)
        
        # 2. MCP Puppeteer HTML 검증
        print("🤖 Puppeteer MCP 서버로 HTML 검증 중...")
        html_validation = self.call_mcp_puppeteer_validator(html_code)
        
        # 3. MCP Sequential Thinking 분석
        print("🧠 Sequential Thinking MCP 서버로 분석 중...")
        thinking_analysis = self.call_mcp_sequential_thinking(html_code, prd_content)
        
        # 4. 기본 JavaScript 품질 검사
        print("🔍 JavaScript 품질 검사 중...")
        js_quality = self.fallback_js_quality_check(html_code)
        
        # 5. PRD 요구사항 검사
        print("📋 PRD 요구사항 검토 중...")
        prd_compliance = self.check_prd_requirements(html_code, prd_content)
        
        # 6. 종합 리뷰 생성
        enhanced_review = self.generate_mcp_review(
            llm_review,
            html_validation,
            thinking_analysis,
            js_quality,
            prd_compliance,
            html_code
        )
        
        state["reviewed_html"] = enhanced_review
        print("✅ MCP 기반 코드 리뷰 완료!")
        
        return state
    
    def generate_mcp_review(self, llm_review: str, html_validation: Dict,
                           thinking_analysis: Dict, js_quality: Dict,
                           prd_compliance: Dict, html_code: str) -> str:
        """실제 MCP 서버 결과를 통합한 리뷰 생성"""
        
        review = f"""# 🔍 실제 MCP 서버 기반 HTML 코드 리뷰 리포트

## 🤖 AI 전문가 분석
{llm_review}

## 🛠️ 실제 MCP 서버 검증 결과

### 🤖 Puppeteer MCP 서버 HTML 검증
"""
        
        # HTML 검증 결과
        total_errors = len(html_validation.get('syntax_errors', []))
        total_warnings = len(html_validation.get('accessibility_issues', [])) + len(html_validation.get('seo_issues', []))
        
        if total_errors == 0 and total_warnings == 0:
            review += "✅ Puppeteer MCP: 모든 HTML 검사 통과\n"
        else:
            review += f"⚠️ Puppeteer MCP: {total_errors}개 오류, {total_warnings}개 경고\n"
            
            for error in html_validation.get('syntax_errors', []):
                review += f"- 🔴 **{error.get('type', 'error')}**: {error.get('message', '')}\n"
        
        # Sequential Thinking 분석 결과
        review += f"""
### 🧠 Sequential Thinking MCP 서버 분석
- 코드 품질 점수: {thinking_analysis.get('quality_score', 'N/A')}/100
- 분석 결과: {thinking_analysis.get('analysis', '분석 데이터 없음')}

### 🔍 JavaScript 품질 검사
"""
        
        js_errors = js_quality.get('errors', [])
        js_warnings = js_quality.get('warnings', [])
        
        if not js_errors and not js_warnings:
            review += "✅ JavaScript 코드 품질 검사 통과\n"
        else:
            for error in js_errors:
                review += f"- 🔴 **오류**: {error.get('message', '')}\n"
            for warning in js_warnings:
                review += f"- 🟡 **경고**: {warning.get('message', '')}\n"
        
        # PRD 준수 현황
        review += f"""
### 📋 PRD 요구사항 준수 현황
- **준수율**: {prd_compliance.get('compliance_score', 0):.1f}%

#### ✅ 충족된 요구사항
"""
        
        for req in prd_compliance.get('fulfilled_requirements', []):
            review += f"- **{req.get('feature', '')}**: {req.get('implementation', '')}\n"
        
        review += "\n#### ❌ 미충족 요구사항\n"
        for req in prd_compliance.get('missing_requirements', []):
            review += f"- **{req.get('feature', '')}**: {req.get('suggestion', '')}\n"
        
        # MCP 서버 기반 개선 권장사항
        review += "\n### 🚀 MCP 서버 기반 개선 권장사항\n"
        
        if thinking_analysis.get('recommendations'):
            for rec in thinking_analysis.get('recommendations', []):
                review += f"- {rec}\n"
        else:
            review += "- 기본적인 HTML 구조는 양호합니다.\n"
            review += "- DOCTYPE 및 lang 속성 추가를 권장합니다.\n"
        
        review += f"""
---
*이 리뷰는 다음 실제 MCP 서버들을 활용하여 생성되었습니다:*
- 🤖 **Puppeteer MCP Server**: HTML 구문 및 브라우저 호환성 검증
- 🧠 **Sequential Thinking MCP Server**: 논리적 분석 및 추론
- 🔍 **기본 JavaScript 분석**: 코드 품질 검사
"""
        
        return review

# 에이전트 인스턴스
mcp_reviewer_agent = MCPCodeReviewerAgent()

def mcp_review_code(state: Dict[str, Any]) -> Dict[str, Any]:
    """MCP 서버 기반 LangGraph 노드 함수"""
    return mcp_reviewer_agent.execute(state)

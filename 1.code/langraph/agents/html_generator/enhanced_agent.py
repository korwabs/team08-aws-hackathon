"""
향상된 HTML 생성기 에이전트 - 기존 HTML 파일 참조 기능 포함
"""
from typing import Dict, Any
from core.base_agent import BaseAgent
from pathlib import Path

class EnhancedHTMLGeneratorAgent(BaseAgent):
    """기존 HTML 파일을 참조하는 향상된 HTML 생성 에이전트"""
    
    def __init__(self):
        super().__init__("html_generator")
    
    def load_existing_html_files(self) -> str:
        """기존 HTML 파일들 로드 및 내용 반환"""
        html_dir = Path("outputs/html_applications")
        
        if not html_dir.exists():
            return ""
        
        # .html 파일들 찾기
        html_files = list(html_dir.glob("*.html"))
        
        if not html_files:
            return ""
        
        existing_html_content = "\n\n## 기존 HTML 파일 내용\n"
        
        for html_file in html_files:
            if html_file.name != '.gitkeep':
                try:
                    with open(html_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    existing_html_content += f"\n### 파일: {html_file.name}\n"
                    existing_html_content += f"```html\n{content}\n```\n"
                    
                    print(f"📄 기존 HTML 파일 로드: {html_file.name} ({len(content)} 문자)")
                
                except Exception as e:
                    print(f"⚠️ HTML 파일 읽기 실패 ({html_file.name}): {e}")
                    continue
        
        if existing_html_content == "\n\n## 기존 HTML 파일 내용\n":
            return ""
        
        existing_html_content += "\n**지시사항**: 위의 기존 HTML 파일들을 참고하여 PRD 요구사항에 맞게 개선된 버전을 생성해주세요.\n"
        
        return existing_html_content
    
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """향상된 HTML 생성 실행"""
        prd = state.get("prd", "")
        
        # 1. 기존 HTML 파일들 로드
        existing_html_content = self.load_existing_html_files()
        
        # 2. 통합된 입력 데이터 구성
        enhanced_input = f"""
PRD 문서:
{prd}

{existing_html_content}

위의 PRD 요구사항을 기반으로 HTML 코드를 생성해주세요.
기존 HTML 파일이 있다면 해당 내용을 참고하여 개선된 버전을 만들어주세요.
"""
        
        # 3. 모델 호출하여 향상된 HTML 생성
        html_content = self.invoke_model(state, prd=enhanced_input.strip())
        
        # 4. 상태 업데이트
        state["html_code"] = html_content
        
        return state

# 에이전트 인스턴스
enhanced_html_agent = EnhancedHTMLGeneratorAgent()

def enhanced_generate_html(state: Dict[str, Any]) -> Dict[str, Any]:
    """향상된 LangGraph 노드 함수"""
    return enhanced_html_agent.execute(state)

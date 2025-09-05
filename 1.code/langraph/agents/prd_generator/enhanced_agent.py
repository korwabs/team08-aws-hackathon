"""
향상된 PRD 생성기 에이전트 - 기존 파일 참조 기능 포함
"""
from typing import Dict, Any
from core.base_agent import BaseAgent
from pathlib import Path
import os

class EnhancedPRDGeneratorAgent(BaseAgent):
    """기존 파일을 참조하는 향상된 PRD 생성 에이전트"""
    
    def __init__(self):
        super().__init__("prd_generator")
    
    def check_existing_prd_files(self) -> str:
        """기존 PRD 파일들 확인 및 내용 로드"""
        prd_dir = Path("outputs/prd_documents")
        
        if not prd_dir.exists():
            return ""
        
        # .md 파일들 찾기
        md_files = list(prd_dir.glob("*.md"))
        
        if not md_files:
            return ""
        
        # 가장 최근 파일 선택 (파일명 기준)
        latest_file = max(md_files, key=lambda f: f.stat().st_mtime)
        
        try:
            with open(latest_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            print(f"📋 기존 PRD 파일 발견: {latest_file.name}")
            return f"\n\n## 기존 PRD 문서 참조\n파일: {latest_file.name}\n\n{content}"
        
        except Exception as e:
            print(f"⚠️ PRD 파일 읽기 실패: {e}")
            return ""
    
    def check_existing_html_files(self) -> str:
        """기존 HTML 파일들 확인 및 경로 정보 생성"""
        html_dir = Path("outputs/html_applications")
        
        if not html_dir.exists():
            return ""
        
        # .html 파일들 찾기
        html_files = list(html_dir.glob("*.html"))
        
        if not html_files:
            return ""
        
        html_info = "\n\n## 기존 HTML 파일 참조\n"
        html_info += "**중요**: 아래 기존 HTML 파일들을 참고하여 업데이트된 버전을 생성해주세요.\n\n"
        
        for html_file in html_files:
            if html_file.name != '.gitkeep':
                file_size = html_file.stat().st_size
                html_info += f"- **파일**: `{html_file}`\n"
                html_info += f"  - 크기: {file_size} bytes\n"
                html_info += f"  - 이전 버전이므로 참고하여 개선된 버전 생성 필요\n\n"
        
        print(f"🌐 기존 HTML 파일 {len(html_files)}개 발견")
        return html_info
    
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """향상된 PRD 생성 실행"""
        input_data = state.get("input_data", "")
        
        # 1. 기존 PRD 파일들 확인
        existing_prd_content = self.check_existing_prd_files()
        
        # 2. 기존 HTML 파일들 확인
        existing_html_info = self.check_existing_html_files()
        
        # 3. 통합된 입력 데이터 구성
        enhanced_input = f"""
사용자 요청: {input_data}

{existing_prd_content}

{existing_html_info}

위의 기존 파일들을 참고하여 새로운 PRD를 생성하거나 기존 PRD를 업데이트해주세요.
기존 HTML 파일이 있다면 해당 파일의 경로를 명시하고 이를 참고하여 개선된 버전을 만들도록 지시해주세요.
"""
        
        # 4. 모델 호출하여 향상된 PRD 생성
        prd_content = self.invoke_model(state, input_data=enhanced_input.strip())
        
        # 5. 상태 업데이트
        state["prd"] = prd_content
        
        return state

# 에이전트 인스턴스
enhanced_prd_agent = EnhancedPRDGeneratorAgent()

def enhanced_generate_prd(state: Dict[str, Any]) -> Dict[str, Any]:
    """향상된 LangGraph 노드 함수"""
    return enhanced_prd_agent.execute(state)

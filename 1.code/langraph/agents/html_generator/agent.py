"""
HTML 생성기 에이전트
"""
from typing import Dict, Any
from core.base_agent import BaseAgent

class HTMLGeneratorAgent(BaseAgent):
    """HTML 코드 생성 에이전트"""
    
    def __init__(self):
        super().__init__("html_generator")
    
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """HTML 생성 실행"""
        prd = state.get("prd", "")
        
        # 모델 호출하여 HTML 생성
        html_content = self.invoke_model(state, prd=prd)
        
        # 상태 업데이트
        state["html_code"] = html_content
        
        return state

# 에이전트 인스턴스
html_agent = HTMLGeneratorAgent()

def generate_html(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph 노드 함수"""
    return html_agent.execute(state)

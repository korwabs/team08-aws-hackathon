"""
코드 리뷰어 에이전트
"""
from typing import Dict, Any
from core.base_agent import BaseAgent

class CodeReviewerAgent(BaseAgent):
    """코드 리뷰 에이전트"""
    
    def __init__(self):
        super().__init__("code_reviewer")
    
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """코드 리뷰 실행"""
        html_code = state.get("html_code", "")
        
        # 모델 호출하여 코드 리뷰
        reviewed_content = self.invoke_model(state, html_code=html_code)
        
        # 상태 업데이트
        state["reviewed_html"] = reviewed_content
        
        return state

# 에이전트 인스턴스
reviewer_agent = CodeReviewerAgent()

def review_code(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph 노드 함수"""
    return reviewer_agent.execute(state)

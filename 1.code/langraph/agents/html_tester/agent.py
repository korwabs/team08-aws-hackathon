"""
HTML 테스터 에이전트
"""
from typing import Dict, Any
from core.base_agent import BaseAgent

class HTMLTesterAgent(BaseAgent):
    """HTML 테스트 에이전트"""
    
    def __init__(self):
        super().__init__("html_tester")
    
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """HTML 테스트 실행"""
        reviewed_html = state.get("reviewed_html", "")
        
        # 모델 호출하여 테스트 수행
        test_result = self.invoke_model(state, reviewed_html=reviewed_html)
        
        # 상태 업데이트
        state["test_result"] = test_result
        
        return state

# 에이전트 인스턴스
tester_agent = HTMLTesterAgent()

def test_html(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph 노드 함수"""
    return tester_agent.execute(state)

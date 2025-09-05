"""
PRD 생성기 에이전트
"""
from typing import Dict, Any
from core.base_agent import BaseAgent

class PRDGeneratorAgent(BaseAgent):
    """Product Requirements Document 생성 에이전트"""
    
    def __init__(self):
        super().__init__("prd_generator")
    
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """PRD 생성 실행"""
        input_data = state.get("input_data", "")
        
        # 모델 호출하여 PRD 생성
        prd_content = self.invoke_model(state, input_data=input_data)
        
        # 상태 업데이트
        state["prd"] = prd_content
        
        return state

# 에이전트 인스턴스
prd_agent = PRDGeneratorAgent()

def generate_prd(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph 노드 함수"""
    return prd_agent.execute(state)

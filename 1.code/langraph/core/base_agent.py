"""
기본 에이전트 클래스 - 공통 기능 제공
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
import time
from langchain_core.messages import HumanMessage, SystemMessage
from .model_factory import model_factory
from .prompts import PromptTemplates
from .utils import StateLogger, PerformanceMonitor
from .config import config_manager

class BaseAgent(ABC):
    """모든 에이전트의 기본 클래스"""
    
    def __init__(self, agent_type: str):
        self.agent_type = agent_type
        self.model = model_factory.get_model()
        self.logger = StateLogger()
        self.monitor = PerformanceMonitor()
    
    def invoke_model(self, state: Dict[str, Any], **prompt_kwargs) -> str:
        """공통 모델 호출 메서드"""
        start_time = time.time()
        
        # 프롬프트 생성
        prompt = PromptTemplates.get_prompt(self.agent_type, **prompt_kwargs)
        
        # 메시지 구성
        messages = [
            SystemMessage(content="당신은 전문적인 AI 어시스턴트입니다."),
            HumanMessage(content=prompt)
        ]
        
        # 모델 호출
        response = self.model.invoke(messages)
        
        # 성능 로깅
        execution_time = time.time() - start_time
        input_size = len(prompt)
        output_size = len(response.content)
        
        log_message = self.logger.log_agent_execution(
            self.agent_type, input_size, output_size, execution_time
        )
        state["messages"].append(log_message)
        
        # 디버그 모드에서 상세 로그
        if config_manager.is_debug_mode():
            print(f"🤖 {log_message}")
        
        return response.content
    
    @abstractmethod
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """각 에이전트별 실행 로직 (추상 메서드)"""
        pass

"""
공통 모델 팩토리 - AWS Bedrock Claude 모델 중앙 관리
"""
from langchain_aws import ChatBedrock
from typing import Optional
from .config import config_manager

class ModelFactory:
    """AWS Bedrock 모델 팩토리 클래스 (싱글톤 패턴)"""
    
    _instance: Optional['ModelFactory'] = None
    _model: Optional[ChatBedrock] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_model(self) -> ChatBedrock:
        """공통 AWS Bedrock 모델 인스턴스 반환"""
        if self._model is None:
            model_kwargs = config_manager.get_model_kwargs()
            self._model = ChatBedrock(**model_kwargs)
            
            if config_manager.is_debug_mode():
                print(f"🔧 모델 초기화: {model_kwargs['model_id']}")
                
        return self._model
    
    def reset_model(self):
        """모델 인스턴스 재설정 (테스트용)"""
        self._model = None

# 싱글톤 인스턴스
model_factory = ModelFactory()

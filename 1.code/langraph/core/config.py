"""
설정 관리자 - 환경 변수 및 모델 설정 중앙 관리
"""
import os
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class ModelConfig:
    """모델 설정 클래스"""
    model_id: str
    region: str
    temperature: float = 0
    max_tokens: Optional[int] = None
    
    @classmethod
    def from_env(cls) -> 'ModelConfig':
        """환경 변수에서 설정 로드"""
        return cls(
            model_id=os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-opus-4-1-20250805-v1:0"),
            region=os.getenv("AWS_REGION", "us-east-1"),
            temperature=float(os.getenv("MODEL_TEMPERATURE", "0")),
            max_tokens=int(os.getenv("MAX_TOKENS")) if os.getenv("MAX_TOKENS") else None
        )

class ConfigManager:
    """설정 관리자 클래스"""
    
    def __init__(self):
        self.model_config = ModelConfig.from_env()
        self._validate_config()
    
    def _validate_config(self):
        """설정 유효성 검사"""
        required_env_vars = ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]
        missing_vars = [var for var in required_env_vars if not os.getenv(var)]
        
        if missing_vars:
            raise ValueError(f"필수 환경 변수가 누락되었습니다: {missing_vars}")
    
    def get_model_kwargs(self) -> Dict[str, Any]:
        """모델 초기화 인자 반환"""
        kwargs = {
            "model_id": self.model_config.model_id,
            "region_name": self.model_config.region,
            "temperature": self.model_config.temperature
        }
        
        if self.model_config.max_tokens:
            kwargs["max_tokens"] = self.model_config.max_tokens
            
        return kwargs
    
    def is_debug_mode(self) -> bool:
        """디버그 모드 확인"""
        return os.getenv("DEBUG", "false").lower() == "true"

# 전역 설정 인스턴스
config_manager = ConfigManager()

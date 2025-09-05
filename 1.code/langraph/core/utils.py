"""
공통 유틸리티 함수들
"""
from typing import Dict, Any, List
import json
import time
from datetime import datetime

class StateLogger:
    """상태 로깅 유틸리티"""
    
    @staticmethod
    def log_agent_execution(agent_name: str, input_size: int, output_size: int, 
                          execution_time: float) -> str:
        """에이전트 실행 로그 생성"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        return (f"[{timestamp}] {agent_name}: "
                f"입력 {input_size}자 → 출력 {output_size}자 "
                f"({execution_time:.2f}초)")
    
    @staticmethod
    def log_workflow_summary(state: Dict[str, Any]) -> str:
        """워크플로우 요약 로그 생성"""
        summary = {
            "prd_length": len(state.get("prd", "")),
            "html_length": len(state.get("html_code", "")),
            "review_length": len(state.get("reviewed_html", "")),
            "test_length": len(state.get("test_result", "")),
            "total_messages": len(state.get("messages", []))
        }
        return f"워크플로우 완료: {json.dumps(summary, ensure_ascii=False)}"

class ValidationUtils:
    """검증 유틸리티"""
    
    @staticmethod
    def validate_state_fields(state: Dict[str, Any], required_fields: List[str]) -> bool:
        """상태 필드 유효성 검사"""
        missing_fields = [field for field in required_fields if not state.get(field)]
        if missing_fields:
            raise ValueError(f"필수 상태 필드가 누락되었습니다: {missing_fields}")
        return True
    
    @staticmethod
    def validate_html_content(html_content: str) -> bool:
        """HTML 콘텐츠 기본 검증"""
        required_tags = ["<html", "<head", "<body"]
        return all(tag in html_content.lower() for tag in required_tags)

class PerformanceMonitor:
    """성능 모니터링 유틸리티"""
    
    def __init__(self):
        self.start_time = None
        self.checkpoints = {}
    
    def start(self):
        """모니터링 시작"""
        self.start_time = time.time()
        return self
    
    def checkpoint(self, name: str):
        """체크포인트 기록"""
        if self.start_time:
            self.checkpoints[name] = time.time() - self.start_time
    
    def get_summary(self) -> Dict[str, float]:
        """성능 요약 반환"""
        return self.checkpoints.copy()

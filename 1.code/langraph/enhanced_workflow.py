"""
Context7 + Sequential MCP Server를 활용한 개선된 워크플로우
"""
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import RetryPolicy
from typing import TypedDict, List, Optional
import os
import json
import time
from pathlib import Path

# 환경 변수 로드
load_dotenv()

class EnhancedAgentState(TypedDict):
    """개선된 에이전트 상태 정의"""
    input_data: str
    prd: str
    html_code: str
    reviewed_html: str
    test_result: str
    messages: List[str]
    # 추가: 체크포인트 및 에러 핸들링
    current_step: str
    step_results: dict
    error_count: int
    retry_attempts: dict

class EnhancedWorkflow:
    """Context7 + Sequential MCP Server 활용 개선된 워크플로우"""
    
    def __init__(self):
        # 체크포인터 설정 (메모리 기반)
        self.checkpointer = InMemorySaver()
        
        # 재시도 정책 설정
        self.retry_policy = RetryPolicy(
            retry_on=Exception,  # 모든 예외에 대해 재시도
            max_attempts=3,      # 최대 3회 재시도
            backoff_factor=2.0   # 지수 백오프
        )
        
        # 결과 저장 디렉토리
        self.results_dir = Path("test_results/enhanced")
        self.results_dir.mkdir(parents=True, exist_ok=True)
    
    def save_checkpoint(self, state: EnhancedAgentState, step: str):
        """중간 결과 체크포인트 저장"""
        checkpoint_file = self.results_dir / f"checkpoint_{step}.json"
        
        # 상태를 JSON으로 직렬화 가능한 형태로 변환
        checkpoint_data = {
            "step": step,
            "timestamp": time.time(),
            "state": {
                "input_data": state.get("input_data", ""),
                "prd": state.get("prd", ""),
                "html_code": state.get("html_code", ""),
                "reviewed_html": state.get("reviewed_html", ""),
                "test_result": state.get("test_result", ""),
                "current_step": step,
                "step_results": state.get("step_results", {}),
                "error_count": state.get("error_count", 0)
            }
        }
        
        with open(checkpoint_file, 'w', encoding='utf-8') as f:
            json.dump(checkpoint_data, f, ensure_ascii=False, indent=2)
        
        print(f"💾 체크포인트 저장: {checkpoint_file}")
    
    def load_checkpoint(self, step: str) -> Optional[dict]:
        """체크포인트에서 상태 복원"""
        checkpoint_file = self.results_dir / f"checkpoint_{step}.json"
        
        if checkpoint_file.exists():
            with open(checkpoint_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    
    def enhanced_prd_generator(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """개선된 PRD 생성기 (에러 핸들링 + 체크포인팅)"""
        step = "prd_generator"
        state["current_step"] = step
        
        try:
            # 체크포인트 확인
            checkpoint = self.load_checkpoint(step)
            if checkpoint and checkpoint["state"].get("prd"):
                print(f"📂 {step} 체크포인트에서 복원")
                state.update(checkpoint["state"])
                return state
            
            # PRD 생성 실행
            from agents.prd_generator.agent import generate_prd
            
            print(f"🔄 {step} 실행 중...")
            start_time = time.time()
            
            result_state = generate_prd(state)
            
            execution_time = time.time() - start_time
            print(f"✅ {step} 완료 ({execution_time:.2f}초)")
            
            # 결과 저장
            state.update(result_state)
            state["step_results"][step] = {
                "success": True,
                "execution_time": execution_time,
                "output_length": len(state.get("prd", ""))
            }
            
            # 체크포인트 저장
            self.save_checkpoint(state, step)
            
            return state
            
        except Exception as e:
            error_count = state.get("error_count", 0) + 1
            state["error_count"] = error_count
            
            print(f"❌ {step} 실행 중 오류: {e}")
            
            if error_count < 3:  # 최대 3회 재시도
                print(f"🔄 재시도 {error_count}/3")
                time.sleep(2 ** error_count)  # 지수 백오프
                return self.enhanced_prd_generator(state)
            else:
                raise Exception(f"{step} 최대 재시도 횟수 초과: {e}")
    
    def enhanced_html_generator(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """개선된 HTML 생성기"""
        step = "html_generator"
        state["current_step"] = step
        
        try:
            # 이전 단계 결과 검증
            if not state.get("prd"):
                raise ValueError("PRD가 생성되지 않았습니다.")
            
            # 체크포인트 확인
            checkpoint = self.load_checkpoint(step)
            if checkpoint and checkpoint["state"].get("html_code"):
                print(f"📂 {step} 체크포인트에서 복원")
                state.update(checkpoint["state"])
                return state
            
            from agents.html_generator.agent import generate_html
            
            print(f"🔄 {step} 실행 중...")
            start_time = time.time()
            
            result_state = generate_html(state)
            
            execution_time = time.time() - start_time
            print(f"✅ {step} 완료 ({execution_time:.2f}초)")
            
            state.update(result_state)
            state["step_results"][step] = {
                "success": True,
                "execution_time": execution_time,
                "output_length": len(state.get("html_code", ""))
            }
            
            self.save_checkpoint(state, step)
            return state
            
        except Exception as e:
            error_count = state.get("error_count", 0) + 1
            state["error_count"] = error_count
            
            print(f"❌ {step} 실행 중 오류: {e}")
            
            if error_count < 3:
                print(f"🔄 재시도 {error_count}/3")
                time.sleep(2 ** error_count)
                return self.enhanced_html_generator(state)
            else:
                raise Exception(f"{step} 최대 재시도 횟수 초과: {e}")
    
    def enhanced_code_reviewer(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """개선된 코드 리뷰어"""
        step = "code_reviewer"
        state["current_step"] = step
        
        try:
            if not state.get("html_code"):
                raise ValueError("HTML 코드가 생성되지 않았습니다.")
            
            checkpoint = self.load_checkpoint(step)
            if checkpoint and checkpoint["state"].get("reviewed_html"):
                print(f"📂 {step} 체크포인트에서 복원")
                state.update(checkpoint["state"])
                return state
            
            from agents.code_reviewer.agent import review_code
            
            print(f"🔄 {step} 실행 중...")
            start_time = time.time()
            
            result_state = review_code(state)
            
            execution_time = time.time() - start_time
            print(f"✅ {step} 완료 ({execution_time:.2f}초)")
            
            state.update(result_state)
            state["step_results"][step] = {
                "success": True,
                "execution_time": execution_time,
                "output_length": len(state.get("reviewed_html", ""))
            }
            
            self.save_checkpoint(state, step)
            return state
            
        except Exception as e:
            error_count = state.get("error_count", 0) + 1
            state["error_count"] = error_count
            
            print(f"❌ {step} 실행 중 오류: {e}")
            
            if error_count < 3:
                print(f"🔄 재시도 {error_count}/3")
                time.sleep(2 ** error_count)
                return self.enhanced_code_reviewer(state)
            else:
                raise Exception(f"{step} 최대 재시도 횟수 초과: {e}")
    
    def enhanced_html_tester(self, state: EnhancedAgentState) -> EnhancedAgentState:
        """개선된 HTML 테스터"""
        step = "html_tester"
        state["current_step"] = step
        
        try:
            if not state.get("reviewed_html"):
                raise ValueError("리뷰된 HTML이 없습니다.")
            
            checkpoint = self.load_checkpoint(step)
            if checkpoint and checkpoint["state"].get("test_result"):
                print(f"📂 {step} 체크포인트에서 복원")
                state.update(checkpoint["state"])
                return state
            
            from agents.html_tester.agent import test_html
            
            print(f"🔄 {step} 실행 중...")
            start_time = time.time()
            
            result_state = test_html(state)
            
            execution_time = time.time() - start_time
            print(f"✅ {step} 완료 ({execution_time:.2f}초)")
            
            state.update(result_state)
            state["step_results"][step] = {
                "success": True,
                "execution_time": execution_time,
                "output_length": len(state.get("test_result", ""))
            }
            
            self.save_checkpoint(state, step)
            return state
            
        except Exception as e:
            error_count = state.get("error_count", 0) + 1
            state["error_count"] = error_count
            
            print(f"❌ {step} 실행 중 오류: {e}")
            
            if error_count < 3:
                print(f"🔄 재시도 {error_count}/3")
                time.sleep(2 ** error_count)
                return self.enhanced_html_tester(state)
            else:
                raise Exception(f"{step} 최대 재시도 횟수 초과: {e}")
    
    def create_enhanced_workflow(self):
        """개선된 워크플로우 생성"""
        workflow = StateGraph(EnhancedAgentState)
        
        # 개선된 노드들 추가
        workflow.add_node("prd_generator", self.enhanced_prd_generator)
        workflow.add_node("html_generator", self.enhanced_html_generator)
        workflow.add_node("code_reviewer", self.enhanced_code_reviewer)
        workflow.add_node("html_tester", self.enhanced_html_tester)
        
        # 순차적 연결
        workflow.add_edge(START, "prd_generator")
        workflow.add_edge("prd_generator", "html_generator")
        workflow.add_edge("html_generator", "code_reviewer")
        workflow.add_edge("code_reviewer", "html_tester")
        workflow.add_edge("html_tester", END)
        
        return workflow.compile(checkpointer=self.checkpointer)
    
    def run_enhanced_workflow(self, input_data: str, thread_id: str = "enhanced_workflow"):
        """개선된 워크플로우 실행"""
        print("🚀 개선된 워크플로우 시작")
        
        # 초기 상태 설정
        initial_state = {
            "input_data": input_data,
            "prd": "",
            "html_code": "",
            "reviewed_html": "",
            "test_result": "",
            "messages": [],
            "current_step": "",
            "step_results": {},
            "error_count": 0,
            "retry_attempts": {}
        }
        
        # 설정
        config = {
            "configurable": {
                "thread_id": thread_id
            }
        }
        
        workflow = self.create_enhanced_workflow()
        
        try:
            total_start_time = time.time()
            
            # 워크플로우 실행
            result = workflow.invoke(initial_state, config=config)
            
            total_execution_time = time.time() - total_start_time
            
            # 최종 결과 리포트
            self.generate_final_report(result, total_execution_time)
            
            return result
            
        except Exception as e:
            print(f"❌ 워크플로우 실행 실패: {e}")
            
            # 실패 시 복구 시도
            print("🔄 체크포인트에서 복구 시도...")
            try:
                # None을 전달하여 체크포인트에서 재개
                result = workflow.invoke(None, config=config)
                return result
            except Exception as recovery_error:
                print(f"❌ 복구 실패: {recovery_error}")
                raise
    
    def generate_final_report(self, result: dict, total_time: float):
        """최종 실행 리포트 생성"""
        report = {
            "execution_summary": {
                "total_time": total_time,
                "success": True,
                "steps_completed": len(result.get("step_results", {}))
            },
            "step_details": result.get("step_results", {}),
            "output_sizes": {
                "prd": len(result.get("prd", "")),
                "html_code": len(result.get("html_code", "")),
                "reviewed_html": len(result.get("reviewed_html", "")),
                "test_result": len(result.get("test_result", ""))
            },
            "error_count": result.get("error_count", 0)
        }
        
        report_file = self.results_dir / "execution_report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"\n📊 실행 리포트:")
        print(f"   총 실행 시간: {total_time:.2f}초")
        print(f"   완료된 단계: {report['execution_summary']['steps_completed']}/4")
        print(f"   총 오류 횟수: {report['error_count']}")
        print(f"   리포트 저장: {report_file}")

def main():
    """메인 실행 함수"""
    enhanced_workflow = EnhancedWorkflow()
    
    test_input = """
    여성 의류 쇼핑몰 메인 페이지를 만들어주세요.
    
    요구사항:
    - 반응형 디자인
    - 상품 그리드 레이아웃  
    - 검색 기능
    - 장바구니 기능
    - 깔끔하고 모던한 디자인
    """
    
    result = enhanced_workflow.run_enhanced_workflow(test_input.strip())
    return result

if __name__ == "__main__":
    main()

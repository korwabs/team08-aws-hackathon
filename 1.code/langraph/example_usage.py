"""
사용 예제 스크립트
"""
from main import create_workflow
from core.utils import PerformanceMonitor
import json

def run_example():
    """예제 실행"""
    print("🎯 LangGraph 에이전트 워크플로우 예제 실행")
    
    # 성능 모니터링 시작
    monitor = PerformanceMonitor().start()
    
    # 워크플로우 생성
    workflow = create_workflow()
    monitor.checkpoint("workflow_creation")
    
    # 테스트 케이스들
    test_cases = [
        {
            "name": "음성 기반 HTML 생성 서비스",
            "input_data": "사용자가 음성으로 요청하면 실시간으로 HTML 데모 페이지를 생성하는 웹 서비스"
        },
        {
            "name": "AI 챗봇 인터페이스",
            "input_data": "사용자와 자연어로 대화할 수 있는 AI 챗봇 웹 인터페이스"
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📋 테스트 케이스 {i}: {test_case['name']}")
        
        # 초기 상태 설정
        initial_state = {
            "input_data": test_case["input_data"],
            "prd": "",
            "html_code": "",
            "reviewed_html": "",
            "test_result": "",
            "messages": []
        }
        
        try:
            # 워크플로우 실행
            result = workflow.invoke(initial_state)
            monitor.checkpoint(f"test_case_{i}")
            
            # 결과 요약
            summary = {
                "test_case": test_case["name"],
                "prd_length": len(result.get("prd", "")),
                "html_length": len(result.get("html_code", "")),
                "review_length": len(result.get("reviewed_html", "")),
                "test_length": len(result.get("test_result", "")),
                "message_count": len(result.get("messages", []))
            }
            
            results.append(summary)
            print(f"✅ 완료: {json.dumps(summary, ensure_ascii=False, indent=2)}")
            
        except Exception as e:
            print(f"❌ 오류 발생: {e}")
            results.append({"test_case": test_case["name"], "error": str(e)})
    
    # 성능 요약
    performance = monitor.get_summary()
    print(f"\n⏱️ 성능 요약: {json.dumps(performance, indent=2)}")
    
    return results

if __name__ == "__main__":
    run_example()

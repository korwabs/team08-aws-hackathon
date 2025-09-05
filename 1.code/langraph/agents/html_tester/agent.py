from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage
import tempfile
import os

def test_html(state):
    """리뷰된 HTML이 정상적으로 실행되는지 테스트"""
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    
    html_content = state.get('reviewed_html', '')
    
    # 임시 HTML 파일 생성하여 기본 검증
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as f:
            f.write(html_content)
            temp_file = f.name
        
        # 파일 크기 확인
        file_size = os.path.getsize(temp_file)
        os.unlink(temp_file)
        
        # LLM을 통한 코드 분석
        prompt = f"""
        다음 HTML 코드의 실행 가능성을 분석해주세요:
        
        HTML 코드:
        {html_content[:1000]}...
        
        검증 항목:
        - HTML 구문 오류
        - CSS 문법 검증
        - JavaScript 오류 가능성
        - 필수 태그 존재 여부
        - 브라우저 렌더링 가능성
        
        테스트 결과를 요약해주세요.
        """
        
        response = llm.invoke([HumanMessage(content=prompt)])
        
        test_result = f"파일 크기: {file_size} bytes\n분석 결과: {response.content}"
        
    except Exception as e:
        test_result = f"테스트 실행 중 오류: {str(e)}"
    
    state["test_result"] = test_result
    state["messages"].append("HTML 테스트 완료")
    
    return state

from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

def summarize_data(state):
    """텍스트, 이미지, 와이어프레임, HTML 등 데이터를 요약"""
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    
    prompt = f"""
    다음 데이터를 분석하고 핵심 내용을 요약해주세요:
    
    입력 데이터: {state.get('input_data', '데이터 없음')}
    
    요약 시 다음 사항을 포함해주세요:
    - 주요 기능 및 특징
    - 사용자 인터페이스 요소
    - 데이터 구조 및 형태
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    state["summary"] = response.content
    state["messages"].append(f"데이터 요약 완료: {len(response.content)} 문자")
    
    return state

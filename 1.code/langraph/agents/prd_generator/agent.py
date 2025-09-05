from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

def generate_prd(state):
    """Product Requirements Document 생성"""
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    
    prompt = f"""
    다음 요약 정보를 바탕으로 Product Requirements Document(PRD)를 작성해주세요:
    
    요약 정보: {state.get('summary', '')}
    
    PRD에 포함할 내용:
    1. 제품 개요
    2. 기능 요구사항
    3. 사용자 스토리
    4. 기술적 요구사항
    5. UI/UX 가이드라인
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    state["prd"] = response.content
    state["messages"].append(f"PRD 생성 완료: {len(response.content)} 문자")
    
    return state

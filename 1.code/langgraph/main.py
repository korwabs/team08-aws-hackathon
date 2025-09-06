from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from prd_agent import PRDAgent
from html_agent import HTMLAgent
from openai_client import OpenAIClient
from workflow import Workflow
import os

app = FastAPI(title="PRD & HTML Generator API", version="1.0.0")

# CORS 설정 (HTML에서 API 호출을 위해)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# OpenAI 클라이언트 초기화
openai_client = OpenAIClient()

# 워크플로우 초기화
workflow = Workflow()

# PRD 관련 모델
class PRDRequest(BaseModel):
    conversation_summary: str
    prd_url: Optional[str] = None
    image_url: Optional[str] = None
    html_url: Optional[str] = None

class PRDResponse(BaseModel):
    success: bool
    file_path: str
    message: str

# HTML 관련 모델
class HTMLRequest(BaseModel):
    prd_file_path: str
    llm_api_url: str = "http://localhost:8000/llm"

class HTMLResponse(BaseModel):
    success: bool
    file_path: str
    message: str

# 워크플로우 모델
class WorkflowResponse(BaseModel):
    success: bool
    prd_file: str
    html_file: str
    message: str

# LLM 호출 모델
class LLMRequest(BaseModel):
    prompt: str

class LLMResponse(BaseModel):
    response: str

# 워크플로우 API 엔드포인트 (PRD → HTML 자동 생성)
@app.post("/workflow", response_model=WorkflowResponse)
async def run_workflow(request: PRDRequest):
    try:
        result = workflow.run_complete_workflow(
            conversation_summary=request.conversation_summary,
            prd_url=request.prd_url,
            image_url=request.image_url,
            html_url=request.html_url
        )
        
        # Node.js 서버로 파일 업로드 요청
        await upload_files_to_nodejs(result['prd_file'], result['html_file'])
        
        return WorkflowResponse(
            success=result['success'],
            prd_file=result['prd_file'],
            html_file=result['html_file'],
            message=result['message']
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"워크플로우 실행 중 오류 발생: {str(e)}")

async def upload_files_to_nodejs(prd_file_path: str, html_file_path: str):
    """생성된 파일들을 Node.js 서버로 업로드"""
    import aiohttp
    import os
    
    nodejs_url = os.getenv('NODEJS_URL', 'http://localhost:3000')
    
    try:
        # 파일 내용 읽기
        with open(prd_file_path, 'r', encoding='utf-8') as f:
            prd_content = f.read()
        with open(html_file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        async with aiohttp.ClientSession() as session:
            # PRD 파일 업로드
            prd_data = {
                'content': prd_content,
                'filename': os.path.basename(prd_file_path),
                'contentType': 'text/markdown'
            }
            
            async with session.post(f'{nodejs_url}/api/upload-file', json=prd_data) as response:
                if response.status == 200:
                    print(f"PRD 파일 업로드 성공: {prd_file_path}")
                else:
                    print(f"PRD 파일 업로드 실패: {response.status}")
            
            # HTML 파일 업로드
            html_data = {
                'content': html_content,
                'filename': os.path.basename(html_file_path),
                'contentType': 'text/html'
            }
            
            async with session.post(f'{nodejs_url}/api/upload-file', json=html_data) as response:
                if response.status == 200:
                    print(f"HTML 파일 업로드 성공: {html_file_path}")
                else:
                    print(f"HTML 파일 업로드 실패: {response.status}")
        
        # 로컬 파일 삭제 (TODO 항목)
        try:
            os.unlink(prd_file_path)
            os.unlink(html_file_path)
            print(f"로컬 파일 삭제 완료: {prd_file_path}, {html_file_path}")
        except Exception as e:
            print(f"파일 삭제 실패: {e}")
            
    except Exception as e:
        print(f"Node.js 업로드 오류: {e}")
        # 업로드 실패해도 워크플로우는 계속 진행

# LLM API 엔드포인트 (HTML에서 호출용)
@app.post("/llm", response_model=LLMResponse)
async def call_llm(request: LLMRequest):
    try:
        print(f"LLM API 호출 시작: {request.prompt[:50]}...")
        content = openai_client.generate_text(request.prompt)
        print(f"LLM API 응답 완료: {len(content)} 문자")
        return LLMResponse(response=content)
    except Exception as e:
        print(f"LLM API 오류: {e}")
        # 에러시에도 유용한 더미 데이터 반환
        dummy_response = openai_client._get_dummy_response(request.prompt)
        return LLMResponse(response=dummy_response)

@app.options("/llm")
async def llm_options():
    return {"message": "OK"}

# PRD API 엔드포인트
@app.post("/generate-prd", response_model=PRDResponse)
async def generate_prd(request: PRDRequest):
    try:
        agent = PRDAgent()
        prd_file = agent.generate_prd(
            conversation_summary=request.conversation_summary,
            prd_url=request.prd_url,
            image_url=request.image_url,
            html_url=request.html_url
        )
        
        return PRDResponse(
            success=True,
            file_path=prd_file,
            message="PRD 파일이 성공적으로 생성되었습니다."
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PRD 생성 중 오류 발생: {str(e)}")

@app.get("/prd/{filename}")
async def get_prd_content(filename: str):
    try:
        file_path = os.path.join("prd_outputs", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="PRD 파일을 찾을 수 없습니다.")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return {"filename": filename, "content": content}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 읽기 오류: {str(e)}")

# HTML API 엔드포인트
@app.post("/generate-html", response_model=HTMLResponse)
async def generate_html(request: HTMLRequest):
    try:
        if not os.path.exists(request.prd_file_path):
            raise HTTPException(status_code=404, detail="PRD 파일을 찾을 수 없습니다.")
        
        agent = HTMLAgent(request.llm_api_url)
        output_file = agent.generate_html(request.prd_file_path)
        
        return HTMLResponse(
            success=True,
            file_path=output_file,
            message="HTML 파일이 성공적으로 생성되었습니다."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/html/{filename}")
async def get_html_file(filename: str):
    file_path = f"html_outputs/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="HTML 파일을 찾을 수 없습니다.")
    
    return FileResponse(file_path, media_type="text/html")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": ["PRD Generator", "HTML Generator", "LLM API"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

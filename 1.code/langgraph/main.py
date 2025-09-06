from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from prd_agent import PRDAgent
import os

app = FastAPI(title="PRD Generator API", version="1.0.0")

class PRDRequest(BaseModel):
    conversation_summary: str
    prd_url: Optional[str] = None
    image_url: Optional[str] = None
    html_url: Optional[str] = None

class PRDResponse(BaseModel):
    success: bool
    file_path: str
    message: str

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

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

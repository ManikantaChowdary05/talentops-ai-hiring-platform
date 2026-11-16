from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.llm_engine import llm_engine
from backend.app.schemas.schemas import CopilotQueryRequest

router = APIRouter(prefix="/copilot", tags=["AI Recruitment Copilot"])

@router.post("/query")
def ask_recruitment_copilot(data: CopilotQueryRequest, db: Session = Depends(get_db)):
    """
    Intelligent natural language query interface for TalentFlow 360 platform.
    """
    result = llm_engine.chat_copilot(query=data.query, context=data.context)
    return result

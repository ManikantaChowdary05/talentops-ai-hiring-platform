from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.core.audit import log_audit_event
from backend.app.core.llm_engine import llm_engine
from backend.app.models.entities import ExceptionLog, User
from backend.app.schemas.schemas import ExceptionResponse, ExceptionResolveRequest

router = APIRouter(prefix="/exceptions", tags=["Exception Management"])

@router.get("", response_model=List[ExceptionResponse])
def get_exceptions(
    severity: Optional[str] = None,
    resolution_status: Optional[str] = None,
    issue_type: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(ExceptionLog)
    if severity and severity != "All":
        query = query.filter(ExceptionLog.severity == severity)
    if resolution_status and resolution_status != "All":
        query = query.filter(ExceptionLog.resolution_status == resolution_status)
    if issue_type and issue_type != "All":
        query = query.filter(ExceptionLog.issue_type == issue_type)

    return query.order_by(ExceptionLog.created_at.desc()).offset(offset).limit(limit).all()

@router.patch("/{exception_id}/resolve", response_model=ExceptionResponse)
def resolve_exception(
    exception_id: str,
    data: ExceptionResolveRequest,
    current_user: User = Depends(require_roles(["IT / Operations Partner", "HR Partner", "System Administrator"])),
    db: Session = Depends(get_db)
):
    exc = db.query(ExceptionLog).filter(ExceptionLog.exception_id == exception_id).first()
    if not exc:
        raise HTTPException(status_code=404, detail="Exception not found")

    old_status = exc.resolution_status
    exc.resolution_status = data.resolution_status
    exc.comments = f"{exc.comments or ''}\n[{data.resolution_status} by {current_user.full_name}]: {data.comments}"
    if data.resolution_status in ["Resolved", "Dismissed"]:
        exc.resolved_at = datetime.utcnow()

    log_audit_event(
        db=db,
        action="EXCEPTION_RESOLVED",
        entity="ExceptionLog",
        entity_id=exception_id,
        previous_value={"status": old_status},
        new_value={"status": data.resolution_status, "comments": data.comments},
        user_id=current_user.user_id,
        reason=data.comments
    )

    db.commit()
    db.refresh(exc)
    return exc

@router.get("/{exception_id}/ai-diagnosis")
def get_ai_exception_diagnosis(exception_id: str, db: Session = Depends(get_db)):
    """
    Intelligent LLM-powered root cause analysis, business risk evaluation, and step-by-step remediation guide.
    """
    exc = db.query(ExceptionLog).filter(ExceptionLog.exception_id == exception_id).first()
    if not exc:
        raise HTTPException(status_code=404, detail="Exception not found")

    exc_dict = {
        "exception_id": exc.exception_id,
        "issue_type": exc.issue_type,
        "entity_type": exc.entity_type,
        "entity_id": exc.entity_id,
        "severity": exc.severity,
        "detected_rule_id": exc.detected_rule_id,
        "actual_decision": exc.actual_decision
    }
    diagnosis = llm_engine.explain_exception_and_recommend(exc_dict)
    return diagnosis

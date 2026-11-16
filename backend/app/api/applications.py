from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.core.audit import log_audit_event
from backend.app.core.rules_engine import rules_engine
from backend.app.models.entities import (
    Application, ApplicationStageHistory, Requisition, Candidate, 
    Scorecard, Interview, User
)
from backend.app.schemas.schemas import (
    ApplicationCreate, StageTransitionRequest, ApplicationResponse, StageHistoryResponse
)

router = APIRouter(prefix="/applications", tags=["Application Tracking"])

@router.get("", response_model=List[ApplicationResponse])
def get_applications(
    stage: Optional[str] = None,
    requisition_id: Optional[str] = None,
    candidate_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Application).join(Candidate).join(Requisition)
    if stage and stage != "All":
        query = query.filter(Application.current_stage == stage)
    if requisition_id and requisition_id != "All":
        query = query.filter(Application.requisition_id == requisition_id)
    if candidate_id:
        query = query.filter(Application.candidate_id == candidate_id)
    if search:
        query = query.filter(
            (Candidate.full_name.ilike(f"%{search}%")) |
            (Requisition.job_title.ilike(f"%{search}%")) |
            (Application.application_id.ilike(f"%{search}%"))
        )

    apps = query.order_by(Application.applied_date.desc()).offset(offset).limit(limit).all()
    result = []
    for a in apps:
        resp = ApplicationResponse.from_orm(a)
        resp.candidate_name = a.candidate.full_name if a.candidate else "N/A"
        resp.job_title = a.requisition.job_title if a.requisition else "N/A"
        resp.department = a.requisition.department if a.requisition else "N/A"
        result.append(resp)
    return result

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(application_id: str, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.application_id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    resp = ApplicationResponse.from_orm(app)
    resp.candidate_name = app.candidate.full_name if app.candidate else "N/A"
    resp.job_title = app.requisition.job_title if app.requisition else "N/A"
    resp.department = app.requisition.department if app.requisition else "N/A"
    return resp

@router.get("/{application_id}/history", response_model=List[StageHistoryResponse])
def get_stage_history(application_id: str, db: Session = Depends(get_db)):
    history = (
        db.query(ApplicationStageHistory)
        .filter(ApplicationStageHistory.application_id == application_id)
        .order_by(ApplicationStageHistory.timestamp.asc())
        .all()
    )
    return history

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    data: ApplicationCreate,
    current_user: User = Depends(require_roles(["HR Partner", "Employee / Candidate", "System Administrator"])),
    db: Session = Depends(get_db)
):
    # Rule R001: Unapproved requisitions cannot receive valid applications
    req = db.query(Requisition).filter(Requisition.requisition_id == data.requisition_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    r001_result = rules_engine.evaluate_r001_requisition_for_application(req)
    if r001_result.decision == "BLOCK":
        raise HTTPException(status_code=400, detail=r001_result.explanation)

    cand = db.query(Candidate).filter(Candidate.candidate_id == data.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Check for duplicate application
    app_id = f"APP-{cand.candidate_id}-{req.requisition_id}"
    existing = db.query(Application).filter(Application.application_id == app_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Application {app_id} already exists.")

    new_app = Application(
        application_id=app_id,
        candidate_id=cand.candidate_id,
        requisition_id=req.requisition_id,
        current_stage="Applied",
        application_status="Active",
        applied_date=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_app)

    # Initial stage history entry
    sh = ApplicationStageHistory(
        application_id=app_id,
        previous_stage=None,
        new_stage="Applied",
        decision="PASS",
        decision_reason="Application submitted in compliance with R001",
        actor=current_user.full_name,
        timestamp=datetime.utcnow(),
        related_rule_id="R001"
    )
    db.add(sh)

    log_audit_event(
        db=db,
        action="CREATE",
        entity="Application",
        entity_id=app_id,
        previous_value=None,
        new_value={"stage": "Applied", "candidate": cand.full_name, "requisition": req.job_title},
        user_id=current_user.user_id,
        reason="Candidate application submission"
    )

    db.commit()
    db.refresh(new_app)

    resp = ApplicationResponse.from_orm(new_app)
    resp.candidate_name = cand.full_name
    resp.job_title = req.job_title
    resp.department = req.department
    return resp

@router.post("/{application_id}/transition", response_model=ApplicationResponse)
def transition_stage(
    application_id: str,
    data: StageTransitionRequest,
    current_user: User = Depends(require_roles(["HR Partner", "Hiring Manager", "System Administrator"])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.application_id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Rule R004: Withdrawn candidates cannot progress
    r004_result = rules_engine.evaluate_r004_withdrawn_status(app)
    if r004_result.decision == "BLOCK" and data.new_stage != "Withdrawn":
        raise HTTPException(status_code=400, detail=r004_result.explanation)

    # Completed scorecards if advancing to Offer
    completed_scorecards = []
    if data.new_stage == "Offer":
        # Check interviews for this application
        completed_scorecards = (
            db.query(Scorecard)
            .join(Interview)
            .filter(Interview.application_id == application_id, Scorecard.is_complete == True)
            .all()
        )

    # Rule R003: Candidates cannot advance without required stage reviews
    if data.new_stage not in ["Rejected", "Withdrawn", "On Hold"]:
        r003_result = rules_engine.evaluate_r003_stage_progression(app, data.new_stage, completed_scorecards)
        if r003_result.decision == "BLOCK":
            raise HTTPException(status_code=400, detail=r003_result.explanation)

    old_stage = app.current_stage
    app.current_stage = data.new_stage
    app.updated_at = datetime.utcnow()
    if data.new_stage in ["Hired", "Rejected", "Withdrawn"]:
        app.application_status = "Completed"

    # Append to ApplicationStageHistory (never overwrite!)
    actor_name = data.actor or current_user.full_name
    decision_type = "PASS" if data.new_stage not in ["Rejected", "Withdrawn"] else ("REJECT" if data.new_stage == "Rejected" else "WITHDRAW")
    sh = ApplicationStageHistory(
        application_id=application_id,
        previous_stage=old_stage,
        new_stage=data.new_stage,
        decision=decision_type,
        decision_reason=data.decision_reason,
        actor=actor_name,
        timestamp=datetime.utcnow(),
        related_rule_id="R003"
    )
    db.add(sh)

    log_audit_event(
        db=db,
        action="TRANSITION",
        entity="Application",
        entity_id=application_id,
        previous_value={"stage": old_stage},
        new_value={"stage": data.new_stage},
        user_id=current_user.user_id,
        reason=data.decision_reason
    )

    db.commit()
    db.refresh(app)

    resp = ApplicationResponse.from_orm(app)
    resp.candidate_name = app.candidate.full_name if app.candidate else "N/A"
    resp.job_title = app.requisition.job_title if app.requisition else "N/A"
    resp.department = app.requisition.department if app.requisition else "N/A"
    return resp

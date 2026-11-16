from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.core.audit import log_audit_event
from backend.app.models.entities import Requisition, SkillRequirement, HiringManager, User
from backend.app.schemas.schemas import RequisitionCreate, RequisitionUpdate, RequisitionResponse

router = APIRouter(prefix="/requisitions", tags=["Requisition Management"])

@router.get("", response_model=List[RequisitionResponse])
def get_requisitions(
    department: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Requisition)
    if department and department != "All":
        query = query.filter(Requisition.department == department)
    if status and status != "All":
        query = query.filter(Requisition.requisition_status == status)
    if search:
        query = query.filter(
            (Requisition.job_title.ilike(f"%{search}%")) |
            (Requisition.requisition_id.ilike(f"%{search}%"))
        )
    return query.order_by(Requisition.created_date.desc()).offset(offset).limit(limit).all()

@router.get("/{requisition_id}", response_model=RequisitionResponse)
def get_requisition(requisition_id: str, db: Session = Depends(get_db)):
    req = db.query(Requisition).filter(Requisition.requisition_id == requisition_id).first()
    if not req:
        raise HTTPException(status_code=404, detail=f"Requisition {requisition_id} not found")
    return req

@router.post("", response_model=RequisitionResponse, status_code=status.HTTP_201_CREATED)
def create_requisition(
    data: RequisitionCreate,
    current_user: User = Depends(require_roles(["HR Partner", "Hiring Manager", "System Administrator"])),
    db: Session = Depends(get_db)
):
    if data.salary_min > data.salary_max:
        raise HTTPException(status_code=400, detail="Salary minimum cannot exceed salary maximum")
    if data.experience_min > data.experience_max:
        raise HTTPException(status_code=400, detail="Experience minimum cannot exceed experience maximum")

    # Generate sequential ID REQ-2026-XXXXXX
    count = db.query(Requisition).count() + 1
    req_id = f"REQ-2026-{count:06d}"

    req = Requisition(
        requisition_id=req_id,
        job_title=data.job_title,
        department=data.department,
        location=data.location,
        hiring_manager_id=data.hiring_manager_id,
        employment_type=data.employment_type,
        experience_min=data.experience_min,
        experience_max=data.experience_max,
        salary_min=data.salary_min,
        salary_max=data.salary_max,
        positions_available=data.positions_available,
        requisition_status="Draft",
        created_date=datetime.utcnow(),
        expected_closing_date=data.expected_closing_date
    )
    db.add(req)

    if data.skills:
        for sk in data.skills:
            sr = SkillRequirement(
                requisition_id=req_id,
                skill_name=sk.skill_name,
                is_mandatory=sk.is_mandatory,
                min_proficiency=sk.min_proficiency,
                min_experience_years=sk.min_experience_years
            )
            db.add(sr)

    log_audit_event(
        db=db,
        action="CREATE",
        entity="Requisition",
        entity_id=req_id,
        previous_value=None,
        new_value={"job_title": data.job_title, "department": data.department, "status": "Draft"},
        user_id=current_user.user_id,
        reason="Initial requisition creation in Draft state"
    )
    db.commit()
    db.refresh(req)
    return req

@router.patch("/{requisition_id}/approve", response_model=RequisitionResponse)
def approve_requisition(
    requisition_id: str,
    current_user: User = Depends(require_roles(["Hiring Manager", "HR Partner", "System Administrator"])),
    db: Session = Depends(get_db)
):
    req = db.query(Requisition).filter(Requisition.requisition_id == requisition_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    old_status = req.requisition_status
    req.requisition_status = "Approved"
    req.approved_date = datetime.utcnow()

    log_audit_event(
        db=db,
        action="APPROVE",
        entity="Requisition",
        entity_id=requisition_id,
        previous_value={"status": old_status},
        new_value={"status": "Approved", "approved_date": req.approved_date.isoformat()},
        user_id=current_user.user_id,
        reason="Formal hiring manager authorization of requisition"
    )
    db.commit()
    db.refresh(req)
    return req

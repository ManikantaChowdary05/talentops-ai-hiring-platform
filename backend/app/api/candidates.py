from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.core.audit import log_audit_event
from backend.app.core.llm_engine import llm_engine
from backend.app.models.entities import Candidate, CandidateSkill, Requisition, User
from backend.app.schemas.schemas import CandidateCreate, CandidateResponse

router = APIRouter(prefix="/candidates", tags=["Candidate Management"])

@router.get("", response_model=List[CandidateResponse])
def get_candidates(
    search: Optional[str] = None,
    min_experience: Optional[float] = None,
    location: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Candidate)
    if search:
        query = query.filter(
            (Candidate.full_name.ilike(f"%{search}%")) |
            (Candidate.email.ilike(f"%{search}%")) |
            (Candidate.skills.ilike(f"%{search}%")) |
            (Candidate.candidate_id.ilike(f"%{search}%"))
        )
    if min_experience is not None:
        query = query.filter(Candidate.experience_years >= min_experience)
    if location and location != "All":
        query = query.filter(Candidate.location.ilike(f"%{location}%"))

    candidates = query.order_by(Candidate.profile_created_date.desc()).offset(offset).limit(limit).all()
    return candidates

@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.candidate_id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand

@router.post("", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(
    data: CandidateCreate,
    current_user: User = Depends(require_roles(["HR Partner", "Hiring Manager", "System Administrator"])),
    db: Session = Depends(get_db)
):
    count = db.query(Candidate).count() + 1
    cand_id = f"CAND-{count:06d}"

    skills_summary = ", ".join([s.skill_name for s in data.skills_list]) if data.skills_list else ""
    cand = Candidate(
        candidate_id=cand_id,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        location=data.location,
        education=data.education,
        experience_years=data.experience_years,
        current_role=data.current_role,
        current_company=data.current_company,
        expected_salary=data.expected_salary,
        skills=skills_summary,
        profile_created_date=datetime.utcnow()
    )
    db.add(cand)

    if data.skills_list:
        for sk in data.skills_list:
            cs = CandidateSkill(
                candidate_id=cand_id,
                skill_name=sk.skill_name,
                proficiency_level=sk.proficiency_level,
                experience_years=sk.experience_years
            )
            db.add(cs)

    log_audit_event(
        db=db,
        action="CREATE",
        entity="Candidate",
        entity_id=cand_id,
        previous_value=None,
        new_value={"full_name": data.full_name, "email": data.email},
        user_id=current_user.user_id,
        reason="Manual candidate profile registration"
    )
    db.commit()
    db.refresh(cand)
    return cand

@router.get("/{candidate_id}/ai-fit/{requisition_id}")
def get_ai_candidate_fit(candidate_id: str, requisition_id: str, db: Session = Depends(get_db)):
    """
    Intelligent LLM-powered candidate-job fit analysis with explainable matching and rubric talking points.
    """
    cand = db.query(Candidate).filter(Candidate.candidate_id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    req = db.query(Requisition).filter(Requisition.requisition_id == requisition_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    cand_dict = {
        "candidate_id": cand.candidate_id,
        "full_name": cand.full_name,
        "education": cand.education,
        "experience_years": cand.experience_years,
        "expected_salary": cand.expected_salary
    }
    req_dict = {
        "requisition_id": req.requisition_id,
        "job_title": req.job_title,
        "department": req.department,
        "experience_min": req.experience_min,
        "experience_max": req.experience_max,
        "salary_min": req.salary_min,
        "salary_max": req.salary_max
    }
    cand_skills = [
        {"skill_name": s.skill_name, "proficiency_level": s.proficiency_level, "experience_years": s.experience_years}
        for s in cand.candidate_skills
    ]
    skill_reqs = [
        {"skill_name": s.skill_name, "min_proficiency": s.min_proficiency, "min_experience_years": s.min_experience_years, "is_mandatory": s.is_mandatory}
        for s in req.skill_requirements
    ]

    fit_analysis = llm_engine.analyze_candidate_job_fit(cand_dict, req_dict, cand_skills, skill_reqs)
    return fit_analysis

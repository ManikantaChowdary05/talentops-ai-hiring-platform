from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.core.audit import log_audit_event
from backend.app.core.rules_engine import rules_engine
from backend.app.models.entities import Offer, Application, Approval, Requisition, User, ExceptionLog
from backend.app.schemas.schemas import OfferCreate, OfferResponse

router = APIRouter(prefix="/offers", tags=["Offer Management"])

@router.get("", response_model=List[OfferResponse])
def get_offers(
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Offer).join(Application).join(Requisition)
    if status and status != "All":
        query = query.filter(Offer.offer_status == status)
    offers = query.order_by(Offer.created_at.desc()).offset(offset).limit(limit).all()

    res = []
    for o in offers:
        resp = OfferResponse.from_orm(o)
        resp.candidate_name = o.application.candidate.full_name if o.application and o.application.candidate else "N/A"
        resp.job_title = o.application.requisition.job_title if o.application and o.application.requisition else "N/A"
        resp.salary_min = o.application.requisition.salary_min if o.application and o.application.requisition else None
        resp.salary_max = o.application.requisition.salary_max if o.application and o.application.requisition else None
        res.append(resp)
    return res

@router.post("", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def create_offer(
    data: OfferCreate,
    current_user: User = Depends(require_roles(["HR Partner", "System Administrator"])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.application_id == data.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    req = app.requisition

    # Rule R009: Offer compensation band compliance
    r009_result = rules_engine.evaluate_r009_offer_compensation(data.proposed_salary, req.salary_min, req.salary_max)
    
    band_status = "Within Band"
    required_approval_levels = 1
    
    if r009_result.expected_action == "REQUIRE_COMPENSATION_EXCEPTION_APPROVAL":
        band_status = "Above Maximum Band"
        required_approval_levels = 2  # Needs Level 2 (Executive) exception approval
        # Log anomaly in ExceptionLog
        exc_id = f"EXC-2026-{db.query(ExceptionLog).count() + 1:06d}"
        exc = ExceptionLog(
            exception_id=exc_id,
            entity_type="Offer",
            entity_id=f"OFF_PENDING_{app.application_id}",
            issue_type="Offer exceeds approved compensation band",
            severity="High",
            detected_rule_id="R009",
            expected_decision="REVIEW",
            actual_decision="EXCEPTION_ROUTED",
            resolution_status="Open",
            comments=r009_result.explanation,
            created_at=datetime.utcnow()
        )
        db.add(exc)
    elif r009_result.expected_action == "REQUIRE_POLICY_JUSTIFICATION":
        band_status = "Below Minimum Band"

    count = db.query(Offer).count() + 1
    off_id = f"OFF-2026-{count:06d}"

    offer = Offer(
        offer_id=off_id,
        application_id=data.application_id,
        proposed_salary=data.proposed_salary,
        currency=data.currency,
        bonus=data.bonus,
        joining_date=data.joining_date,
        offer_status="Pending Approval",
        version=1,
        created_by=current_user.user_id,
        created_at=datetime.utcnow(),
        band_compliance_status=band_status
    )
    db.add(offer)

    # Initialize approval queue
    # Level 1: Hiring Manager
    mgr_user_id = req.hiring_manager.user_id if req.hiring_manager else current_user.user_id
    appr1_id = f"APPV-2026-{db.query(Approval).count() + 1:06d}"
    appr1 = Approval(
        approval_id=appr1_id,
        offer_id=off_id,
        approver_id=mgr_user_id,
        approval_level=1,
        decision="Pending",
        comments="Level 1 Hiring Manager review",
        timestamp=datetime.utcnow()
    )
    db.add(appr1)

    # If exceeding band, add Level 2 Executive Approval
    if required_approval_levels == 2:
        admin_user = db.query(User).filter(User.role == "System Administrator").first()
        admin_id = admin_user.user_id if admin_user else current_user.user_id
        appr2_id = f"APPV-2026-{db.query(Approval).count() + 2:06d}"
        appr2 = Approval(
            approval_id=appr2_id,
            offer_id=off_id,
            approver_id=admin_id,
            approval_level=2,
            decision="Pending",
            comments="Level 2 Compensation Exception authorization required",
            timestamp=datetime.utcnow()
        )
        db.add(appr2)

    log_audit_event(
        db=db,
        action="CREATE",
        entity="Offer",
        entity_id=off_id,
        previous_value=None,
        new_value={"salary": data.proposed_salary, "band_status": band_status, "levels": required_approval_levels},
        user_id=current_user.user_id,
        reason=f"Offer generated: {r009_result.explanation}"
    )

    db.commit()
    db.refresh(offer)

    resp = OfferResponse.from_orm(offer)
    resp.candidate_name = app.candidate.full_name
    resp.job_title = req.job_title
    resp.salary_min = req.salary_min
    resp.salary_max = req.salary_max
    return resp

@router.patch("/{offer_id}/status")
def update_offer_status(
    offer_id: str,
    target_status: str,
    current_user: User = Depends(require_roles(["HR Partner", "Hiring Manager", "System Administrator"])),
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.offer_id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    # Rule R010: Rejected offers cannot be marked as accepted
    r010_result = rules_engine.evaluate_r010_offer_status_transition(offer.offer_status, target_status)
    if r010_result.decision == "BLOCK":
        raise HTTPException(status_code=400, detail=r010_result.explanation)

    # Rule R011: Final hiring requires all mandatory approvals
    if target_status == "Accepted":
        approvals = offer.approvals
        r011_result = rules_engine.evaluate_r011_final_hire_approval(offer, approvals)
        if r011_result.decision == "BLOCK":
            raise HTTPException(status_code=400, detail=r011_result.explanation)
        
        # Advance application to Hired
        offer.application.current_stage = "Hired"
        offer.application.application_status = "Completed"

    old_status = offer.offer_status
    offer.offer_status = target_status

    log_audit_event(
        db=db,
        action="UPDATE",
        entity="Offer",
        entity_id=offer_id,
        previous_value={"status": old_status},
        new_value={"status": target_status},
        user_id=current_user.user_id,
        reason=f"Offer transition to {target_status}"
    )
    db.commit()
    return {"message": f"Offer {offer_id} updated to {target_status}"}

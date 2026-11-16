from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.core.audit import log_audit_event
from backend.app.models.entities import Approval, Offer, User
from backend.app.schemas.schemas import ApprovalActionRequest, ApprovalResponse

router = APIRouter(prefix="/approvals", tags=["Approval Workflow"])

@router.get("", response_model=List[ApprovalResponse])
def get_approvals(
    decision: Optional[str] = None,
    offer_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Approval)
    if decision and decision != "All":
        query = query.filter(Approval.decision == decision)
    if offer_id:
        query = query.filter(Approval.offer_id == offer_id)
    approvals = query.order_by(Approval.timestamp.desc()).offset(offset).limit(limit).all()

    res = []
    for a in approvals:
        resp = ApprovalResponse.from_orm(a)
        if a.approver:
            resp.approver_name = a.approver.full_name
        res.append(resp)
    return res

@router.post("/{approval_id}/action", response_model=ApprovalResponse)
def submit_approval_action(
    approval_id: str,
    data: ApprovalActionRequest,
    current_user: User = Depends(require_roles(["Hiring Manager", "HR Partner", "System Administrator"])),
    db: Session = Depends(get_db)
):
    appr = db.query(Approval).filter(Approval.approval_id == approval_id).first()
    if not appr:
        raise HTTPException(status_code=404, detail="Approval record not found")

    if data.decision not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Decision must be 'Approved' or 'Rejected'")

    old_dec = appr.decision
    appr.decision = data.decision
    appr.comments = data.comments or ("Approved by manager" if data.decision == "Approved" else "Rejected by manager")
    appr.timestamp = datetime.utcnow()

    # Check offer status
    offer = appr.offer
    if data.decision == "Rejected":
        offer.offer_status = "Rejected"
    elif data.decision == "Approved":
        # Check if all other approvals for this offer are also approved
        all_apprs = offer.approvals
        if all(a.decision == "Approved" for a in all_apprs):
            offer.offer_status = "Approved"

    log_audit_event(
        db=db,
        action="APPROVE" if data.decision == "Approved" else "REJECT",
        entity="Approval",
        entity_id=approval_id,
        previous_value={"decision": old_dec},
        new_value={"decision": data.decision, "offer_id": offer.offer_id, "offer_status": offer.offer_status},
        user_id=current_user.user_id,
        reason=data.comments
    )

    db.commit()
    db.refresh(appr)

    resp = ApprovalResponse.from_orm(appr)
    resp.approver_name = current_user.full_name
    return resp

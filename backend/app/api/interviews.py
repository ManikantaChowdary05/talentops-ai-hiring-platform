from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.core.audit import log_audit_event
from backend.app.core.rules_engine import rules_engine
from backend.app.models.entities import (
    Interview, InterviewPanel, PanelMember, Availability, Application, 
    ExceptionLog, User
)
from backend.app.schemas.schemas import InterviewCreate, InterviewResponse, AvailabilityResponse

router = APIRouter(prefix="/interviews", tags=["Interview Scheduling"])

@router.get("", response_model=List[InterviewResponse])
def get_interviews(
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Interview)
    if status and status != "All":
        query = query.filter(Interview.status == status)
    interviews = query.order_by(Interview.scheduled_start.desc()).offset(offset).limit(limit).all()

    result = []
    for it in interviews:
        resp = InterviewResponse.from_orm(it)
        if it.application and it.application.candidate:
            resp.candidate_name = it.application.candidate.full_name
        if it.application and it.application.requisition:
            resp.job_title = it.application.requisition.job_title
        result.append(resp)
    return result

@router.get("/panels")
def get_interview_panels(db: Session = Depends(get_db)):
    panels = db.query(InterviewPanel).all()
    res = []
    for p in panels:
        res.append({
            "panel_id": p.panel_id,
            "panel_name": p.panel_name,
            "requisition_id": p.requisition_id,
            "job_title": p.requisition.job_title if p.requisition else "N/A",
            "members": [
                {"user_id": m.user.user_id, "name": m.user.full_name, "role": m.role_in_panel, "is_mandatory": m.is_mandatory}
                for m in p.members if m.user
            ]
        })
    return res

@router.get("/availabilities", response_model=List[AvailabilityResponse])
def get_availabilities(user_id: Optional[str] = None, date: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Availability)
    if user_id:
        query = query.filter(Availability.user_id == user_id)
    if date:
        query = query.filter(Availability.date == date)
    return query.order_by(Availability.date.asc(), Availability.start_time.asc()).limit(150).all()

@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def schedule_interview(
    data: InterviewCreate,
    current_user: User = Depends(require_roles(["HR Partner", "Hiring Manager", "System Administrator"])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.application_id == data.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Rule R004: Withdrawn candidates cannot progress or be scheduled
    r004_result = rules_engine.evaluate_r004_withdrawn_status(app)
    if r004_result.decision == "BLOCK":
        # Log failed attempt
        exc_id = f"EXC-2026-{db.query(ExceptionLog).count() + 1:06d}"
        exc = ExceptionLog(
            exception_id=exc_id,
            entity_type="Interview",
            entity_id=f"NEW_INTERVIEW_FOR_{app.application_id}",
            issue_type="Withdrawn candidate remains scheduled",
            severity="Medium",
            detected_rule_id="R004",
            expected_decision="BLOCK",
            actual_decision="BLOCKED_ATTEMPT",
            resolution_status="Resolved",
            comments="Attempted to schedule interview for withdrawn candidate. Scheduling blocked automatically.",
            created_at=datetime.utcnow(),
            resolved_at=datetime.utcnow()
        )
        db.add(exc)
        db.commit()
        raise HTTPException(status_code=400, detail=r004_result.explanation)

    panel = db.query(InterviewPanel).filter(InterviewPanel.panel_id == data.panel_id).first()
    if not panel:
        raise HTTPException(status_code=404, detail="Interview Panel not found")

    panel_user_ids = [m.user_id for m in panel.members]
    
    # Check R006: Non-overlapping interviews for panel members
    if not data.test_mode_conflict:
        existing_ints = db.query(Interview).all()
        r006_result = rules_engine.evaluate_r006_double_booking(
            interviewer_ids=panel_user_ids,
            start_time=data.scheduled_start,
            end_time=data.scheduled_end,
            existing_interviews=existing_ints
        )
        if r006_result.decision == "BLOCK":
            # Search alternative available slots
            sched_date = data.scheduled_start.strftime("%Y-%m-%d")
            free_slots = (
                db.query(Availability)
                .filter(Availability.user_id.in_(panel_user_ids), Availability.is_booked == False)
                .order_by(Availability.date.asc(), Availability.start_time.asc())
                .limit(5)
                .all()
            )
            suggested = [f"{s.date} {s.start_time}-{s.end_time} (Interviewer: {s.user_id})" for s in free_slots]

            # Record failed scheduling attempt
            exc_id = f"EXC-2026-{db.query(ExceptionLog).count() + 1:06d}"
            exc = ExceptionLog(
                exception_id=exc_id,
                entity_type="Interview",
                entity_id="FAILED_BOOKING_ATTEMPT",
                issue_type="Interviewer double-booked",
                severity="High",
                detected_rule_id="R006",
                expected_decision="BLOCK",
                actual_decision="BLOCKED_ATTEMPT",
                resolution_status="Resolved",
                comments=f"{r006_result.explanation} Suggested alternatives: {', '.join(suggested[:2])}",
                created_at=datetime.utcnow(),
                resolved_at=datetime.utcnow()
            )
            db.add(exc)
            db.commit()

            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Scheduling Conflict (R006)",
                    "message": r006_result.explanation,
                    "suggested_available_slots": suggested
                }
            )

    # Generate sequential INT-2026-XXXXXX
    count = db.query(Interview).count() + 1
    int_id = f"INT-2026-{count:06d}"

    intv = Interview(
        interview_id=int_id,
        application_id=data.application_id,
        panel_id=data.panel_id,
        interview_type=data.interview_type,
        scheduled_start=data.scheduled_start,
        scheduled_end=data.scheduled_end,
        status="Scheduled",
        calendar_notes=data.calendar_notes,
        test_mode_conflict=data.test_mode_conflict,
        created_at=datetime.utcnow()
    )
    db.add(intv)

    log_audit_event(
        db=db,
        action="SCHEDULE",
        entity="Interview",
        entity_id=int_id,
        previous_value=None,
        new_value={"start": data.scheduled_start.isoformat(), "end": data.scheduled_end.isoformat(), "panel": data.panel_id},
        user_id=current_user.user_id,
        reason="Interview successfully booked onto operational calendar"
    )

    db.commit()
    db.refresh(intv)

    resp = InterviewResponse.from_orm(intv)
    if intv.application and intv.application.candidate:
        resp.candidate_name = intv.application.candidate.full_name
    if intv.application and intv.application.requisition:
        resp.job_title = intv.application.requisition.job_title
    return resp

@router.patch("/{interview_id}/cancel")
def cancel_interview(
    interview_id: str,
    reason: str = "Candidate or interviewer requested cancellation",
    current_user: User = Depends(require_roles(["HR Partner", "Hiring Manager", "System Administrator"])),
    db: Session = Depends(get_db)
):
    it = db.query(Interview).filter(Interview.interview_id == interview_id).first()
    if not it:
        raise HTTPException(status_code=404, detail="Interview not found")

    old_status = it.status
    it.status = "Cancelled"
    it.calendar_notes = f"{it.calendar_notes or ''} [Cancelled: {reason}]"

    log_audit_event(
        db=db,
        action="UPDATE",
        entity="Interview",
        entity_id=interview_id,
        previous_value={"status": old_status},
        new_value={"status": "Cancelled"},
        user_id=current_user.user_id,
        reason=reason
    )
    db.commit()
    return {"message": f"Interview {interview_id} successfully cancelled"}

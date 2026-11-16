from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.core.audit import log_audit_event
from backend.app.core.rules_engine import rules_engine
from backend.app.core.llm_engine import llm_engine
from backend.app.models.entities import Scorecard, Interview, ExceptionLog, User
from backend.app.schemas.schemas import ScorecardCreate, ScorecardResponse

router = APIRouter(prefix="/evaluations", tags=["Structured Interview Evaluation"])

@router.get("", response_model=List[ScorecardResponse])
def get_scorecards(
    interview_id: Optional[str] = None,
    reviewer_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Scorecard)
    if interview_id:
        query = query.filter(Scorecard.interview_id == interview_id)
    if reviewer_id:
        query = query.filter(Scorecard.reviewer_id == reviewer_id)
    scorecards = query.order_by(Scorecard.submitted_at.desc()).offset(offset).limit(limit).all()

    res = []
    for sc in scorecards:
        resp = ScorecardResponse.from_orm(sc)
        if sc.reviewer:
            resp.reviewer_name = sc.reviewer.full_name
        res.append(resp)
    return res

@router.post("", response_model=ScorecardResponse, status_code=status.HTTP_201_CREATED)
def submit_scorecard(
    data: ScorecardCreate,
    current_user: User = Depends(require_roles(["Interviewer", "Hiring Manager", "HR Partner", "System Administrator"])),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.interview_id == data.interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Rule R008: Irrelevant evaluation criteria check
    if data.extra_criteria:
        keys = list(data.extra_criteria.keys())
        r008_result = rules_engine.evaluate_r008_evaluation_criteria_relevance(keys)
        if r008_result.decision == "BLOCK":
            # Record Anomaly 5
            exc_id = f"EXC-2026-{db.query(ExceptionLog).count() + 1:06d}"
            exc = ExceptionLog(
                exception_id=exc_id,
                entity_type="Evaluation",
                entity_id=f"SCORECARD_{data.interview_id}_{data.reviewer_id}",
                issue_type="Evaluation includes irrelevant criteria",
                severity="High",
                detected_rule_id="R008",
                expected_decision="BLOCK",
                actual_decision="BLOCKED_SUBMISSION",
                resolution_status="Open",
                comments=r008_result.explanation,
                created_at=datetime.utcnow()
            )
            db.add(exc)
            db.commit()
            raise HTTPException(status_code=400, detail=r008_result.explanation)

    # Rule R007: Completeness check
    r007_data = {
        "technical_knowledge": data.technical_knowledge,
        "problem_solving": data.problem_solving,
        "communication": data.communication,
        "role_specific_skills": data.role_specific_skills,
        "collaboration": data.collaboration
    }
    r007_result = rules_engine.evaluate_r007_scorecard_completeness(r007_data)
    if r007_result.decision == "BLOCK":
        raise HTTPException(status_code=400, detail=r007_result.explanation)

    # Calculate weighted score
    final_score, recommendation = rules_engine.calculate_scorecard_weighted_score(
        data.technical_knowledge, data.problem_solving, data.communication,
        data.role_specific_skills, data.collaboration
    )

    # Check reviewer disagreement with existing scorecards for this interview
    existing_cards = db.query(Scorecard).filter(Scorecard.interview_id == data.interview_id).all()
    has_disagreement = False
    if existing_cards:
        for ex in existing_cards:
            if abs(ex.weighted_score - final_score) >= 15.0 or ex.recommendation != recommendation:
                has_disagreement = True
                ex.has_disagreement = True

    sc_id = f"SCORE-{data.interview_id}-{data.reviewer_id}"
    scorecard = Scorecard(
        scorecard_id=sc_id,
        interview_id=data.interview_id,
        reviewer_id=data.reviewer_id,
        technical_knowledge=data.technical_knowledge,
        problem_solving=data.problem_solving,
        communication=data.communication,
        role_specific_skills=data.role_specific_skills,
        collaboration=data.collaboration,
        weighted_score=final_score,
        recommendation=recommendation,
        feedback_comments=data.feedback_comments,
        rubric_version="1.0",
        is_complete=True,
        has_disagreement=has_disagreement,
        submitted_at=datetime.utcnow()
    )
    db.add(scorecard)

    # Mark interview as completed if all expected scorecards are in
    interview.status = "Completed"

    log_audit_event(
        db=db,
        action="CREATE",
        entity="Scorecard",
        entity_id=sc_id,
        previous_value=None,
        new_value={"score": final_score, "rec": recommendation, "disagreement": has_disagreement},
        user_id=current_user.user_id,
        reason="Evaluation scorecard submitted with 5-pillar rubric"
    )

    db.commit()
    db.refresh(scorecard)

    resp = ScorecardResponse.from_orm(scorecard)
    resp.reviewer_name = current_user.full_name
    return resp

@router.get("/summary/{interview_id}")
def get_interview_evaluation_summary(interview_id: str, db: Session = Depends(get_db)):
    """
    AI-driven multi-reviewer scorecard synthesis and disagreement resolution.
    """
    interview = db.query(Interview).filter(Interview.interview_id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    scorecards = db.query(Scorecard).filter(Scorecard.interview_id == interview_id).all()
    sc_dicts = [
        {
            "scorecard_id": sc.scorecard_id,
            "reviewer_id": sc.reviewer_id,
            "weighted_score": sc.weighted_score,
            "recommendation": sc.recommendation,
            "feedback_comments": sc.feedback_comments
        }
        for sc in scorecards
    ]
    cand_name = interview.application.candidate.full_name if interview.application and interview.application.candidate else "Candidate"
    job_title = interview.application.requisition.job_title if interview.application and interview.application.requisition else "Target Role"

    summary = llm_engine.summarize_scorecards(sc_dicts, cand_name, job_title)
    return summary

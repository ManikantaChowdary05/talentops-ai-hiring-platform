import pytest
from datetime import datetime, timedelta
from backend.app.core.rules_engine import rules_engine
from backend.app.models.entities import (
    Requisition, Candidate, Application, Interview, Scorecard, Offer, Approval
)

def test_r001_unapproved_requisition_rejection():
    # Unapproved requisition cannot receive applications
    draft_req = Requisition(requisition_id="REQ-TEST-001", requisition_status="Draft")
    res_draft = rules_engine.evaluate_r001_requisition_for_application(draft_req)
    assert res_draft.decision == "BLOCK"
    assert "Draft" in res_draft.explanation

    # Approved requisition passes
    approved_req = Requisition(requisition_id="REQ-TEST-002", requisition_status="Approved")
    res_appr = rules_engine.evaluate_r001_requisition_for_application(approved_req)
    assert res_appr.decision == "PASS"

def test_r003_invalid_stage_transition_and_sequential_progress():
    app = Application(application_id="APP-TEST", current_stage="Applied")
    
    # Skipping straight from Applied to Offer must be blocked
    res_skip = rules_engine.evaluate_r003_stage_progression(app, "Offer")
    assert res_skip.decision == "BLOCK"
    assert "Stage skipping detected" in res_skip.explanation

    # Advancing sequentially from Applied to Screening passes
    res_seq = rules_engine.evaluate_r003_stage_progression(app, "Screening")
    assert res_seq.decision == "PASS"

def test_r004_withdrawn_candidate_cannot_progress():
    app = Application(application_id="APP-WITHDRAWN", current_stage="Withdrawn", application_status="Inactive")
    res = rules_engine.evaluate_r004_withdrawn_status(app)
    assert res.decision == "BLOCK"
    assert "Withdrawn/Inactive" in res.explanation

def test_r006_double_booking_prevention():
    now = datetime(2026, 5, 1, 10, 0)
    int_a = Interview(
        interview_id="INT-A",
        scheduled_start=now,
        scheduled_end=now + timedelta(hours=1),
        status="Scheduled"
    )
    from backend.app.models.entities import InterviewPanel, PanelMember
    panel = InterviewPanel(panel_id="PNL-TEST", requisition_id="REQ-TEST")
    member = PanelMember(panel_id="PNL-TEST", user_id="USR-INTERVIEWER-1")
    panel.members = [member]
    int_a.panel = panel

    # Attempting to schedule concurrent interview with overlapping time
    res = rules_engine.evaluate_r006_double_booking(
        interviewer_ids=["USR-INTERVIEWER-1"],
        start_time=now + timedelta(minutes=30),
        end_time=now + timedelta(minutes=90),
        existing_interviews=[int_a]
    )
    assert res.decision == "BLOCK"
    assert "Scheduling conflict detected" in res.explanation

def test_r007_incomplete_scorecard_blocking():
    # Missing required criterion
    data_incomplete = {
        "technical_knowledge": 4.0,
        "problem_solving": 4.0,
        "communication": None,
        "role_specific_skills": 4.0,
        "collaboration": 4.0
    }
    res = rules_engine.evaluate_r007_scorecard_completeness(data_incomplete)
    assert res.decision == "BLOCK"
    assert "Missing criteria" in res.explanation

    # Score out of bounds (< 1 or > 5)
    data_invalid = {
        "technical_knowledge": 6.5,
        "problem_solving": 4.0,
        "communication": 3.0,
        "role_specific_skills": 4.0,
        "collaboration": 4.0
    }
    res_inv = rules_engine.evaluate_r007_scorecard_completeness(data_invalid)
    assert res_inv.decision == "BLOCK"
    assert "Invalid scores" in res_inv.explanation

def test_r007_weighted_score_formula_and_thresholds():
    # Weights: tech 30%, prob 25%, comm 15%, role 20%, collab 10%
    # Perfect score: 5 in all => (5*0.3 + 5*0.25 + 5*0.15 + 5*0.2 + 5*0.1)/5 * 100 = 100%
    score, rec = rules_engine.calculate_scorecard_weighted_score(5, 5, 5, 5, 5)
    assert score == 100.0
    assert rec == "Strong Recommendation"

    # Moderate score: 3.5 in all => 70%
    score_mod, rec_mod = rules_engine.calculate_scorecard_weighted_score(3.5, 3.5, 3.5, 3.5, 3.5)
    assert score_mod == 70.0
    assert rec_mod == "Further Review"

    # Low score: 2 in all => 40%
    score_low, rec_low = rules_engine.calculate_scorecard_weighted_score(2, 2, 2, 2, 2)
    assert score_low == 40.0
    assert rec_low == "Does Not Meet Evaluation Threshold"

def test_r008_irrelevant_evaluation_criteria_flagging():
    valid_rubric = ["technical_knowledge", "problem_solving", "communication"]
    res_val = rules_engine.evaluate_r008_evaluation_criteria_relevance(valid_rubric)
    assert res_val.decision == "PASS"

    biased_rubric = ["technical_knowledge", "candidate_hobbies", "marital_status"]
    res_bias = rules_engine.evaluate_r008_evaluation_criteria_relevance(biased_rubric)
    assert res_bias.decision == "BLOCK"
    assert "candidate_hobbies" in res_bias.explanation

def test_r009_offer_compensation_band_validation():
    min_sal = 100000.0
    max_sal = 150000.0

    # Within band
    res_normal = rules_engine.evaluate_r009_offer_compensation(125000.0, min_sal, max_sal)
    assert res_normal.decision == "PASS"
    assert res_normal.expected_action == "PROCEED_NORMAL_APPROVAL"

    # Exceeding band
    res_above = rules_engine.evaluate_r009_offer_compensation(180000.0, min_sal, max_sal)
    assert res_above.decision == "REVIEW"
    assert res_above.expected_action == "REQUIRE_COMPENSATION_EXCEPTION_APPROVAL"

def test_r010_rejected_offer_transition():
    res = rules_engine.evaluate_r010_offer_status_transition("Rejected", "Accepted")
    assert res.decision == "BLOCK"
    assert "Rejected offer cannot be transitioned directly to Accepted" in res.explanation

def test_r011_missing_approval_prevention():
    offer = Offer(offer_id="OFF-TEST-001")
    appr1 = Approval(decision="Pending")
    
    # Incomplete approvals
    res_pending = rules_engine.evaluate_r011_final_hire_approval(offer, [appr1], required_approval_count=1)
    assert res_pending.decision == "BLOCK"

    # Rejection in approval trail
    appr_rej = Approval(decision="Rejected")
    res_rej = rules_engine.evaluate_r011_final_hire_approval(offer, [appr_rej], required_approval_count=1)
    assert res_rej.decision == "BLOCK"
    assert "rejected approval decisions" in res_rej.explanation

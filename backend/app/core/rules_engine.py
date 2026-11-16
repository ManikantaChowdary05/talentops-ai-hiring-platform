from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict

@dataclass
class RuleEvaluationResult:
    rule_id: str
    decision: str  # "PASS", "BLOCK", "REVIEW"
    explanation: str
    expected_action: str
    entity_id: str
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class RulesEngine:
    def __init__(self):
        # Default configurable thresholds
        self.config = {
            "R002_MIN_EXPERIENCE_TOLERANCE": 0.0,      # Strict min experience
            "R007_MIN_SCORECARD_COUNT": 1,             # Min required scorecards
            "R008_ALLOWED_CRITERIA": [
                "technical_knowledge",
                "problem_solving",
                "communication",
                "role_specific_skills",
                "collaboration"
            ],
            "R009_BAND_MAX_TOLERANCE_PERCENT": 0.0,    # 0% tolerance above max salary
            "EVAL_STRONG_RECOMMENDATION_MIN": 80.0,    # 80-100 Strong
            "EVAL_FURTHER_REVIEW_MIN": 65.0,           # 65-79 Further Review
            "CRITERIA_WEIGHTS": {
                "technical_knowledge": 0.30,
                "problem_solving": 0.25,
                "communication": 0.15,
                "role_specific_skills": 0.20,
                "collaboration": 0.10
            }
        }

    def update_config(self, key: str, value: Any):
        if key in self.config:
            self.config[key] = value

    # R001: Unapproved requisitions cannot receive valid applications
    def evaluate_r001_requisition_for_application(self, requisition: Any) -> RuleEvaluationResult:
        rule_id = "R001"
        entity_id = requisition.requisition_id if hasattr(requisition, "requisition_id") else str(requisition)
        status = requisition.requisition_status if hasattr(requisition, "requisition_status") else getattr(requisition, "status", "")
        
        if status in ["Approved", "Open"]:
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="PASS",
                explanation=f"Requisition {entity_id} has approved/open status '{status}'. Applications permitted.",
                expected_action="PROCEED_APPLICATION",
                entity_id=entity_id
            )
        else:
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation=f"Requisition {entity_id} has status '{status}'. Only Approved or Open requisitions may accept applications.",
                expected_action="REQUISITION_APPROVAL_REQUIRED",
                entity_id=entity_id
            )

    # R002: Candidates must satisfy mandatory eligibility criteria
    def evaluate_r002_candidate_eligibility(
        self, candidate: Any, requisition: Any, candidate_skills: List[Any], skill_requirements: List[Any]
    ) -> RuleEvaluationResult:
        rule_id = "R002"
        entity_id = candidate.candidate_id if hasattr(candidate, "candidate_id") else str(candidate)
        
        # Check minimum experience
        min_exp = getattr(requisition, "experience_min", 0.0)
        cand_exp = getattr(candidate, "experience_years", 0.0)
        if cand_exp < min_exp - self.config["R002_MIN_EXPERIENCE_TOLERANCE"]:
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation=f"Candidate experience ({cand_exp} yrs) is below mandatory minimum required ({min_exp} yrs).",
                expected_action="FAIL_EXPERIENCE_CRITERIA",
                entity_id=entity_id
            )
            
        # Check mandatory skill requirements
        cand_skill_map = {
            s.skill_name.lower().strip(): (s.proficiency_level, s.experience_years) 
            for s in candidate_skills
        }
        
        missing_mandatory = []
        for req_skill in skill_requirements:
            if getattr(req_skill, "is_mandatory", True):
                skill_name = req_skill.skill_name.lower().strip()
                if skill_name not in cand_skill_map:
                    missing_mandatory.append(f"{req_skill.skill_name} (Missing)")
                else:
                    prof, exp = cand_skill_map[skill_name]
                    if prof < getattr(req_skill, "min_proficiency", 3):
                        missing_mandatory.append(
                            f"{req_skill.skill_name} (Proficiency {prof} < min {req_skill.min_proficiency})"
                        )
                    elif exp < getattr(req_skill, "min_experience_years", 1.0):
                        missing_mandatory.append(
                            f"{req_skill.skill_name} (Experience {exp}y < min {req_skill.min_experience_years}y)"
                        )

        if missing_mandatory:
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation=f"Candidate fails mandatory skill requirements: {', '.join(missing_mandatory)}.",
                expected_action="SCREENING_REJECTION",
                entity_id=entity_id
            )

        return RuleEvaluationResult(
            rule_id=rule_id,
            decision="PASS",
            explanation="Candidate satisfies all mandatory eligibility and prerequisite skill criteria.",
            expected_action="QUALIFY_SCREENING",
            entity_id=entity_id
        )

    # R003: Candidates cannot advance without required stage reviews
    def evaluate_r003_stage_progression(
        self, application: Any, target_stage: str, completed_scorecards: List[Any] = None
    ) -> RuleEvaluationResult:
        rule_id = "R003"
        entity_id = application.application_id if hasattr(application, "application_id") else str(application)
        current_stage = getattr(application, "current_stage", "Applied")
        
        stage_order = [
            "Applied", "Screening", "Assessment", "Technical Interview", 
            "Manager Interview", "Offer", "Hired"
        ]
        
        if current_stage not in stage_order or target_stage not in stage_order:
            # Special stages like Rejected, Withdrawn, On Hold
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation=f"Cannot advance from stage '{current_stage}' to '{target_stage}'.",
                expected_action="PREVENT_STAGE_TRANSITION",
                entity_id=entity_id
            )
            
        cur_idx = stage_order.index(current_stage)
        target_idx = stage_order.index(target_stage)
        
        # Cannot skip stages forwards (e.g. Applied -> Offer directly)
        if target_idx > cur_idx + 1:
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation=f"Stage skipping detected: Cannot move from '{current_stage}' directly to '{target_stage}' without intermediate reviews.",
                expected_action="ENFORCE_SEQUENTIAL_STAGES",
                entity_id=entity_id
            )

        # To move from Technical Interview or Manager Interview to Offer, scorecards must exist
        if current_stage in ["Technical Interview", "Manager Interview"] and target_stage == "Offer":
            if not completed_scorecards or len(completed_scorecards) < self.config["R007_MIN_SCORECARD_COUNT"]:
                return RuleEvaluationResult(
                    rule_id=rule_id,
                    decision="BLOCK",
                    explanation=f"Cannot advance to 'Offer' stage without verified completed interview evaluations.",
                    expected_action="AWAIT_INTERVIEW_EVALUATION",
                    entity_id=entity_id
                )

        return RuleEvaluationResult(
            rule_id=rule_id,
            decision="PASS",
            explanation=f"Valid stage advancement from '{current_stage}' to '{target_stage}'.",
            expected_action="ALLOW_STAGE_ADVANCEMENT",
            entity_id=entity_id
        )

    # R004: Withdrawn candidates cannot progress
    def evaluate_r004_withdrawn_status(self, application: Any) -> RuleEvaluationResult:
        rule_id = "R004"
        entity_id = application.application_id if hasattr(application, "application_id") else str(application)
        current_stage = getattr(application, "current_stage", "")
        app_status = getattr(application, "application_status", "")
        
        if current_stage == "Withdrawn" or app_status == "Inactive":
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation=f"Application {entity_id} is marked as Withdrawn/Inactive. Further progression or scheduling is prohibited.",
                expected_action="HALT_WORKFLOW",
                entity_id=entity_id
            )
        return RuleEvaluationResult(
            rule_id=rule_id,
            decision="PASS",
            explanation="Candidate application is active.",
            expected_action="PROCEED",
            entity_id=entity_id
        )

    # R005: Interview scheduling requires interviewer availability
    def evaluate_r005_interviewer_availability(
        self, interviewer_id: str, scheduled_date: str, start_time: str, end_time: str,
        user_availabilities: List[Any]
    ) -> RuleEvaluationResult:
        rule_id = "R005"
        entity_id = interviewer_id
        
        # Check if user has an open slot on that date covering the window
        matching_slot = None
        for slot in user_availabilities:
            if getattr(slot, "user_id", "") == interviewer_id and getattr(slot, "date", "") == scheduled_date:
                slot_start = getattr(slot, "start_time", "")
                slot_end = getattr(slot, "end_time", "")
                is_booked = getattr(slot, "is_booked", False)
                if not is_booked and slot_start <= start_time and slot_end >= end_time:
                    matching_slot = slot
                    break
                    
        if not matching_slot:
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation=f"Interviewer {interviewer_id} has no registered open availability for {scheduled_date} between {start_time} and {end_time}.",
                expected_action="REQUEST_INTERVIEWER_AVAILABILITY",
                entity_id=entity_id
            )
            
        return RuleEvaluationResult(
            rule_id=rule_id,
            decision="PASS",
            explanation=f"Interviewer {interviewer_id} is available on {scheduled_date} ({start_time} - {end_time}).",
            expected_action="CONFIRM_AVAILABILITY",
            entity_id=entity_id
        )

    # R006: Confirmed interviewers cannot have overlapping interviews (double-booking)
    def evaluate_r006_double_booking(
        self, interviewer_ids: List[str], start_time: datetime, end_time: datetime,
        existing_interviews: List[Any], current_interview_id: Optional[str] = None
    ) -> RuleEvaluationResult:
        rule_id = "R006"
        conflicts = []
        
        for intv in existing_interviews:
            if getattr(intv, "interview_id", None) == current_interview_id:
                continue
            if getattr(intv, "status", "") in ["Cancelled", "Rescheduled"]:
                continue
                
            intv_start = getattr(intv, "scheduled_start", None)
            intv_end = getattr(intv, "scheduled_end", None)
            if not intv_start or not intv_end:
                continue
                
            # Check overlap: (StartA < EndB) and (EndA > StartB)
            if start_time < intv_end and end_time > intv_start:
                # Check panel members of conflicting interview
                panel = getattr(intv, "panel", None)
                if panel and hasattr(panel, "members"):
                    for m in panel.members:
                        if m.user_id in interviewer_ids:
                            conflicts.append((m.user_id, intv.interview_id, intv_start, intv_end))
                            
        if conflicts:
            conflict_details = ", ".join([f"Interviewer {u} booked in {iid} ({s.strftime('%H:%M')}-{e.strftime('%H:%M')})" for u, iid, s, e in conflicts])
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation=f"Scheduling conflict detected! Overlapping booking: {conflict_details}.",
                expected_action="RESCHEDULE_OR_CHOOSE_ALTERNATIVE_SLOT",
                entity_id=",".join(interviewer_ids)
            )

        return RuleEvaluationResult(
            rule_id=rule_id,
            decision="PASS",
            explanation="No overlapping interviewer bookings found.",
            expected_action="PROCEED_SCHEDULING",
            entity_id=",".join(interviewer_ids)
        )

    # R007: Scorecards must be complete before final evaluation
    def evaluate_r007_scorecard_completeness(self, scorecard_data: Dict[str, Any]) -> RuleEvaluationResult:
        rule_id = "R007"
        entity_id = scorecard_data.get("scorecard_id", "SCORECARD")
        
        required_criteria = [
            "technical_knowledge", "problem_solving", "communication",
            "role_specific_skills", "collaboration"
        ]
        missing = []
        invalid_scores = []
        
        for crit in required_criteria:
            val = scorecard_data.get(crit)
            if val is None:
                missing.append(crit)
            elif not (1 <= float(val) <= 5):
                invalid_scores.append(f"{crit}={val} (must be 1 to 5)")
                
        if missing or invalid_scores:
            reason = []
            if missing:
                reason.append(f"Missing criteria: {', '.join(missing)}")
            if invalid_scores:
                reason.append(f"Invalid scores: {', '.join(invalid_scores)}")
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation=f"Incomplete evaluation: {'; '.join(reason)}.",
                expected_action="COMPLETE_MANDATORY_CRITERIA",
                entity_id=entity_id
            )
            
        return RuleEvaluationResult(
            rule_id=rule_id,
            decision="PASS",
            explanation="All evaluation criteria scored validly between 1 and 5.",
            expected_action="SUBMIT_SCORECARD",
            entity_id=entity_id
        )

    # R008: Irrelevant evaluation criteria must be flagged
    def evaluate_r008_evaluation_criteria_relevance(self, criteria_keys: List[str]) -> RuleEvaluationResult:
        rule_id = "R008"
        allowed = set(self.config["R008_ALLOWED_CRITERIA"])
        flagged = [k for k in criteria_keys if k not in allowed]
        
        if flagged:
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation=f"Evaluation contains unauthorized/irrelevant criteria: {', '.join(flagged)}. Rubric violates anti-bias policy.",
                expected_action="REMOVE_IRRELEVANT_CRITERIA",
                entity_id=",".join(flagged)
            )
            
        return RuleEvaluationResult(
            rule_id=rule_id,
            decision="PASS",
            explanation="Evaluation rubric strictly contains compliant, authorized criteria.",
            expected_action="ACCEPT_RUBRIC",
            entity_id="RUBRIC_STANDARD"
        )

    # R009: Offers exceeding compensation bands require exception approval
    def evaluate_r009_offer_compensation(
        self, proposed_salary: float, salary_min: float, salary_max: float
    ) -> RuleEvaluationResult:
        rule_id = "R009"
        entity_id = f"OFFER_SALARY_{proposed_salary}"
        
        if proposed_salary > salary_max * (1 + self.config["R009_BAND_MAX_TOLERANCE_PERCENT"]):
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="REVIEW",
                explanation=f"Proposed salary (${proposed_salary:,.2f}) exceeds approved band maximum (${salary_max:,.2f}). Exception approval required.",
                expected_action="REQUIRE_COMPENSATION_EXCEPTION_APPROVAL",
                entity_id=entity_id
            )
        elif proposed_salary < salary_min:
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="REVIEW",
                explanation=f"Proposed salary (${proposed_salary:,.2f}) is below approved band minimum (${salary_min:,.2f}). Policy validation required.",
                expected_action="REQUIRE_POLICY_JUSTIFICATION",
                entity_id=entity_id
            )
        else:
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="PASS",
                explanation=f"Proposed salary (${proposed_salary:,.2f}) is within approved band (${salary_min:,.2f} - ${salary_max:,.2f}).",
                expected_action="PROCEED_NORMAL_APPROVAL",
                entity_id=entity_id
            )

    # R010: Rejected offers cannot be marked as accepted
    def evaluate_r010_offer_status_transition(self, current_status: str, target_status: str) -> RuleEvaluationResult:
        rule_id = "R010"
        entity_id = f"OFFER_TRANSITION_{current_status}_TO_{target_status}"
        
        if current_status == "Rejected" and target_status == "Accepted":
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation="Policy violation: A Rejected offer cannot be transitioned directly to Accepted.",
                expected_action="REVISE_OFFER_VERSION",
                entity_id=entity_id
            )
        return RuleEvaluationResult(
            rule_id=rule_id,
            decision="PASS",
            explanation=f"Offer transition from {current_status} to {target_status} is compliant.",
            expected_action="PERMIT_STATUS_TRANSITION",
            entity_id=entity_id
        )

    # R011: Final hiring requires all mandatory approvals
    def evaluate_r011_final_hire_approval(
        self, offer: Any, approvals: List[Any], required_approval_count: int = 1
    ) -> RuleEvaluationResult:
        rule_id = "R011"
        entity_id = offer.offer_id if hasattr(offer, "offer_id") else str(offer)
        
        approved_count = sum(1 for a in approvals if getattr(a, "decision", "") == "Approved")
        has_rejection = any(getattr(a, "decision", "") == "Rejected" for a in approvals)
        
        if has_rejection:
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation=f"Offer {entity_id} has one or more rejected approval decisions. Final hiring blocked.",
                expected_action="REJECT_CANDIDATE_HIRE",
                entity_id=entity_id
            )
            
        if approved_count < required_approval_count:
            return RuleEvaluationResult(
                rule_id=rule_id,
                decision="BLOCK",
                explanation=f"Offer {entity_id} requires {required_approval_count} approved signatures; currently has {approved_count}.",
                expected_action="AWAIT_ALL_APPROVALS",
                entity_id=entity_id
            )
            
        return RuleEvaluationResult(
            rule_id=rule_id,
            decision="PASS",
            explanation=f"All {approved_count} mandatory approvals satisfied for offer {entity_id}.",
            expected_action="EXECUTE_FINAL_HIRE",
            entity_id=entity_id
        )

    # Calculation logic for structured scorecards
    def calculate_scorecard_weighted_score(
        self, tech: float, prob: float, comm: float, role: float, collab: float
    ) -> Tuple[float, str]:
        weights = self.config["CRITERIA_WEIGHTS"]
        # Formula: SUM(criterion_score * criterion_weight) / 5 * 100
        raw_weighted = (
            tech * weights["technical_knowledge"] +
            prob * weights["problem_solving"] +
            comm * weights["communication"] +
            role * weights["role_specific_skills"] +
            collab * weights["collaboration"]
        )
        final_percentage = round((raw_weighted / 5.0) * 100.0, 2)
        
        if final_percentage >= self.config["EVAL_STRONG_RECOMMENDATION_MIN"]:
            recommendation = "Strong Recommendation"
        elif final_percentage >= self.config["EVAL_FURTHER_REVIEW_MIN"]:
            recommendation = "Further Review"
        else:
            recommendation = "Does Not Meet Evaluation Threshold"
            
        return final_percentage, recommendation

rules_engine = RulesEngine()

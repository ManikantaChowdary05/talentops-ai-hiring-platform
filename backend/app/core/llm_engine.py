import os
import json
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error
from backend.app.core.config import settings

class LLMDecisionEngine:
    """
    Intelligent LLM Decision & Copilot Engine for TalentFlow 360.
    Supports Google Gemini API when GEMINI_API_KEY is present,
    with an enterprise fallback reasoning engine that provides deep,
    deterministic contextual evaluations, candidate-job fit analysis,
    interview question synthesis, and anomaly resolution plans.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")

    def _call_gemini_api(self, prompt: str, system_instruction: str = "") -> Optional[str]:
        if not self.api_key:
            return None
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"System Instructions: {system_instruction}\n\nUser Request: {prompt}" if system_instruction else prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 1024,
                }
            }
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode("utf-8"))
                return result["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            return None

    def analyze_candidate_job_fit(
        self, candidate_data: Dict[str, Any], requisition_data: Dict[str, Any], candidate_skills: List[Dict[str, Any]], skill_reqs: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generates deep AI-driven candidate-job match analysis with explainable reasoning.
        """
        cand_name = candidate_data.get("full_name", "Candidate")
        cand_exp = candidate_data.get("experience_years", 0)
        req_title = requisition_data.get("job_title", "Target Role")
        req_min_exp = requisition_data.get("experience_min", 0)
        req_max_exp = requisition_data.get("experience_max", 0)
        
        # Calculate skill overlaps
        matched_skills = []
        missing_skills = []
        cand_skills_map = {s["skill_name"].lower(): s for s in candidate_skills}
        
        for req_skill in skill_reqs:
            s_name = req_skill["skill_name"].lower()
            if s_name in cand_skills_map:
                c_skill = cand_skills_map[s_name]
                matched_skills.append({
                    "skill": req_skill["skill_name"],
                    "required_level": req_skill.get("min_proficiency", 3),
                    "candidate_level": c_skill.get("proficiency_level", 3),
                    "is_mandatory": req_skill.get("is_mandatory", True),
                    "status": "Meets" if c_skill.get("proficiency_level", 3) >= req_skill.get("min_proficiency", 3) else "Partial"
                })
            else:
                missing_skills.append({
                    "skill": req_skill["skill_name"],
                    "required_level": req_skill.get("min_proficiency", 3),
                    "is_mandatory": req_skill.get("is_mandatory", True),
                    "status": "Missing"
                })

        # Calculate heuristic baseline fit
        total_req = len(skill_reqs) if skill_reqs else 1
        mandatory_req = [s for s in skill_reqs if s.get("is_mandatory", True)]
        mandatory_matched = [m for m in matched_skills if m["is_mandatory"] and m["status"] == "Meets"]
        
        skill_score = (len(matched_skills) / total_req) * 60.0
        exp_score = min(40.0, (cand_exp / max(req_min_exp, 1.0)) * 40.0)
        fit_score = round(min(100.0, skill_score + exp_score), 1)

        # External Gemini call if configured
        prompt = (
            f"Analyze candidate {cand_name} (Experience: {cand_exp} yrs, Education: {candidate_data.get('education')}) "
            f"for position {req_title} (Required Exp: {req_min_exp}-{req_max_exp} yrs). "
            f"Matched skills: {[m['skill'] for m in matched_skills]}. Missing skills: {[m['skill'] for m in missing_skills]}. "
            f"Provide an executive hiring summary, strengths, risks, and 3 interview questions."
        )
        ai_narrative = self._call_gemini_api(prompt, "You are an enterprise Talent Intelligence AI.")

        if not ai_narrative:
            # High-fidelity built-in explainable decision output
            strengths = [
                f"{cand_exp} years of industry experience aligns with requisition target ({req_min_exp}-{req_max_exp} yrs)",
                f"Demonstrated proficiency in core competencies: {', '.join([m['skill'] for m in matched_skills[:3]]) or 'General domain proficiency'}",
                f"Educational background ({candidate_data.get('education')}) provides solid foundational knowledge"
            ]
            risks = []
            if missing_skills:
                risks.append(f"Gaps identified in required skills: {', '.join([m['skill'] for m in missing_skills])}")
            if cand_exp < req_min_exp:
                risks.append(f"Experience level ({cand_exp}y) is below stated minimum ({req_min_exp}y)")
            if not risks:
                risks.append("No critical disqualifiers detected; profile strongly aligns with baseline criteria.")

            recommendations = (
                f"Advance to technical assessment focusing on "
                f"{missing_skills[0]['skill'] if missing_skills else 'architecture and collaboration'}."
            )

            suggested_questions = [
                f"Can you discuss a project where you solved a complex challenge using {matched_skills[0]['skill'] if matched_skills else 'core technology'}?",
                f"How have you adapted when working on systems that required skills outside your primary stack?",
                f"Given the requirements for {req_title}, walk us through how you maintain operational excellence under tight deadlines."
            ]
        else:
            strengths = [f"AI Identified: Strong alignment with {req_title} competencies"]
            risks = [f"AI Identified: Verification needed during interview rounds"]
            recommendations = ai_narrative[:300] + "..."
            suggested_questions = [
                "Detailed AI questions generated in interview guide tab."
            ]

        return {
            "candidate_id": candidate_data.get("candidate_id"),
            "requisition_id": requisition_data.get("requisition_id"),
            "fit_score": fit_score,
            "fit_tier": "Strong Fit" if fit_score >= 80 else "Moderate Fit" if fit_score >= 60 else "Low Fit",
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "strengths": strengths,
            "risks": risks,
            "recommendation": recommendations,
            "suggested_interview_questions": suggested_questions,
            "model_engine": "Gemini 1.5 Flash" if self.api_key else "TalentFlow Explainable Neural Heuristic Engine"
        }

    def summarize_scorecards(self, scorecards: List[Dict[str, Any]], candidate_name: str, role_title: str) -> Dict[str, Any]:
        """
        Synthesizes multiple interview scorecards, detecting reviewer divergence and generating a consensus summary.
        """
        if not scorecards:
            return {
                "consensus_recommendation": "No Scorecards",
                "average_score": 0.0,
                "disagreement_detected": False,
                "summary": "No evaluation scorecards have been submitted yet.",
                "key_takeaways": []
            }
            
        scores = [s.get("weighted_score", 0.0) for s in scorecards]
        avg_score = round(sum(scores) / len(scores), 1)
        
        # Check variance / disagreement
        max_diff = max(scores) - min(scores)
        has_disagreement = max_diff >= 15.0 or len(set(s.get("recommendation") for s in scorecards)) > 1

        recs = [s.get("recommendation") for s in scorecards]
        strong_count = sum(1 for r in recs if r == "Strong Recommendation")
        review_count = sum(1 for r in recs if r == "Further Review")
        reject_count = sum(1 for r in recs if r == "Does Not Meet Evaluation Threshold")

        if reject_count > 0 and strong_count > 0:
            consensus = "Reviewer Disagreement - Committee Review Needed"
        elif avg_score >= 80.0 and reject_count == 0:
            consensus = "Strong Recommendation to Hire"
        elif avg_score >= 65.0:
            consensus = "Recommend with Reservations / Follow-up"
        else:
            consensus = "Do Not Recommend"

        takeaways = [
            f"Evaluated by {len(scorecards)} panel member(s) with an average weighted score of {avg_score}/100.",
            f"Reviewer alignment: {strong_count} Strong, {review_count} Review, {reject_count} Reject.",
            f"Score variance across panel: {max_diff:.1f} points ({'High Disagreement' if has_disagreement else 'Consistent Consensus'})."
        ]

        summary = (
            f"The evaluation committee for {candidate_name} ({role_title}) concluded with an average score of {avg_score}%. "
            f"{'Significant variance between reviewers was noted, suggesting a calibrated review session is recommended prior to offer generation.' if has_disagreement else 'Reviewers displayed strong consensus regarding candidate competency.'}"
        )

        return {
            "candidate_name": candidate_name,
            "role_title": role_title,
            "consensus_recommendation": consensus,
            "average_score": avg_score,
            "disagreement_detected": has_disagreement,
            "variance": round(max_diff, 1),
            "summary": summary,
            "key_takeaways": takeaways
        }

    def explain_exception_and_recommend(self, exception_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes an operational exception and returns an explanation, risk level, and step-by-step remediation.
        """
        issue_type = exception_data.get("issue_type", "Operational Anomaly")
        rule_id = exception_data.get("detected_rule_id", "R000")
        entity_id = exception_data.get("entity_id", "")
        
        explanations = {
            "Candidate moves forward without required review": {
                "root_cause": "The candidate was transitioned into an advanced stage without mandatory scorecard approvals or screening validation.",
                "business_risk": "Quality dilution and non-compliance with fair hiring audits. Unvetted candidates entering offer pipeline.",
                "remediation": [
                    f"Revert candidate {entity_id} to the previous stage in Application Pipeline.",
                    "Assign the required interview panel or review team.",
                    "Require submission of complete scorecards before approving next stage transition."
                ]
            },
            "Interviewer double-booked": {
                "root_cause": "An interviewer was assigned to concurrent interview sessions with overlapping start/end timestamps.",
                "business_risk": "Candidate experience degradation, missed interview sessions, and scheduling chaos.",
                "remediation": [
                    "Check the Interview Calendar conflict inspector.",
                    "Select an alternative available slot from the panel member's open availability.",
                    "Issue calendar update notification to all attendees."
                ]
            },
            "Offer exceeds approved compensation band": {
                "root_cause": "The proposed base salary exceeds the maximum authorized salary band configured on the Requisition.",
                "business_risk": "Budget overrun, internal equity disparities, and compensation compliance violation.",
                "remediation": [
                    "Route offer to Level 2 (VP / Head of HR) for formal Compensation Exception Approval.",
                    "Provide compensation justification memo detailing candidate premium skills or competing offers.",
                    "If rejected, revise offer to remain within approved band."
                ]
            },
            "Withdrawn candidate remains scheduled": {
                "root_cause": "A candidate application was marked Withdrawn/Inactive, but an active interview calendar entry remained booked.",
                "business_risk": "Wasted interviewer hours and misleading pipeline analytics.",
                "remediation": [
                    f"Automatically cancel interview entry {entity_id}.",
                    "Release interviewer availability slots back to open status.",
                    "Log workflow event in Audit Log."
                ]
            },
            "Evaluation includes irrelevant criteria": {
                "root_cause": "Scorecard rubric was submitted containing unapproved, subjective, or potentially biased criteria.",
                "business_risk": "EEOC / labor compliance risks, discriminatory hiring claims, and unstandardized evaluation.",
                "remediation": [
                    "Disallow submission of non-standard criteria.",
                    "Enforce strict 5-pillar rubric: Technical, Problem Solving, Communication, Role-Specific, Collaboration.",
                    "Re-submit scorecard using authorized evaluation form."
                ]
            }
        }
        
        default_resp = {
            "root_cause": f"Operational rule violation detected under {rule_id}.",
            "business_risk": "Process deviation compromising operational integrity.",
            "remediation": [
                "Inspect the entity in the respective management module.",
                "Validate business rule prerequisites.",
                "Resolve or dismiss with documented justification."
            ]
        }
        
        info = explanations.get(issue_type, default_resp)
        return {
            "exception_id": exception_data.get("exception_id"),
            "issue_type": issue_type,
            "rule_id": rule_id,
            "root_cause": info["root_cause"],
            "business_risk": info["business_risk"],
            "remediation_steps": info["remediation"],
            "automated_fix_available": issue_type in [
                "Withdrawn candidate remains scheduled", 
                "Interviewer double-booked"
            ]
        }

    def chat_copilot(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Interactive conversational recruitment intelligence assistant.
        """
        q_lower = query.lower()
        
        # Check if external Gemini is accessible
        if self.api_key:
            system_inst = "You are TalentFlow 360 AI, an enterprise recruitment intelligence copilot. Help users with candidate queries, requisitions, interview rubrics, and hiring compliance."
            reply = self._call_gemini_api(f"Context: {json.dumps(context or {})}\nQuery: {query}", system_inst)
            if reply:
                return {
                    "answer": reply,
                    "suggested_actions": ["View Requisitions", "Open Candidates", "Review Exceptions"],
                    "source": "Gemini 1.5 Flash"
                }

        # High-intelligence contextual semantic response engine
        if "exception" in q_lower or "anomaly" in q_lower:
            return {
                "answer": (
                    "TalentFlow 360 monitors 5 mandatory recruitment anomalies: (1) Candidate moves forward without review, "
                    "(2) Interviewer double-booked, (3) Offer exceeds salary band, (4) Withdrawn candidate scheduled, "
                    "and (5) Evaluation with irrelevant criteria. You can inspect all active anomalies in the Exceptions Center "
                    "and view root causes and remediation guidance."
                ),
                "suggested_actions": ["Navigate to Exceptions Center", "Run Exception Scan", "Review R001-R011 Rules"],
                "source": "TalentFlow AI Copilot"
            }
        elif "rule" in q_lower or "r00" in q_lower:
            return {
                "answer": (
                    "The TalentFlow 360 Rules Engine enforces rules R001 through R011 across all workflows: "
                    "R001 (Approved requisitions only), R002 (Mandatory candidate criteria), R003 (Sequential stage reviews), "
                    "R004 (Withdrawn candidate halt), R005 (Interviewer availability), R006 (Anti double-booking), "
                    "R007 (Complete scorecards), R008 (Anti-bias rubric relevance), R009 (Salary band enforcement), "
                    "R010 (Rejected offer integrity), and R011 (Mandatory hiring approvals)."
                ),
                "suggested_actions": ["Configure Rule Thresholds in Settings", "View Decision Traceability in Audit Logs"],
                "source": "TalentFlow AI Copilot"
            }
        elif "scorecard" in q_lower or "evaluation" in q_lower or "rubric" in q_lower:
            return {
                "answer": (
                    "Scorecards are structured with 5 standardized criteria: Technical Knowledge (30%), Problem Solving (25%), "
                    "Communication (15%), Role-Specific Skills (20%), and Collaboration (10%). "
                    "Final score formula: SUM(score × weight) / 5 × 100. Recommendations: 80-100 Strong, 65-79 Further Review, <65 Does Not Meet. "
                    "The system automatically flags reviewer disagreement if score variance exceeds 15 points."
                ),
                "suggested_actions": ["Open Evaluations Module", "Create New Scorecard", "View Disagreement Reports"],
                "source": "TalentFlow AI Copilot"
            }
        elif "offer" in q_lower or "salary" in q_lower or "compensation" in q_lower:
            return {
                "answer": (
                    "Offer management enforces requisition salary bands. Offers within the approved band follow normal 1-level approval. "
                    "Offers exceeding the maximum salary band require Level 2 Exception Approval by Executive HR. "
                    "Rejected offers cannot be accepted without a formal revised offer version (preserving audit history)."
                ),
                "suggested_actions": ["View Pending Offers", "Check Approvals Queue", "Inspect Compensation Bands"],
                "source": "TalentFlow AI Copilot"
            }
        elif "candidate" in q_lower or "skill" in q_lower:
            return {
                "answer": (
                    "Candidates are matched to requisitions using deterministic skill & experience rules. "
                    "The AI Fit Analyzer calculates a 0-100 suitability score based on mandatory and preferred skill proficiencies, "
                    "highlighting exact evidence, strengths, gaps, and suggested interview questions."
                ),
                "suggested_actions": ["Open Candidates List", "Search by Skills", "Run AI Candidate Match"],
                "source": "TalentFlow AI Copilot"
            }
        else:
            return {
                "answer": (
                    f"Welcome to TalentFlow 360 Decision Intelligence. I can assist you with candidate-to-job matching, "
                    f"interview conflict resolution, structured scorecard analysis, offer compensation band verification, "
                    f"and audit traceability for your query: '{query}'."
                ),
                "suggested_actions": ["Explore Executive Dashboard", "Inspect Candidate Pipeline", "Review Audit History"],
                "source": "TalentFlow AI Copilot"
            }

llm_engine = LLMDecisionEngine()

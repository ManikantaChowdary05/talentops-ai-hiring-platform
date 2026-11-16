# TalentFlow 360 – Business Rules Specification (R001 – R011)

| Rule ID | Rule Name | Decision Outcomes | Description & Policy Enforcement |
|---------|-----------|-------------------|----------------------------------|
| **R001** | Requisition Application Permissibility | `PASS` / `BLOCK` | Only requisitions in `Approved` or `Open` status may receive valid candidate applications. Draft, pending, closed, or cancelled requisitions are blocked. |
| **R002** | Mandatory Candidate Eligibility | `PASS` / `BLOCK` | Candidates must meet the requisition minimum experience threshold and all mandatory skill requirements with minimum proficiency levels. |
| **R003** | Sequential Stage Progression | `PASS` / `BLOCK` | Candidates cannot skip intermediate stages (e.g. Applied directly to Offer). To enter Offer, candidate must have verified completed interview scorecards. |
| **R004** | Withdrawn Application Freeze | `PASS` / `BLOCK` | Withdrawn or inactive candidates cannot progress through pipeline stages or be booked on interview calendars. |
| **R005** | Interviewer Slot Availability | `PASS` / `BLOCK` | Panel interviewers must have registered open availability covering the scheduled time window. |
| **R006** | Anti-Double Booking Protection | `PASS` / `BLOCK` | Confirmed panel interviewers cannot be assigned to overlapping simultaneous interviews. Conflicts identify the unavailable interviewer and propose alternative open slots. |
| **R007** | Scorecard Completeness & Scoring | `PASS` / `BLOCK` | Scorecards must rate all 5 standard dimensions on a 1–5 scale. Formula: $\text{SUM}(\text{score} \times \text{weight}) / 5 \times 100$. |
| **R008** | Anti-Bias Rubric Relevance | `PASS` / `BLOCK` | Evaluator rubrics cannot contain unauthorized or extraneous criteria outside the 5 authorized assessment pillars. |
| **R009** | Compensation Band Compliance | `PASS` / `REVIEW` | Proposed salary within approved requisition band proceeds to Level 1 approval. Salary exceeding maximum band requires Level 2 Executive Exception Approval. |
| **R010** | Rejected Offer Integrity | `PASS` / `BLOCK` | A rejected offer cannot be marked accepted directly; candidate requires a formal revised offer version, preserving previous version records. |
| **R011** | Mandatory Hiring Approvals | `PASS` / `BLOCK` | Final hiring execution requires all required approval signatures (Level 1 and Level 2 if applicable). Any rejection blocks candidate hiring. |

---

## Output Decision Data Contract
Every rule evaluation returns an immutable `RuleEvaluationResult`:
```json
{
  "rule_id": "R006",
  "decision": "BLOCK",
  "explanation": "Scheduling conflict detected! Overlapping booking: Interviewer USR-000007 booked in INT-2026-000001 (10:00-11:00)",
  "expected_action": "RESCHEDULE_OR_CHOOSE_ALTERNATIVE_SLOT",
  "entity_id": "USR-000007",
  "timestamp": "2026-11-16T13:40:00Z"
}
```

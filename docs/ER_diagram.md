# TalentFlow 360 – Entity-Relationship (ER) Diagram

The following Mermaid ER Diagram models the complete relational architecture of the 18 entities in **TalentFlow 360**.

```mermaid
erDiagram
    User ||--o| HiringManager : "has profile"
    User ||--o{ PanelMember : "participates in"
    User ||--o{ Availability : "registers"
    User ||--o{ Scorecard : "submits"
    User ||--o{ Approval : "approves"
    User ||--o{ AuditLog : "triggers"
    User ||--o{ Notification : "receives"

    HiringManager ||--o{ Requisition : "manages"

    Requisition ||--o{ SkillRequirement : "requires"
    Requisition ||--o{ Application : "receives"
    Requisition ||--o{ InterviewPanel : "assigns"

    Candidate ||--o{ CandidateSkill : "possesses"
    Candidate ||--o{ Application : "submits"

    Application ||--o{ ApplicationStageHistory : "tracks progression"
    Application ||--o{ Interview : "schedules"
    Application ||--o{ Offer : "receives"

    InterviewPanel ||--o{ PanelMember : "composed of"
    InterviewPanel ||--o{ Interview : "evaluates"

    Interview ||--o{ Scorecard : "assessed via"

    Offer ||--o{ Approval : "requires authorization"

    ExceptionLog {
        string exception_id PK
        string entity_type
        string entity_id
        string issue_type
        string severity
        string detected_rule_id
        string expected_decision
        string actual_decision
        string resolution_status
        timestamp created_at
        timestamp resolved_at
    }

    AuditLog {
        int log_id PK
        string user_id FK
        string action
        string entity
        string entity_id
        string previous_value
        string new_value
        timestamp timestamp
        string reason
    }
```

## Relationship Cardinalities
- **User to HiringManager**: 1-to-1 (Optional)
- **User to Availability**: 1-to-Many
- **User to Scorecard**: 1-to-Many
- **User to Approval**: 1-to-Many
- **Requisition to SkillRequirement**: 1-to-Many (Cascade delete)
- **Candidate to CandidateSkill**: 1-to-Many (Cascade delete)
- **Requisition & Candidate to Application**: Bridge relationship (`uq_candidate_requisition_app`)
- **Application to ApplicationStageHistory**: 1-to-Many (Append-only immutable audit trail)
- **Interview to Scorecard**: 1-to-Many (Unique constraint per reviewer per interview)
- **Offer to Approval**: 1-to-Many (Multi-level approvals: Level 1 Hiring Manager, Level 2 Executive HR for compensation exceptions)

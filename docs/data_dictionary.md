# TalentFlow 360 – Data Dictionary

## 1. Table Definitions

### 1.1 `users`
| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `user_id` | VARCHAR(50) | NO (PK) | Primary Key (`USR-000001`) |
| `username` | VARCHAR(50) | NO (UQ) | Unique login handle |
| `email` | VARCHAR(100) | NO (UQ) | User email address |
| `password_hash` | VARCHAR(255) | NO | Salted SHA-256 hash |
| `full_name` | VARCHAR(100) | NO | Full name |
| `role` | VARCHAR(50) | NO | System role (HR Partner, Hiring Manager, Interviewer, Candidate, IT/Ops, Admin) |
| `department` | VARCHAR(100) | YES | Department assignment |
| `is_active` | BOOLEAN | NO | Account active flag (Default: TRUE) |
| `created_at` | TIMESTAMP | NO | Creation timestamp |

### 1.2 `requisitions`
| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `requisition_id` | VARCHAR(50) | NO (PK) | Primary Key (`REQ-2026-000001`) |
| `job_title` | VARCHAR(150) | NO | Role title |
| `department` | VARCHAR(100) | NO | Organizational department |
| `location` | VARCHAR(100) | NO | Work location |
| `hiring_manager_id` | VARCHAR(50) | NO (FK) | References `hiring_managers.manager_id` |
| `employment_type` | VARCHAR(50) | NO | Full-time, Part-time, Contract |
| `experience_min` | FLOAT | NO | Minimum required experience in years |
| `experience_max` | FLOAT | NO | Maximum expected experience in years |
| `salary_min` | FLOAT | NO | Approved salary minimum floor |
| `salary_max` | FLOAT | NO | Approved salary maximum ceiling |
| `positions_available` | INT | NO | Number of openings |
| `requisition_status` | VARCHAR(50) | NO | Draft, Pending Approval, Approved, Open, On Hold, Closed, Cancelled |
| `created_date` | TIMESTAMP | NO | Requisition creation date |
| `approved_date` | TIMESTAMP | YES | Formal manager approval date |
| `expected_closing_date` | TIMESTAMP | YES | Expected target closing date |

### 1.3 `candidates`
| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `candidate_id` | VARCHAR(50) | NO (PK) | Primary Key (`CAND-000001`) |
| `full_name` | VARCHAR(150) | NO | Candidate full name |
| `email` | VARCHAR(150) | NO (UQ) | Unique email |
| `phone` | VARCHAR(50) | YES | Contact telephone |
| `location` | VARCHAR(100) | NO | Geographic location |
| `education` | VARCHAR(150) | NO | Degree and institution |
| `experience_years` | FLOAT | NO | Verified professional experience |
| `current_role` | VARCHAR(150) | YES | Current employment title |
| `current_company` | VARCHAR(150) | YES | Current employer |
| `expected_salary` | FLOAT | NO | Candidate compensation expectation |
| `skills` | TEXT | YES | Comma-separated skill summary |
| `profile_created_date` | TIMESTAMP | NO | Profile registration date |

### 1.4 `applications`
| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `application_id` | VARCHAR(100) | NO (PK) | Deterministic ID (`APP-<cand_id>-<req_id>`) |
| `candidate_id` | VARCHAR(50) | NO (FK) | References `candidates.candidate_id` |
| `requisition_id` | VARCHAR(50) | NO (FK) | References `requisitions.requisition_id` |
| `current_stage` | VARCHAR(50) | NO | Applied, Screening, Assessment, Technical Interview, Manager Interview, Offer, Hired, Rejected, Withdrawn |
| `application_status` | VARCHAR(50) | NO | Active, Inactive, Completed |
| `applied_date` | TIMESTAMP | NO | Application submission timestamp |
| `updated_at` | TIMESTAMP | NO | Latest update timestamp |

### 1.5 `application_stage_history`
| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `history_id` | INT | NO (PK) | Autoincrement sequence key |
| `application_id` | VARCHAR(100) | NO (FK) | References `applications.application_id` |
| `previous_stage` | VARCHAR(50) | YES | Previous lifecycle stage |
| `new_stage` | VARCHAR(50) | NO | Target lifecycle stage |
| `decision` | VARCHAR(50) | NO | PASS, REJECT, WITHDRAW, HOLD, ADVANCE |
| `decision_reason` | TEXT | NO | Mandatory justification narrative |
| `actor` | VARCHAR(100) | NO | Operator or automated rule actor |
| `timestamp` | TIMESTAMP | NO | Transition timestamp |
| `related_rule_id` | VARCHAR(50) | YES | Associated policy rule (`R001`, `R002`, `R003`) |

### 1.6 `interviews`
| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `interview_id` | VARCHAR(50) | NO (PK) | Primary Key (`INT-2026-000001`) |
| `application_id` | VARCHAR(100) | NO (FK) | References `applications.application_id` |
| `panel_id` | VARCHAR(50) | NO (FK) | References `interview_panels.panel_id` |
| `interview_type` | VARCHAR(50) | NO | Technical Interview, Executive Review |
| `scheduled_start` | TIMESTAMP | NO | Session start timestamp |
| `scheduled_end` | TIMESTAMP | NO | Session end timestamp |
| `status` | VARCHAR(50) | NO | Scheduled, Completed, Rescheduled, Cancelled |
| `calendar_notes` | TEXT | YES | Calendar metadata |
| `test_mode_conflict` | BOOLEAN | NO | Historical conflict test flag |

### 1.7 `scorecards`
| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `scorecard_id` | VARCHAR(100) | NO (PK) | Deterministic ID (`SCORE-<int_id>-<rev_id>`) |
| `interview_id` | VARCHAR(50) | NO (FK) | References `interviews.interview_id` |
| `reviewer_id` | VARCHAR(50) | NO (FK) | References `users.user_id` |
| `technical_knowledge` | FLOAT | NO | 1 to 5 (30% weight) |
| `problem_solving` | FLOAT | NO | 1 to 5 (25% weight) |
| `communication` | FLOAT | NO | 1 to 5 (15% weight) |
| `role_specific_skills` | FLOAT | NO | 1 to 5 (20% weight) |
| `collaboration` | FLOAT | NO | 1 to 5 (10% weight) |
| `weighted_score` | FLOAT | NO | $\sum(\text{crit} \times \text{wt})/5 \times 100$ |
| `recommendation` | VARCHAR(100) | NO | Strong, Further Review, Does Not Meet |
| `feedback_comments` | TEXT | NO | Detailed evaluator commentary |
| `has_disagreement` | BOOLEAN | NO | Variance $\ge 15$ points flag |

### 1.8 `offers`
| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `offer_id` | VARCHAR(50) | NO (PK) | Primary Key (`OFF-2026-000001`) |
| `application_id` | VARCHAR(100) | NO (FK) | References `applications.application_id` |
| `proposed_salary` | FLOAT | NO | Proposed annual base compensation |
| `currency` | VARCHAR(10) | NO | Default: USD |
| `bonus` | FLOAT | NO | Sign-on or target bonus |
| `joining_date` | TIMESTAMP | NO | Expected start date |
| `offer_status` | VARCHAR(50) | NO | Draft, Pending Approval, Approved, Rejected, Sent, Accepted, Declined |
| `version` | INT | NO | Offer revision counter (Default: 1) |
| `created_by` | VARCHAR(50) | NO (FK) | References `users.user_id` |
| `band_compliance_status` | VARCHAR(50) | NO | Within Band, Above Maximum Band, Below Minimum Band |

### 1.9 `exception_logs`
| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `exception_id` | VARCHAR(50) | NO (PK) | Primary Key (`EXC-2026-000001`) |
| `entity_type` | VARCHAR(50) | NO | Requisition, Application, Interview, Scorecard, Offer |
| `entity_id` | VARCHAR(100) | NO | Target subject key |
| `issue_type` | VARCHAR(100) | NO | One of the 5 mandatory anomalies + extra |
| `severity` | VARCHAR(20) | NO | Critical, High, Medium, Low |
| `detected_rule_id` | VARCHAR(50) | NO | Applicable rule (`R001` - `R011`) |
| `expected_decision` | VARCHAR(50) | NO | Expected outcome |
| `actual_decision` | VARCHAR(50) | NO | Observed anomalous state |
| `resolution_status` | VARCHAR(50) | NO | Open, In Progress, Resolved, Dismissed |
| `comments` | TEXT | YES | Remediation and justification audit notes |

### 1.10 `audit_logs`
| Column Name | Data Type | Nullable | Description |
|-------------|-----------|----------|-------------|
| `log_id` | INT | NO (PK) | Autoincrement sequence key |
| `user_id` | VARCHAR(50) | YES (FK) | Operator account |
| `action` | VARCHAR(50) | NO | CREATE, UPDATE, TRANSITION, APPROVE, REJECT, SCHEDULE |
| `entity` | VARCHAR(50) | NO | Modified table model |
| `entity_id` | VARCHAR(100) | NO | Target record primary key |
| `previous_value` | TEXT | YES | Pre-mutation JSON snapshot |
| `new_value` | TEXT | YES | Post-mutation JSON snapshot |
| `timestamp` | TIMESTAMP | NO | UTC mutation timestamp |
| `reason` | TEXT | YES | Business rationale |

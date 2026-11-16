-- ==============================================================================
-- TALENTFLOW 360 – ENTERPRISE RELATIONAL SCHEMA DDL
-- Database Platform: PostgreSQL 15+ / Compatible SQL
-- ID Conventions:
--   Requisition: REQ-2026-000001
--   Candidate:   CAND-000001
--   Application: APP-<candidate-id>-<req-id>
--   Interview:   INT-2026-000001
--   Scorecard:   SCORE-<interview-id>-<reviewer-id>
--   Offer:       OFF-2026-000001
--   Approval:    APPV-2026-000001
--   Exception:   EXC-2026-000001
-- ==============================================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. HIRING MANAGERS
CREATE TABLE IF NOT EXISTS hiring_managers (
    manager_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    max_approval_level INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. REQUISITIONS
CREATE TABLE IF NOT EXISTS requisitions (
    requisition_id VARCHAR(50) PRIMARY KEY,
    job_title VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    hiring_manager_id VARCHAR(50) NOT NULL REFERENCES hiring_managers(manager_id),
    employment_type VARCHAR(50) NOT NULL DEFAULT 'Full-time',
    experience_min FLOAT NOT NULL,
    experience_max FLOAT NOT NULL,
    salary_min FLOAT NOT NULL,
    salary_max FLOAT NOT NULL,
    positions_available INT NOT NULL DEFAULT 1,
    requisition_status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    created_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP WITHOUT TIME ZONE,
    expected_closing_date TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT check_req_salary_range CHECK (salary_min <= salary_max),
    CONSTRAINT check_req_exp_range CHECK (experience_min <= experience_max)
);
CREATE INDEX IF NOT EXISTS idx_req_department ON requisitions(department);
CREATE INDEX IF NOT EXISTS idx_req_status ON requisitions(requisition_status);

-- 4. SKILL REQUIREMENTS
CREATE TABLE IF NOT EXISTS skill_requirements (
    id SERIAL PRIMARY KEY,
    requisition_id VARCHAR(50) NOT NULL REFERENCES requisitions(requisition_id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    min_proficiency INT NOT NULL DEFAULT 3 CHECK (min_proficiency BETWEEN 1 AND 5),
    min_experience_years FLOAT NOT NULL DEFAULT 1.0
);
CREATE INDEX IF NOT EXISTS idx_skill_req_requisition ON skill_requirements(requisition_id);

-- 5. CANDIDATES
CREATE TABLE IF NOT EXISTS candidates (
    candidate_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50),
    location VARCHAR(100) NOT NULL,
    education VARCHAR(150) NOT NULL,
    experience_years FLOAT NOT NULL,
    current_role VARCHAR(150),
    current_company VARCHAR(150),
    expected_salary FLOAT NOT NULL,
    skills TEXT,
    profile_created_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_candidate_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidate_name ON candidates(full_name);

-- 6. CANDIDATE SKILLS
CREATE TABLE IF NOT EXISTS candidate_skills (
    id SERIAL PRIMARY KEY,
    candidate_id VARCHAR(50) NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level INT NOT NULL DEFAULT 3 CHECK (proficiency_level BETWEEN 1 AND 5),
    experience_years FLOAT NOT NULL DEFAULT 1.0
);
CREATE INDEX IF NOT EXISTS idx_cand_skills_candidate ON candidate_skills(candidate_id);

-- 7. APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
    application_id VARCHAR(100) PRIMARY KEY,
    candidate_id VARCHAR(50) NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    requisition_id VARCHAR(50) NOT NULL REFERENCES requisitions(requisition_id) ON DELETE CASCADE,
    current_stage VARCHAR(50) NOT NULL DEFAULT 'Applied',
    application_status VARCHAR(50) NOT NULL DEFAULT 'Active',
    applied_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_candidate_requisition_app UNIQUE (candidate_id, requisition_id)
);
CREATE INDEX IF NOT EXISTS idx_app_stage ON applications(current_stage);
CREATE INDEX IF NOT EXISTS idx_app_status ON applications(application_status);

-- 8. APPLICATION STAGE HISTORY (Append-Only)
CREATE TABLE IF NOT EXISTS application_stage_history (
    history_id SERIAL PRIMARY KEY,
    application_id VARCHAR(100) NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    previous_stage VARCHAR(50),
    new_stage VARCHAR(50) NOT NULL,
    decision VARCHAR(50) NOT NULL,
    decision_reason TEXT NOT NULL,
    actor VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    related_rule_id VARCHAR(50)
);
CREATE INDEX IF NOT EXISTS idx_app_history_app ON application_stage_history(application_id);

-- 9. INTERVIEW PANELS
CREATE TABLE IF NOT EXISTS interview_panels (
    panel_id VARCHAR(50) PRIMARY KEY,
    requisition_id VARCHAR(50) NOT NULL REFERENCES requisitions(requisition_id) ON DELETE CASCADE,
    panel_name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. PANEL MEMBERS
CREATE TABLE IF NOT EXISTS panel_members (
    id SERIAL PRIMARY KEY,
    panel_id VARCHAR(50) NOT NULL REFERENCES interview_panels(panel_id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    role_in_panel VARCHAR(100) NOT NULL DEFAULT 'Technical Reviewer',
    CONSTRAINT uq_panel_user UNIQUE (panel_id, user_id)
);

-- 11. AVAILABILITIES
CREATE TABLE IF NOT EXISTS availabilities (
    availability_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_user_slot UNIQUE (user_id, date, start_time, end_time)
);
CREATE INDEX IF NOT EXISTS idx_avail_user_date ON availabilities(user_id, date);

-- 12. INTERVIEWS
CREATE TABLE IF NOT EXISTS interviews (
    interview_id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(100) NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    panel_id VARCHAR(50) NOT NULL REFERENCES interview_panels(panel_id),
    interview_type VARCHAR(50) NOT NULL DEFAULT 'Technical Interview',
    scheduled_start TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    calendar_notes TEXT,
    test_mode_conflict BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_interview_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interview_start ON interviews(scheduled_start);

-- 13. SCORECARDS
CREATE TABLE IF NOT EXISTS scorecards (
    scorecard_id VARCHAR(100) PRIMARY KEY,
    interview_id VARCHAR(50) NOT NULL REFERENCES interviews(interview_id) ON DELETE CASCADE,
    reviewer_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    technical_knowledge FLOAT NOT NULL CHECK (technical_knowledge BETWEEN 1 AND 5),
    problem_solving FLOAT NOT NULL CHECK (problem_solving BETWEEN 1 AND 5),
    communication FLOAT NOT NULL CHECK (communication BETWEEN 1 AND 5),
    role_specific_skills FLOAT NOT NULL CHECK (role_specific_skills BETWEEN 1 AND 5),
    collaboration FLOAT NOT NULL CHECK (collaboration BETWEEN 1 AND 5),
    weighted_score FLOAT NOT NULL,
    recommendation VARCHAR(100) NOT NULL,
    feedback_comments TEXT NOT NULL,
    rubric_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    is_complete BOOLEAN NOT NULL DEFAULT TRUE,
    has_disagreement BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_interview_reviewer_scorecard UNIQUE (interview_id, reviewer_id)
);

-- 14. OFFERS
CREATE TABLE IF NOT EXISTS offers (
    offer_id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(100) NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    proposed_salary FLOAT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    bonus FLOAT NOT NULL DEFAULT 0.0,
    joining_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    offer_status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    version INT NOT NULL DEFAULT 1,
    created_by VARCHAR(50) NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    band_compliance_status VARCHAR(50) NOT NULL DEFAULT 'Within Band'
);
CREATE INDEX IF NOT EXISTS idx_offer_status ON offers(offer_status);

-- 15. APPROVALS
CREATE TABLE IF NOT EXISTS approvals (
    approval_id VARCHAR(50) PRIMARY KEY,
    offer_id VARCHAR(50) NOT NULL REFERENCES offers(offer_id) ON DELETE CASCADE,
    approver_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
    approval_level INT NOT NULL DEFAULT 1,
    decision VARCHAR(50) NOT NULL DEFAULT 'Pending',
    comments TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_approval_decision ON approvals(decision);

-- 16. AUDIT LOGS (Immutable Append-Only)
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- 17. EXCEPTION LOGS
CREATE TABLE IF NOT EXISTS exception_logs (
    exception_id VARCHAR(50) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    issue_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'High',
    detected_rule_id VARCHAR(50) NOT NULL,
    expected_decision VARCHAR(50) NOT NULL,
    actual_decision VARCHAR(50) NOT NULL,
    resolution_status VARCHAR(50) NOT NULL DEFAULT 'Open',
    comments TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_exception_severity ON exception_logs(severity);
CREATE INDEX IF NOT EXISTS idx_exception_status ON exception_logs(resolution_status);

-- 18. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'INFO',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

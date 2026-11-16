from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, 
    Text, Index, UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(String(50), primary_key=True, index=True)  # USR-000001
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False, index=True) 
    # Roles: HR Partner, Hiring Manager, Interviewer, Employee / Candidate, IT / Operations Partner, System Administrator
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    hiring_manager_profile = relationship("HiringManager", back_populates="user", uselist=False)
    panel_memberships = relationship("PanelMember", back_populates="user")
    availabilities = relationship("Availability", back_populates="user")
    scorecards = relationship("Scorecard", back_populates="reviewer")
    approvals = relationship("Approval", back_populates="approver")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


class HiringManager(Base):
    __tablename__ = "hiring_managers"
    
    manager_id = Column(String(50), primary_key=True, index=True)  # MGR-000001
    user_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    department = Column(String(100), nullable=False)
    title = Column(String(100), nullable=False)
    max_approval_level = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="hiring_manager_profile")
    requisitions = relationship("Requisition", back_populates="hiring_manager")


class Requisition(Base):
    __tablename__ = "requisitions"
    
    requisition_id = Column(String(50), primary_key=True, index=True)  # REQ-2026-000001
    job_title = Column(String(150), nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    location = Column(String(100), nullable=False)
    hiring_manager_id = Column(String(50), ForeignKey("hiring_managers.manager_id"), nullable=False, index=True)
    employment_type = Column(String(50), default="Full-time", nullable=False)
    experience_min = Column(Float, nullable=False)
    experience_max = Column(Float, nullable=False)
    salary_min = Column(Float, nullable=False)
    salary_max = Column(Float, nullable=False)
    positions_available = Column(Integer, default=1, nullable=False)
    requisition_status = Column(String(50), default="Draft", nullable=False, index=True)
    # Statuses: Draft, Pending Approval, Approved, Open, On Hold, Closed, Cancelled
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    approved_date = Column(DateTime, nullable=True)
    expected_closing_date = Column(DateTime, nullable=True)
    
    __table_args__ = (
        CheckConstraint('salary_min <= salary_max', name='check_req_salary_range'),
        CheckConstraint('experience_min <= experience_max', name='check_req_exp_range'),
    )

    # Relationships
    hiring_manager = relationship("HiringManager", back_populates="requisitions")
    skill_requirements = relationship("SkillRequirement", back_populates="requisition", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="requisition")
    interview_panels = relationship("InterviewPanel", back_populates="requisition")


class SkillRequirement(Base):
    __tablename__ = "skill_requirements"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    requisition_id = Column(String(50), ForeignKey("requisitions.requisition_id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    min_proficiency = Column(Integer, default=3, nullable=False)  # 1 to 5
    min_experience_years = Column(Float, default=1.0, nullable=False)
    
    # Relationships
    requisition = relationship("Requisition", back_populates="skill_requirements")


class Candidate(Base):
    __tablename__ = "candidates"
    
    candidate_id = Column(String(50), primary_key=True, index=True)  # CAND-000001
    full_name = Column(String(150), nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(100), nullable=False)
    education = Column(String(150), nullable=False)
    experience_years = Column(Float, nullable=False)
    current_role = Column(String(150), nullable=True)
    current_company = Column(String(150), nullable=True)
    expected_salary = Column(Float, nullable=False)
    skills = Column(Text, nullable=True)  # JSON or comma-separated summary
    profile_created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    candidate_skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="candidate")


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(String(50), ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False)
    proficiency_level = Column(Integer, default=3, nullable=False)  # 1 to 5
    experience_years = Column(Float, default=1.0, nullable=False)
    
    # Relationships
    candidate = relationship("Candidate", back_populates="candidate_skills")


class Application(Base):
    __tablename__ = "applications"
    
    application_id = Column(String(100), primary_key=True, index=True)  # APP-<candidate_id>-<req_id>
    candidate_id = Column(String(50), ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=False, index=True)
    requisition_id = Column(String(50), ForeignKey("requisitions.requisition_id", ondelete="CASCADE"), nullable=False, index=True)
    current_stage = Column(String(50), default="Applied", nullable=False, index=True)
    # Stages: Applied, Screening, Assessment, Technical Interview, Manager Interview, Offer, Hired, Rejected, Withdrawn, On Hold
    application_status = Column(String(50), default="Active", nullable=False, index=True)
    # Active, Inactive, Completed
    applied_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        UniqueConstraint('candidate_id', 'requisition_id', name='uq_candidate_requisition_app'),
    )

    # Relationships
    candidate = relationship("Candidate", back_populates="applications")
    requisition = relationship("Requisition", back_populates="applications")
    stage_history = relationship("ApplicationStageHistory", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationStageHistory.timestamp")
    interviews = relationship("Interview", back_populates="application")
    offers = relationship("Offer", back_populates="application")


class ApplicationStageHistory(Base):
    __tablename__ = "application_stage_history"
    
    history_id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(String(100), ForeignKey("applications.application_id", ondelete="CASCADE"), nullable=False, index=True)
    previous_stage = Column(String(50), nullable=True)
    new_stage = Column(String(50), nullable=False)
    decision = Column(String(50), nullable=False)  # PASS, REJECT, WITHDRAW, HOLD, ADVANCE
    decision_reason = Column(Text, nullable=False)
    actor = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    related_rule_id = Column(String(50), nullable=True)
    
    # Relationships
    application = relationship("Application", back_populates="stage_history")


class InterviewPanel(Base):
    __tablename__ = "interview_panels"
    
    panel_id = Column(String(50), primary_key=True, index=True)  # PNL-000001
    requisition_id = Column(String(50), ForeignKey("requisitions.requisition_id", ondelete="CASCADE"), nullable=False, index=True)
    panel_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    requisition = relationship("Requisition", back_populates="interview_panels")
    members = relationship("PanelMember", back_populates="panel", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="panel")


class PanelMember(Base):
    __tablename__ = "panel_members"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    panel_id = Column(String(50), ForeignKey("interview_panels.panel_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    role_in_panel = Column(String(100), default="Technical Reviewer", nullable=False)
    
    __table_args__ = (
        UniqueConstraint('panel_id', 'user_id', name='uq_panel_user'),
    )

    # Relationships
    panel = relationship("InterviewPanel", back_populates="members")
    user = relationship("User", back_populates="panel_memberships")


class Availability(Base):
    __tablename__ = "availabilities"
    
    availability_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    start_time = Column(String(10), nullable=False)        # HH:MM
    end_time = Column(String(10), nullable=False)          # HH:MM
    is_booked = Column(Boolean, default=False, nullable=False)
    
    __table_args__ = (
        UniqueConstraint('user_id', 'date', 'start_time', 'end_time', name='uq_user_slot'),
    )

    # Relationships
    user = relationship("User", back_populates="availabilities")


class Interview(Base):
    __tablename__ = "interviews"
    
    interview_id = Column(String(50), primary_key=True, index=True)  # INT-2026-000001
    application_id = Column(String(100), ForeignKey("applications.application_id", ondelete="CASCADE"), nullable=False, index=True)
    panel_id = Column(String(50), ForeignKey("interview_panels.panel_id"), nullable=False, index=True)
    interview_type = Column(String(50), default="Technical Interview", nullable=False)
    scheduled_start = Column(DateTime, nullable=False, index=True)
    scheduled_end = Column(DateTime, nullable=False)
    status = Column(String(50), default="Scheduled", nullable=False, index=True)
    # Scheduled, Completed, Rescheduled, Cancelled
    calendar_notes = Column(Text, nullable=True)
    test_mode_conflict = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    application = relationship("Application", back_populates="interviews")
    panel = relationship("InterviewPanel", back_populates="interviews")
    scorecards = relationship("Scorecard", back_populates="interview", cascade="all, delete-orphan")


class Scorecard(Base):
    __tablename__ = "scorecards"
    
    scorecard_id = Column(String(100), primary_key=True, index=True)  # SCORE-<interview_id>-<reviewer_id>
    interview_id = Column(String(50), ForeignKey("interviews.interview_id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Criteria (1 to 5)
    technical_knowledge = Column(Float, nullable=False)  # 30%
    problem_solving = Column(Float, nullable=False)      # 25%
    communication = Column(Float, nullable=False)        # 15%
    role_specific_skills = Column(Float, nullable=False) # 20%
    collaboration = Column(Float, nullable=False)        # 10%
    
    weighted_score = Column(Float, nullable=False)       # Formula: SUM(criterion * weight)/5 * 100
    recommendation = Column(String(100), nullable=False)
    # Strong Recommendation, Further Review, Does Not Meet Evaluation Threshold
    feedback_comments = Column(Text, nullable=False)
    rubric_version = Column(String(20), default="1.0", nullable=False)
    is_complete = Column(Boolean, default=True, nullable=False)
    has_disagreement = Column(Boolean, default=False, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        UniqueConstraint('interview_id', 'reviewer_id', name='uq_interview_reviewer_scorecard'),
    )

    # Relationships
    interview = relationship("Interview", back_populates="scorecards")
    reviewer = relationship("User", back_populates="scorecards")


class Offer(Base):
    __tablename__ = "offers"
    
    offer_id = Column(String(50), primary_key=True, index=True)  # OFF-2026-000001
    application_id = Column(String(100), ForeignKey("applications.application_id", ondelete="CASCADE"), nullable=False, index=True)
    proposed_salary = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    bonus = Column(Float, default=0.0, nullable=False)
    joining_date = Column(DateTime, nullable=False)
    offer_status = Column(String(50), default="Draft", nullable=False, index=True)
    # Draft, Pending Approval, Approved, Rejected, Sent, Accepted, Declined, Expired
    version = Column(Integer, default=1, nullable=False)
    created_by = Column(String(50), ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    band_compliance_status = Column(String(50), default="Within Band", nullable=False)
    # Within Band, Above Maximum Band, Below Minimum Band
    
    # Relationships
    application = relationship("Application", back_populates="offers")
    approvals = relationship("Approval", back_populates="offer", cascade="all, delete-orphan")


class Approval(Base):
    __tablename__ = "approvals"
    
    approval_id = Column(String(50), primary_key=True, index=True)  # APPV-2026-000001
    offer_id = Column(String(50), ForeignKey("offers.offer_id", ondelete="CASCADE"), nullable=False, index=True)
    approver_id = Column(String(50), ForeignKey("users.user_id"), nullable=False, index=True)
    approval_level = Column(Integer, default=1, nullable=False)
    decision = Column(String(50), default="Pending", nullable=False, index=True)
    # Pending, Approved, Rejected
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    offer = relationship("Offer", back_populates="approvals")
    approver = relationship("User", back_populates="approvals")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    log_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)
    # CREATE, UPDATE, DELETE, TRANSITION, APPROVE, REJECT, SCHEDULE, EXCEPTION_RESOLVED
    entity = Column(String(50), nullable=False, index=True)
    entity_id = Column(String(100), nullable=False, index=True)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    reason = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")


class ExceptionLog(Base):
    __tablename__ = "exception_logs"
    
    exception_id = Column(String(50), primary_key=True, index=True)  # EXC-2026-000001
    entity_type = Column(String(50), nullable=False, index=True)     # Application, Interview, Offer, Evaluation, Requisition
    entity_id = Column(String(100), nullable=False, index=True)
    issue_type = Column(String(100), nullable=False, index=True)
    # 5 Mandatory Anomalies:
    # 1. Candidate moves forward without required review
    # 2. Interviewer double-booked
    # 3. Offer exceeds approved compensation band
    # 4. Withdrawn candidate remains scheduled
    # 5. Evaluation includes irrelevant criteria
    # Plus: Missing Scorecards, Invalid Stage Transition, Unapproved Requisition, Missing Approvals
    severity = Column(String(20), default="High", nullable=False, index=True)  # Critical, High, Medium, Low
    detected_rule_id = Column(String(50), nullable=False, index=True)
    expected_decision = Column(String(50), nullable=False)
    actual_decision = Column(String(50), nullable=False)
    resolution_status = Column(String(50), default="Open", nullable=False, index=True)
    # Open, In Progress, Resolved, Dismissed with justification
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    resolved_at = Column(DateTime, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"
    
    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO", nullable=False) # INFO, ALERT, EXCEPTION, APPROVAL
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="notifications")

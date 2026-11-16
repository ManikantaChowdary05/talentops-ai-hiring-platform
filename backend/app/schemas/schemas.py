from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# User & Auth
class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    username: str
    email: EmailStr
    full_name: str
    role: str
    department: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    username: str
    password: str

# Requisition
class SkillRequirementSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[int] = None
    skill_name: str
    is_mandatory: bool = True
    min_proficiency: int = Field(default=3, ge=1, le=5)
    min_experience_years: float = Field(default=1.0, ge=0.0)

class RequisitionCreate(BaseModel):
    job_title: str
    department: str
    location: str
    hiring_manager_id: str
    employment_type: str = "Full-time"
    experience_min: float
    experience_max: float
    salary_min: float
    salary_max: float
    positions_available: int = 1
    expected_closing_date: Optional[datetime] = None
    skills: Optional[List[SkillRequirementSchema]] = None

class RequisitionUpdate(BaseModel):
    job_title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    experience_min: Optional[float] = None
    experience_max: Optional[float] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    positions_available: Optional[int] = None
    requisition_status: Optional[str] = None
    expected_closing_date: Optional[datetime] = None

class RequisitionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    requisition_id: str
    job_title: str
    department: str
    location: str
    hiring_manager_id: str
    employment_type: str
    experience_min: float
    experience_max: float
    salary_min: float
    salary_max: float
    positions_available: int
    requisition_status: str
    created_date: datetime
    approved_date: Optional[datetime] = None
    expected_closing_date: Optional[datetime] = None
    skill_requirements: List[SkillRequirementSchema] = []

# Candidate
class CandidateSkillSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[int] = None
    skill_name: str
    proficiency_level: int = Field(default=3, ge=1, le=5)
    experience_years: float = Field(default=1.0, ge=0.0)

class CandidateCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: str
    education: str
    experience_years: float
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    expected_salary: float
    skills_list: Optional[List[CandidateSkillSchema]] = None

class CandidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    candidate_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    location: str
    education: str
    experience_years: float
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    expected_salary: float
    skills: Optional[str] = None
    profile_created_date: datetime
    candidate_skills: List[CandidateSkillSchema] = []

# Application
class ApplicationCreate(BaseModel):
    candidate_id: str
    requisition_id: str

class StageTransitionRequest(BaseModel):
    new_stage: str
    decision_reason: str
    actor: Optional[str] = None

class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    application_id: str
    candidate_id: str
    requisition_id: str
    current_stage: str
    application_status: str
    applied_date: datetime
    updated_at: datetime
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None

class StageHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    history_id: int
    application_id: str
    previous_stage: Optional[str]
    new_stage: str
    decision: str
    decision_reason: str
    actor: str
    timestamp: datetime
    related_rule_id: Optional[str]

# Interview & Scheduling
class InterviewCreate(BaseModel):
    application_id: str
    panel_id: str
    interview_type: str = "Technical Interview"
    scheduled_start: datetime
    scheduled_end: datetime
    calendar_notes: Optional[str] = None
    test_mode_conflict: bool = False

class InterviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    interview_id: str
    application_id: str
    panel_id: str
    interview_type: str
    scheduled_start: datetime
    scheduled_end: datetime
    status: str
    calendar_notes: Optional[str]
    test_mode_conflict: bool
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None

# Availability
class AvailabilityCreate(BaseModel):
    user_id: str
    date: str
    start_time: str
    end_time: str

class AvailabilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    availability_id: int
    user_id: str
    date: str
    start_time: str
    end_time: str
    is_booked: bool

# Scorecard
class ScorecardCreate(BaseModel):
    interview_id: str
    reviewer_id: str
    technical_knowledge: float = Field(..., ge=1, le=5)
    problem_solving: float = Field(..., ge=1, le=5)
    communication: float = Field(..., ge=1, le=5)
    role_specific_skills: float = Field(..., ge=1, le=5)
    collaboration: float = Field(..., ge=1, le=5)
    feedback_comments: str
    extra_criteria: Optional[Dict[str, Any]] = None

class ScorecardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    scorecard_id: str
    interview_id: str
    reviewer_id: str
    reviewer_name: Optional[str] = None
    technical_knowledge: float
    problem_solving: float
    communication: float
    role_specific_skills: float
    collaboration: float
    weighted_score: float
    recommendation: str
    feedback_comments: str
    rubric_version: str
    is_complete: bool
    has_disagreement: bool
    submitted_at: datetime

# Offer
class OfferCreate(BaseModel):
    application_id: str
    proposed_salary: float
    currency: str = "USD"
    bonus: float = 0.0
    joining_date: datetime

class OfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    offer_id: str
    application_id: str
    proposed_salary: float
    currency: str
    bonus: float
    joining_date: datetime
    offer_status: str
    version: int
    created_by: str
    created_at: datetime
    band_compliance_status: str
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None

# Approval
class ApprovalActionRequest(BaseModel):
    decision: str  # "Approved" or "Rejected"
    comments: Optional[str] = None

class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    approval_id: str
    offer_id: str
    approver_id: str
    approver_name: Optional[str] = None
    approval_level: int
    decision: str
    comments: Optional[str]
    timestamp: datetime

# Exception
class ExceptionResolveRequest(BaseModel):
    resolution_status: str  # "Resolved", "Dismissed"
    comments: str

class ExceptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    exception_id: str
    entity_type: str
    entity_id: str
    issue_type: str
    severity: str
    detected_rule_id: str
    expected_decision: str
    actual_decision: str
    resolution_status: str
    comments: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

# Audit
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    log_id: int
    user_id: Optional[str]
    user_name: Optional[str] = None
    action: str
    entity: str
    entity_id: str
    previous_value: Optional[str]
    new_value: Optional[str]
    timestamp: datetime
    reason: Optional[str]

# Copilot / AI schemas
class CopilotQueryRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

class FitAnalysisRequest(BaseModel):
    candidate_id: str
    requisition_id: str
